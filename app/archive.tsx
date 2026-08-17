"use client";

import Link from "next/link";
import { useState } from "react";

export type ArchiveItem = {
  repoName: string;
  title: string;
  summary: string;
  category: string;
  stack: string;
  visibility: "PUBLIC" | "PRIVATE";
  ongoing: boolean;
  detailHref: string | null;
  githubUrl: string | null;
  updatedAt: string | null;
};

function ArchiveRow({ project, index }: { project: ArchiveItem; index: number }) {
  const content = (
    <>
      <span className="archive-num">{String(index + 1).padStart(2, "0")}</span>
      <div className="archive-title">
        <small>
          {project.category}
          {project.ongoing && <span className="status-chip">IN PROGRESS</span>}
        </small>
        <h3>{project.title}</h3>
      </div>
      <p>{project.summary}</p>
      <div className="archive-stack">{project.stack}</div>
      <span className="visibility">{project.visibility}</span>
      <span className="archive-arrow" aria-hidden="true">
        {project.detailHref ? "→" : project.githubUrl ? "↗" : ""}
      </span>
    </>
  );

  if (project.detailHref) {
    return (
      <Link href={project.detailHref} className="archive-row archive-row-link">
        {content}
      </Link>
    );
  }

  if (project.githubUrl) {
    return (
      <a
        href={project.githubUrl}
        className="archive-row archive-row-link"
        target="_blank"
        rel="noreferrer"
      >
        {content}
      </a>
    );
  }

  return <article className="archive-row">{content}</article>;
}

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
        {filteredProjects.length === 0 ? (
          <p className="archive-empty">해당 분야의 공개 프로젝트가 없습니다.</p>
        ) : (
          filteredProjects.map((project, index) => (
            <ArchiveRow project={project} index={index} key={project.repoName} />
          ))
        )}
      </div>
    </section>
  );
}
