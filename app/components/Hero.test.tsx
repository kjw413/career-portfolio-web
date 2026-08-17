import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Hero from "./Hero";

afterEach(cleanup);

const profile = {
  name: "김종우", role: "시스템 문제 해결형 엔지니어", major: "전자전기공학",
  summary: "현장과 시스템을 연결합니다.", photoSrc: null, resumeHref: null,
  githubUrl: "https://github.com/kjw413", emailHref: null,
  metrics: [{ id: "saved-time", value: "월 약 12.8시간", label: "반복 업무 절감시간", evidence: "연 154시간 ÷ 12개월" }],
  impacts: []
};

describe("Hero", () => {
  it("shows identity and initials without a photo", () => {
    render(<Hero profile={profile} />);
    expect(screen.getByRole("heading", { name: "시스템 문제 해결형 엔지니어" })).toBeInTheDocument();
    expect(screen.getByLabelText("프로필 사진 준비 중")).toHaveTextContent("KJ");
  });

  it("hides the resume action until a file exists", () => {
    render(<Hero profile={profile} />);
    expect(screen.queryByRole("link", { name: "이력서" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/kjw413");
  });

  it("marks the three-action layout when a resume exists", () => {
    render(<Hero profile={{ ...profile, resumeHref: "/resume.pdf" }} />);
    const resumeLink = screen.getByRole("link", { name: "이력서" });
    expect(resumeLink).toHaveAttribute("href", "/resume.pdf");
    expect(resumeLink.parentElement).toHaveClass("has-resume");
  });
});
