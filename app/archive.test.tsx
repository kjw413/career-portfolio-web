import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Archive, { type ArchiveItem } from "./archive";

afterEach(cleanup);

const filters = ["ALL", "제조·자동화", "데이터·AI", "임베디드", "웹·도구"];

const projects: ArchiveItem[] = [
  {
    repoName: "internal-project",
    title: "내부 사례",
    summary: "상세 사례가 있는 데이터 프로젝트",
    category: "데이터·AI",
    stack: "Python",
    visibility: "PRIVATE",
    ongoing: false,
    detailHref: "/projects/internal-project/",
    githubUrl: null,
    updatedAt: null,
  },
  {
    repoName: "external-project",
    title: "공개 저장소",
    summary: "GitHub에서 확인하는 웹 도구",
    category: "웹·도구",
    stack: "TypeScript",
    visibility: "PUBLIC",
    ongoing: true,
    detailHref: null,
    githubUrl: "https://github.com/kjw413/external-project",
    updatedAt: "2026-08-15T00:00:00Z",
  },
];

describe("Archive", () => {
  it("uses the curated catalog title as the row heading", () => {
    render(<Archive projects={projects} filters={filters} />);

    expect(screen.getByRole("heading", { name: "내부 사례" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "internal-project" })).not.toBeInTheDocument();
  });

  it("filters catalog items and opens GitHub-only projects in a new tab", () => {
    render(<Archive projects={projects} filters={filters} />);

    fireEvent.click(screen.getByRole("button", { name: "웹·도구" }));

    expect(screen.queryByText("내부 사례")).not.toBeInTheDocument();
    const externalLink = screen.getByRole("link", { name: /공개 저장소/ });
    expect(externalLink).toBeInTheDocument();
    expect(externalLink).toHaveAttribute("target", "_blank");
  });

  it("shows an empty state for a category without public projects", () => {
    render(<Archive projects={projects} filters={filters} />);

    fireEvent.click(screen.getByRole("button", { name: "임베디드" }));

    expect(screen.getByText("해당 분야의 공개 프로젝트가 없습니다.")).toBeInTheDocument();
  });
});
