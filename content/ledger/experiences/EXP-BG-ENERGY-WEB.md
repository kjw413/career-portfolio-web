---
id: EXP-BG-ENERGY-WEB
title: 5개 공장 에너지 관리 웹 시스템 구축
status: 진행중
affiliation: binggrae
role: 기획·개발 (사내 AI 전문가 과정 팀과제)
period:
  start: "2026-03-01"
  end: null
  asOf: "2026-09-12"
headline: "5개 공장의 조회·예측·진단·보고를 한 화면으로 통합 — 월간 에너지 실적 보고용 취합 업무 {{metric:bems-monthly-saving}} 절감"
highlights:
  - "공장별로 다른 생산·에너지 데이터 형식을 표준화해 로컬 MySQL에 저장"
  - "조회·비교·원단위 분석·예측·AI 보고서를 한 시스템에서 수행"
  - "사내망으로 타 팀 직원도 접속해 실적을 확인"
teamContext: "사내 AI 전문가 과정의 팀과제다. 팀 결과물 전체를 개인 단독 성과로 쓰거나 기여율을 추정하지 않는다."
metricIds: [bems-monthly-saving, bems-plants, aielite-ratio]
tags: [제조AI, 생산기술, MES, 스마트팩토리, 에너지, 데이터분석, 시스템개선]
useFor: [제조 AI·데이터, 에너지·유틸리티, MES 운영·스마트팩토리, 생산기술·설비기술]
excludeFor: []
relatedCards: [EXP-BG-ENERGY-FORECAST, EXP-BG-DATA-RPA]
projectSlugs: [ai-elite-bems]
evidence:
  - type: repo
    label: "AI-Elite-BEMS — 사내 운영 버전"
    url: "https://github.com/kjw413/AI-Elite-BEMS"
  - type: repo
    label: "ai-elite-bems-next — 개발 중인 React·FastAPI 버전"
    url: "https://github.com/kjw413/ai-elite-bems-next"
canonical:
  - "공장별로 다른 생산·에너지 데이터 형식을 표준화해 로컬 MySQL에 저장하고, 조회·비교·원단위 분석·예측·AI 보고서를 한 시스템에서 수행하도록 구성했다."
  - "담당자들의 월간 에너지 실적 보고용 취합 업무를 대체해 월 4시간을 절감했다."
forbidden:
  - "예측값 기준의 전사 관리 체계로 전환했다"
  - "예측치를 공식 점검 기준으로 정착시키고 전사적 합의를 얻었다"
openQuestions: [OQ-BEMS-STACK]
publicOnSite: true
order: 1
---

## 배경

본부장이 전사 에너지 일일 alert 시스템 구축을 지시한 것이 출발점이었습니다. 처음에는
최근 6주와 전년 동기간의 원단위 가중이동평균을 비교하는 방식으로 기획했으나, 이상 판단
기준이 모호하고 담당자가 이해하기 어렵다는 의견을 받았습니다.

명확하고 이해 가능한 비교 기준이 필요하다고 느끼던 중 사내 AI 전문가 과정에 선발되었고,
기존 MIS·MES에 시각화·분석 기능이 없다는 문제를 팀과제로 다루며 이 시스템을 기획했습니다.

## 수행

- 공장별로 다른 생산·에너지 데이터 형식을 표준화
- 데이터를 로컬 MySQL 서버에 저장하는 구조 설계
- 공장·기간별 조회와 비교, 단위생산량당 에너지 사용량(원단위) 분석 구현
- 생산·날씨 기반 예측과 AI 보고서 기능 구성
- 사내망 기반으로 타 팀 직원도 접속해 실적을 확인할 수 있도록 배포

기술 구성은 Python, MySQL, FastAPI 백엔드에 Streamlit 프론트엔드이고, 시계열 예측과
LangChain 기반 LLM 보고서를 함께 씁니다. 백엔드·UI·머신러닝 코드는 AI 에이전트
프롬프팅으로 구현했습니다.

## 성과

{{metric:bems-monthly-saving}} — 담당자들의 월간 에너지 실적 보고용 취합 업무를 대체한
절감시간입니다. {{metric:bems-plants}}의 데이터를 한 시스템에서 다룹니다.

예측 성능은 `EXP-BG-ENERGY-FORECAST`를 참조합니다. 두 카드는 같은 경험의 다른
측면이므로 독립 프로젝트로 세거나 성과를 중복 계산하지 않습니다.

## 현재 활용

일일 alert 메일에서 생산량과 에너지 사용량을 확인하고, 생산량은 줄었는데 사용량은
늘어나는 역행 현상을 발견하면 접속해 실적·분석 화면과 예측값을 확인합니다. 예측값은
주 판단 기준이 아니라 추가 확인을 위한 보조지표입니다.

## 운영 중인 것과 개발 중인 것

| | 구성 | 상태 |
|---|---|---|
| 운영 중 | MySQL + FastAPI 백엔드 + Streamlit 화면 | 사내에서 실제로 쓰는 버전 |
| 개발 중 | 같은 백엔드·모델 위에 React 19 / Next.js UI | 화면만 교체하는 v2 |

자기소개서에는 운영 중인 구성을 씁니다.
