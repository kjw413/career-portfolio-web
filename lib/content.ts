import profileJson from "../content/profile.json";
import experiencesJson from "../content/experience.json";
import projectOverridesJson from "../content/project-overrides.json";

export type Metric = { id: string; value: string; label: string; evidence: string };
export type Impact = {
  id: string; title: string; problem: string; action: string;
  result: string; projectSlug: string | null;
};
export type Education = {
  school: string; degree: string; period: string; detail: string;
};
export type Career = {
  company: string; position: string; detail: string;
  startDate: string; endDate: string | null;
};
export type Profile = {
  name: string; nameEn: string; role: string; major: string; summary: string;
  photoSrc: string | null; resumeHref: string | null;
  githubUrl: string; emailHref: string | null;
  education: Education; career: Career; certifications: string[];
  metrics: Metric[]; impacts: Impact[];
};
export type Experience = {
  id: string; period: string; organization: string; role: string;
  summary: string; details: string[]; tags: string[];
};
export type ProjectOverride = {
  repoName: string; title?: string; summary?: string; category?: string;
  featured?: number; order?: number; included: boolean;
};

type ContentRecord = Record<string, unknown>;

function requireRecord(value: unknown, label: string): ContentRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as ContentRecord;
}

export function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireNullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return requireString(value, label);
}

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((item, index) => requireString(item, `${label}[${index}]`));
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function freezeProfile(profile: Profile): Profile {
  return Object.freeze({
    ...profile,
    education: Object.freeze({ ...profile.education }),
    career: Object.freeze({ ...profile.career }),
    certifications: Object.freeze([...profile.certifications]) as string[],
    metrics: Object.freeze(profile.metrics.map((metric) => Object.freeze({ ...metric }))) as Metric[],
    impacts: Object.freeze(profile.impacts.map((impact) => Object.freeze({ ...impact }))) as Impact[],
  });
}

function parseEducation(value: unknown): Education {
  const education = requireRecord(value, "profile.education");
  return {
    school: requireString(education.school, "profile.education.school"),
    degree: requireString(education.degree, "profile.education.degree"),
    period: requireString(education.period, "profile.education.period"),
    detail: requireString(education.detail, "profile.education.detail"),
  };
}

function parseCareer(value: unknown): Career {
  const career = requireRecord(value, "profile.career");
  const startDate = requireString(career.startDate, "profile.career.startDate");
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(startDate)) {
    throw new Error(`profile.career.startDate must be YYYY-MM or YYYY-MM-DD: ${startDate}`);
  }
  return {
    company: requireString(career.company, "profile.career.company"),
    position: requireString(career.position, "profile.career.position"),
    detail: requireString(career.detail, "profile.career.detail"),
    startDate,
    endDate: requireNullableString(career.endDate, "profile.career.endDate"),
  };
}

function parseProfile(value: unknown): Profile {
  const profile = requireRecord(value, "profile");
  const metrics = requireArray(profile.metrics, "profile.metrics").map((item, index) => {
    const metric = requireRecord(item, `profile.metrics[${index}]`);
    const evidence = requireString(metric.evidence, `profile.metrics[${index}].evidence`);
    return {
      id: requireString(metric.id, `profile.metrics[${index}].id`),
      value: requireString(metric.value, `profile.metrics[${index}].value`),
      label: requireString(metric.label, `profile.metrics[${index}].label`),
      evidence,
    };
  });
  const impacts = requireArray(profile.impacts, "profile.impacts").map((item, index) => {
    const impact = requireRecord(item, `profile.impacts[${index}]`);
    return {
      id: requireString(impact.id, `profile.impacts[${index}].id`),
      title: requireString(impact.title, `profile.impacts[${index}].title`),
      problem: requireString(impact.problem, `profile.impacts[${index}].problem`),
      action: requireString(impact.action, `profile.impacts[${index}].action`),
      result: requireString(impact.result, `profile.impacts[${index}].result`),
      projectSlug: requireNullableString(impact.projectSlug, `profile.impacts[${index}].projectSlug`),
    };
  });

  return {
    name: requireString(profile.name, "profile.name"),
    nameEn: requireString(profile.nameEn, "profile.nameEn"),
    role: requireString(profile.role, "profile.role"),
    major: requireString(profile.major, "profile.major"),
    summary: requireString(profile.summary, "profile.summary"),
    photoSrc: requireNullableString(profile.photoSrc, "profile.photoSrc"),
    resumeHref: requireNullableString(profile.resumeHref, "profile.resumeHref"),
    githubUrl: requireString(profile.githubUrl, "profile.githubUrl"),
    emailHref: requireNullableString(profile.emailHref, "profile.emailHref"),
    education: parseEducation(profile.education),
    career: parseCareer(profile.career),
    certifications: requireStringArray(profile.certifications, "profile.certifications"),
    metrics,
    impacts,
  };
}

function parseExperiences(value: unknown): Experience[] {
  return requireArray(value, "experiences").map((item, index) => {
    const experience = requireRecord(item, `experiences[${index}]`);
    return {
      id: requireString(experience.id, `experiences[${index}].id`),
      period: requireString(experience.period, `experiences[${index}].period`),
      organization: requireString(experience.organization, `experiences[${index}].organization`),
      role: requireString(experience.role, `experiences[${index}].role`),
      summary: requireString(experience.summary, `experiences[${index}].summary`),
      details: requireStringArray(experience.details, `experiences[${index}].details`),
      tags: requireStringArray(experience.tags, `experiences[${index}].tags`),
    };
  });
}

function parseProjectOverrides(value: unknown): ProjectOverride[] {
  const repoNames = new Set<string>();
  return requireArray(value, "project overrides").map((item, index) => {
    const override = requireRecord(item, `project overrides[${index}]`);
    const repoName = requireString(override.repoName, `project overrides[${index}].repoName`);
    if (repoNames.has(repoName)) throw new Error(`duplicate project override repoName: ${repoName}`);
    repoNames.add(repoName);

    const optionalString = (key: "title" | "summary" | "category") =>
      override[key] === undefined ? undefined : requireString(override[key], `project overrides[${index}].${key}`);
    const optionalNumber = (key: "featured" | "order") =>
      override[key] === undefined ? undefined : requireNumber(override[key], `project overrides[${index}].${key}`);
    if (typeof override.included !== "boolean") {
      throw new Error(`project overrides[${index}].included must be a boolean`);
    }

    return {
      repoName,
      title: optionalString("title"),
      summary: optionalString("summary"),
      category: optionalString("category"),
      featured: optionalNumber("featured"),
      order: optionalNumber("order"),
      included: override.included,
    };
  });
}

const profile = parseProfile(profileJson);
const experiences = parseExperiences(experiencesJson);
const projectOverrides = parseProjectOverrides(projectOverridesJson);

export function getProfile(): Profile {
  return freezeProfile(profile);
}

export function getExperiences(): Experience[] {
  return Object.freeze(experiences.map((experience) => Object.freeze({
    ...experience,
    details: Object.freeze([...experience.details]) as string[],
    tags: Object.freeze([...experience.tags]) as string[],
  }))) as Experience[];
}

export function getProjectOverrides(): ProjectOverride[] {
  return Object.freeze(projectOverrides.map((override) => Object.freeze({ ...override }))) as ProjectOverride[];
}
