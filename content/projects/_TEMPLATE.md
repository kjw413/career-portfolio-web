---
# ── 새 프로젝트를 추가하려면 ──────────────────────────────────
# 1. 이 파일을 복사해 영문-소문자-하이픈 이름으로 저장 (예: my-new-project.md)
#    ※ 파일명이 상세 페이지 주소가 됩니다: /projects/my-new-project/
#    ※ _(밑줄)로 시작하는 파일은 사이트에 표시되지 않습니다.
# 2. 아래 필드를 채우고, --- 아래 본문에 수행과정·성과를 마크다운으로 작성
# 3. 공개 제목·분류·대표 노출·아카이브 순서는 같은 repoName 항목을
#    content/project-overrides.json에 추가하거나 수정 (override가 아래 값보다 우선)
# 4. main 브랜치에 커밋하면 2~3분 내 자동으로 사이트에 반영됩니다.

title: "한글 표시 제목"            # 상세 페이지 제목 + override title이 없을 때의 표시 제목 fallback
repoName: "github-repo-name"       # GitHub·override·마크다운을 연결하는 저장소명 키 (필수에 준함)
category: "AI · DATA"              # override category가 없을 때의 fallback
kind: "AI · DATA · WEB"            # (선택) 대표 카드 상단 라벨
summary: "아카이브 목록에 보이는 한 줄 설명"   # 필수
intro: "대표 카드와 상세 페이지 상단에 보이는 소개 문장"   # (선택) 없으면 summary 사용
period: "2026"                     # (선택) 수행 기간
tags: [Python, MySQL]              # (선택) 기술 태그. 없으면 stack에서 자동 생성
stack: "Python · MySQL"            # 아카이브 목록에 보이는 기술 스택
github: "https://github.com/kjw413/저장소명"   # (선택) GitHub 링크
visibility: "PUBLIC"               # PUBLIC 또는 PRIVATE
status: "ongoing"                  # 진행 중이면 ongoing, 완료면 completed
featured: 4                        # (선택) override featured가 없을 때의 대표 노출 순서 fallback
order: 9                           # override order가 없을 때의 아카이브 정렬 fallback

# ── 이미지 (선택) — public/projects/ 에 파일을 올린 뒤 아래처럼 연결 ──
# 자세한 방법과 회사 데이터 주의사항은 public/projects/README.md 참고
# cover:                           # 카드 썸네일 + 상세 페이지 상단 대표 이미지
#   src: "/projects/my-screenshot.png"
#   caption: "무엇을 보여주는 화면인지 한 줄"
# gallery:                         # 상세 페이지 하단 스크린샷·GIF 목록
#   - src: "/projects/run.gif"
#     caption: "실행 과정 (18초)"
#   - src: "/projects/detail.png"
#     caption: "세부 화면"
#     tall: true                   # 세로로 긴 캡처는 원본 비율 유지
---

## 문제 정의

프로젝트가 어떤 문제를 다루는지 2~3문장으로 소개합니다.

## 사용자와 현장 맥락

누가 어떤 환경에서 이 문제를 겪는지 작성합니다.

## 제약 조건

데이터, 시스템, 일정, 보안 등 해결 과정의 제약을 작성합니다.

## 분석과 설계

문제를 어떻게 분석하고 해결 구조를 설계했는지 작성합니다.

## 구현

- 어떤 데이터를 다뤘고, 어떤 방법으로 접근했는지
- 어떤 기능을 구현했는지

## 검증 결과

- 정량 성과 (예: 예측 오차 n% 달성, 처리 시간 n시간 → n분)
- 정성 성과 (예: 실제 업무에 적용, 사용자 확대)

## 본인의 역할

직접 맡은 범위와 핵심 의사결정을 작성합니다.

## 배운 점과 다음 개선

프로젝트에서 배운 점과 다음에 개선할 내용을 작성합니다.
