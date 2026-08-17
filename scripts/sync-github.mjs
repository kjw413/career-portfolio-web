import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OWNER = "kjw413";
const REPOS_URL = `https://api.github.com/users/${OWNER}/repos`;

/**
 * @typedef {Object} GithubRepo
 * @property {string} name
 * @property {string} htmlUrl
 * @property {string | null} description
 * @property {string | null} language
 * @property {string[]} topics
 * @property {string} updatedAt
 * @property {number} stars
 * @property {boolean} archived
 * @property {boolean} fork
 */

function requireRecord(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function requireNullableString(value, label) {
  if (value === null) return null;
  return requireString(value, label);
}

function requireBoolean(value, label) {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be a boolean`);
  return value;
}

function requireNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return value;
}

function requireStringArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value.map((item, index) => requireString(item, `${label}[${index}]`));
}

/** @param {unknown} repo @returns {GithubRepo} */
export function normalizeRepo(repo) {
  const source = requireRecord(repo, "repository");
  return {
    name: requireString(source.name, "repository.name"),
    htmlUrl: requireString(source.html_url, "repository.html_url"),
    description: requireNullableString(source.description, "repository.description"),
    language: requireNullableString(source.language, "repository.language"),
    topics: requireStringArray(source.topics, "repository.topics"),
    updatedAt: requireString(source.updated_at, "repository.updated_at"),
    stars: requireNumber(source.stargazers_count, "repository.stargazers_count"),
    archived: requireBoolean(source.archived, "repository.archived"),
    fork: requireBoolean(source.fork, "repository.fork"),
  };
}

function validateCachedRepo(repo) {
  const source = requireRecord(repo, "cached repository");
  return {
    name: requireString(source.name, "cached repository.name"),
    htmlUrl: requireString(source.htmlUrl, "cached repository.htmlUrl"),
    description: requireNullableString(source.description, "cached repository.description"),
    language: requireNullableString(source.language, "cached repository.language"),
    topics: requireStringArray(source.topics, "cached repository.topics"),
    updatedAt: requireString(source.updatedAt, "cached repository.updatedAt"),
    stars: requireNumber(source.stars, "cached repository.stars"),
    archived: requireBoolean(source.archived, "cached repository.archived"),
    fork: requireBoolean(source.fork, "cached repository.fork"),
  };
}

async function readCache(outputPath) {
  const cache = requireRecord(JSON.parse(await readFile(outputPath, "utf8")), "cache");
  requireString(cache.generatedAt, "cache.generatedAt");
  if (cache.owner !== OWNER) throw new TypeError(`cache.owner must be ${OWNER}`);
  if (!Array.isArray(cache.repos)) throw new TypeError("cache.repos must be an array");
  return cache.repos.map(validateCachedRepo);
}

/** @param {typeof fetch} fetchImpl @param {string} token @returns {Promise<GithubRepo[]>} */
export async function fetchAllRepos(fetchImpl, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "kjw413-career-portfolio-web",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const repos = [];

  for (let page = 1; ; page += 1) {
    const url = `${REPOS_URL}?per_page=100&type=public&sort=updated&page=${page}`;
    const response = await fetchImpl(url, { headers });
    if (!response.ok) throw new Error(`GitHub API request failed with status ${response.status}`);

    const pageRepos = await response.json();
    if (!Array.isArray(pageRepos)) throw new TypeError("GitHub API response must be an array");
    repos.push(...pageRepos.filter((repo) => repo?.private !== true).map(normalizeRepo));
    if (pageRepos.length < 100) return repos;
  }
}

/**
 * @param {{ fetchImpl: typeof fetch, outputPath: string, token: string }} options
 * @returns {Promise<{ source: "network" | "cache", count: number }>}
 */
export async function syncGithubRepos({ fetchImpl, outputPath, token }) {
  try {
    const repos = await fetchAllRepos(fetchImpl, token);
    const cache = JSON.stringify({ generatedAt: new Date().toISOString(), owner: OWNER, repos }, null, 2) + "\n";
    const temporaryPath = `${outputPath}.tmp`;
    await writeFile(temporaryPath, cache);
    await rename(temporaryPath, outputPath);
    return { source: "network", count: repos.length };
  } catch (error) {
    try {
      const repos = await readCache(outputPath);
      return { source: "cache", count: repos.length };
    } catch {
      throw error;
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await syncGithubRepos({
    fetchImpl: fetch,
    outputPath: path.join(process.cwd(), "content/generated/github-repos.json"),
    token: process.env.GITHUB_TOKEN ?? "",
  });
  console.log(`GitHub repository sync: ${result.source} (${result.count} repositories)`);
}
