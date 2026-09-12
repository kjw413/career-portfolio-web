import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Profile } from "../../lib/content";
import Hero, { type HeadlineMetric } from "./Hero";

afterEach(cleanup);

const profile: Profile = {
  name: "김종우", nameEn: "Jong Woo Kim",
  role: "전자전기공학 학사 · 제조 현장 3년차", major: "전자전기공학",
  summary: "5개 공장의 에너지·생산 데이터를 통합했습니다.",
  photoSrc: null, resumeHref: null,
  githubUrl: "https://github.com/kjw413", emailHref: "mailto:kjw2110@naver.com",
  education: {
    school: "홍익대학교 (서울)", degree: "전자전기공학부 학사",
    period: "2018.03 입학 · 2024.02 졸업", detail: "학점 3.50 / 4.50 · 이수 136학점",
  },
  career: {
    company: "빙그레", position: "생산담당 생산기술팀 사원",
    detail: "유틸리티·에너지 관리", startDate: "2024-12-23", endDate: null,
  },
  certifications: ["ADsP 데이터분석 준전문가", "OPIc IH (영어)"],
  headlineMetricIds: ["mis-rpa-daily-saving"],
  impacts: [],
};

const metrics: HeadlineMetric[] = [
  {
    id: "mis-rpa-daily-saving",
    display: "일 40분",
    label: "본인 데이터 수집 업무 시간 절감",
    condition: "생산 · 에너지 · 재공품 3종 수집 · 월 22일 기준 약 14.7시간",
    basis: "사용자 확정 2026-09-11",
    status: "확정",
    cardIds: ["EXP-BG-DATA-RPA"],
    cardId: "EXP-BG-DATA-RPA",
  },
];

describe("Hero", () => {
  it("leads with the education and career facts a recruiter screens for", () => {
    render(<Hero profile={profile} metrics={metrics} />);

    expect(screen.getByText("학력")).toBeInTheDocument();
    expect(screen.getByText("홍익대학교 (서울) 전자전기공학부 학사")).toBeInTheDocument();
    expect(screen.getByText("빙그레 생산담당 생산기술팀 사원")).toBeInTheDocument();
    expect(screen.getByText(/재직 중/)).toBeInTheDocument();
    expect(screen.getByText("ADsP 데이터분석 준전문가")).toBeInTheDocument();
  });

  it("shows identity and initials without a photo", () => {
    render(<Hero profile={profile} metrics={metrics} />);
    expect(
      screen.getByRole("heading", { name: "전자전기공학 학사 · 제조 현장 3년차" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("프로필 사진 준비 중")).toHaveTextContent("KJ");
  });

  it("keeps the measurement condition visible instead of hiding it in a tooltip", () => {
    render(<Hero profile={profile} metrics={metrics} />);
    expect(screen.getByText(/월 22일 기준 약 14.7시간/)).toBeVisible();
  });

  it("links each headline number to the experience that produced it", () => {
    render(<Hero profile={profile} metrics={metrics} />);
    // 끝의 슬래시는 빌드 설정(trailingSlash)이 붙이므로 경로만 확인합니다.
    expect(screen.getByRole("link", { name: /근거 보기/ }).getAttribute("href")).toMatch(
      /^\/experience\/EXP-BG-DATA-RPA\/?$/,
    );
  });

  it("links the contact email and hides the resume action until a file exists", () => {
    render(<Hero profile={profile} metrics={metrics} />);

    expect(screen.getByRole("link", { name: "kjw2110@naver.com" })).toHaveAttribute(
      "href",
      "mailto:kjw2110@naver.com",
    );
    expect(screen.queryByRole("link", { name: "이력서" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/kjw413",
    );
  });

  it("marks the three-action layout when a resume exists", () => {
    render(<Hero profile={{ ...profile, resumeHref: "/resume.pdf" }} metrics={metrics} />);
    const resumeLink = screen.getByRole("link", { name: "이력서" });
    expect(resumeLink).toHaveAttribute("href", "/resume.pdf");
    expect(resumeLink.parentElement).toHaveClass("has-resume");
  });
});
