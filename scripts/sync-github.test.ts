import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fetchAllRepos, normalizeRepo, syncGithubRepos } from "./sync-github.mjs";

function apiRepo(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    html_url: `https://github.com/kjw413/${name}`,
    description: `${name} description`,
    language: "TypeScript",
    topics: ["web"],
    updated_at: "2026-08-15T00:00:00Z",
    stargazers_count: 0,
    archived: false,
    fork: false,
    private: false,
    ...overrides,
  };
}

function okResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    headers: new Headers(),
  };
}

describe("GitHub repository sync", () => {
  it("keeps only public portfolio metadata", () => {
    expect(normalizeRepo({
      name: "demo", html_url: "https://github.com/kjw413/demo",
      description: "Demo", language: "TypeScript", topics: ["web"],
      updated_at: "2026-08-15T00:00:00Z", stargazers_count: 2,
      archived: false, fork: false, private: false
    })).toEqual({
      name: "demo", htmlUrl: "https://github.com/kjw413/demo",
      description: "Demo", language: "TypeScript", topics: ["web"],
      updatedAt: "2026-08-15T00:00:00Z", stars: 2,
      archived: false, fork: false
    });
  });

  it("uses the existing valid cache when the API fails", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "portfolio-sync-"));
    const outputPath = path.join(dir, "github-repos.json");
    await writeFile(outputPath, JSON.stringify({ generatedAt: "2026-08-16T00:00:00.000Z", owner: "kjw413", repos: [] }));
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(syncGithubRepos({ fetchImpl, outputPath, token: "" }))
      .resolves.toEqual({ source: "cache", count: 0 });
  });

  it("does not overwrite a valid cache with malformed API data", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "portfolio-sync-"));
    const outputPath = path.join(dir, "github-repos.json");
    const original = JSON.stringify({ generatedAt: "2026-08-16T00:00:00.000Z", owner: "kjw413", repos: [] });
    await writeFile(outputPath, original);
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: "bad shape" }), headers: new Headers() });
    await syncGithubRepos({ fetchImpl, outputPath, token: "" });
    expect(await readFile(outputPath, "utf8")).toBe(original);
  });

  it("requests another page at the 100-item boundary and stops on the short page", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      apiRepo(`repo-${index}`),
    );
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(okResponse(firstPage))
      .mockResolvedValueOnce(okResponse([apiRepo("repo-100")]));

    await expect(fetchAllRepos(fetchImpl, "")).resolves.toHaveLength(101);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      expect.stringContaining("page=1"),
      expect.stringContaining("page=2"),
    ]);
  });

  it("omits private repositories returned by the API", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse([
      apiRepo("public-repo"),
      apiRepo("private-repo", { private: true }),
    ]));

    await expect(fetchAllRepos(fetchImpl, "")).resolves.toEqual([
      expect.objectContaining({ name: "public-repo" }),
    ]);
  });

  it("uses Authorization only for the request and never serializes it into cache", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "portfolio-sync-"));
    const outputPath = path.join(dir, "github-repos.json");
    const token = "github-secret-token";
    const fetchImpl = vi.fn().mockResolvedValue(okResponse([apiRepo("demo")]));

    await syncGithubRepos({ fetchImpl, outputPath, token });

    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      headers: { Authorization: `Bearer ${token}` },
    });
    const cache = await readFile(outputPath, "utf8");
    expect(cache).not.toContain(token);
    expect(cache).not.toContain("Authorization");
  });

  it("rejects the network error when the existing cache is invalid", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "portfolio-sync-"));
    const outputPath = path.join(dir, "github-repos.json");
    await writeFile(outputPath, JSON.stringify({ owner: "wrong-owner", repos: [] }));
    const networkError = new Error("offline");
    const fetchImpl = vi.fn().mockRejectedValue(networkError);

    await expect(syncGithubRepos({ fetchImpl, outputPath, token: "" }))
      .rejects.toBe(networkError);
  });
});
