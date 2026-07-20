"use client";

import Link from "next/link";
import { useState } from "react";

export type ArchiveItem = {
  slug: string;
  category: string;
  repoName: string;
  summary: string;
  stack: string | null;
  visibility: string;
  ongoing: boolean;
};

export default function Archive({
  projects,
  filters,
}: {
  projects: ArchiveItem[];
  filters: string[];
}) {
  const [filter, setFilter] = useState("ALL");
  const filteredProjects =
    filter === "ALL"
      ? projects
      : projects.filter((project) => project.category === filter);

  return (
    <section className="archive-section" id="archive">
      <div className="archive-header">
        <div>
          <p className="section-index">05 / PROJECT ARCHIVE</p>
          <h2>전체 프로젝트 저장소</h2>
        </div>
        <div className="filter-row" role="group" aria-label="프로젝트 분야 필터">
          {filters.map((item) => (
            <button
              type="button"
              className={filter === item ? "active" : ""}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="archive-list" aria-live="polite">
        {filteredProjects.map((project, index) => (
          <Link
            href={`/projects/${project.slug}/`}
            className="archive-row"
            key={project.slug}
          >
            <span className="archive-num">{String(index + 1).padStart(2, "0")}</span>
            <div className="archive-title">
              <small>
                {project.category}
                {project.ongoing && <span className="status-chip">IN PROGRESS</span>}
              </small>
              <h3>{project.repoName}</h3>
            </div>
            <p>{project.summary}</p>
            <div className="archive-stack">{project.stack}</div>
            <span className="visibility">{project.visibility}</span>
            <span className="archive-arrow">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
