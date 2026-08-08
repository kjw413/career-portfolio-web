---
title: "공장 에너지 AI 플랫폼"
repoName: "ai-elite-bems-next"
category: "AI · DATA"
kind: "AI · DATA · WEB"
summary: "5개 공장 에너지·생산 데이터의 조회–예측–진단–보고 통합 웹 플랫폼"
intro: "5개 공장의 에너지·생산 데이터를 통합하고 예측, 이상 진단, 보고까지 하나의 업무 흐름으로 연결했습니다. Streamlit으로 만든 v1을 사내 운영하며 만난 한계를 React·FastAPI 구조로 다시 설계했습니다."
period: "2026 — 현재"
tags: [Python, MySQL, FastAPI, "Next.js", LangChain, LightGBM]
stack: "Python · MySQL · FastAPI · Next.js · LangChain"
github: "https://github.com/kjw413/ai-elite-bems-next"
visibility: "PUBLIC"
status: "ongoing"
featured: 1
order: 1
cover:
  src: "/projects/bems-architecture.svg"
  caption: "수집 → 저장·계산 → 사용으로 이어지는 BEMS 시스템 구조"
---

## 개요

전력·연료·용수·폐수와 생산실적을 5개 공장(남양주1·남양주2·김해·광주·논산) 단위로
통합해, **조회 → 예측 → 이상 진단 → 보고**로 이어지는 업무 흐름을 하나의 사내 웹
서비스로 만들었습니다. 사내 AI 전문가 육성과정(AI ELITE)에서 시작해 실제 운영까지
이어진 프로젝트입니다.

경영진은 매일 아침 한 화면에서 이상 여부와 전년비 성과를 확인하고, 실무자는 같은
데이터로 원단위 개선 과제를 찾습니다.

## 만든 기능

- **대시보드** — AI 이상감지 배너(예측 대비 오차율 임계 초과 시 자동 감지), 7일 생산량·원단위 추이, 전년 동월 대비 비교
- **에너지 모니터링** — 전력을 냉동·공압기·기타로 분해한 사용량 분석, 기간별 추이, 공장별 용수 대비 폐수 비율
- **원단위 관리** — `사용량 ÷ 생산량` 효율 지표. 누계는 단순 평균이 아닌 가중 평균(Σ사용량 ÷ Σ생산량)으로 계산
- **AI 예측** — LightGBM·XGBoost·CatBoost 앙상블로 에너지 사용량 예측
- **AI 보고서** — LLM이 월간 실적 보고서를 생성하고, 이상 감지 시 원인 가설과 점검 우선순위를 제시
- **관리자 기능** — 엑셀 업로드·검증, 절감 목표·이벤트 관리, 감사 로그, 예측 이력

## 예측 모델을 설계한 방식

- 표 형태 데이터에 강한 부스팅 계열 3종(LightGBM·XGBoost·CatBoost)을 앙상블하고,
  `scipy.optimize` SLSQP로 가중치 합이 1이 되는 조건에서 손실을 최소화
- v5.1은 MAPE 최소화, **v5.2부터 Pinball Loss로 전환**해 점 추정이 아닌 구간 예측으로 변경
- 이상 판정 지표를 MAPE 대신 **PICP**(실측이 P05~P95 구간에 들어온 비율)로 바꿔,
  "얼마나 빗나갔나"가 아니라 "모델이 예상한 범위를 벗어났나"로 판단
- 공정 중인 **재공품(WIP) 누적량을 피처로 추가**해 생산량만으로 설명되지 않던 에너지 변동을 반영
- 학습에 쓰지 않은 최근 3개월로 최종 성능을 채점

## v1의 한계와 재설계 (진행 중)

Streamlit으로 만든 v1을 사내에서 운영하며, 화면을 조작할 때마다 전체 스크립트가
다시 실행되어 DB 조회와 모델 실행이 반복 트리거되는 구조적 한계를 만났습니다.

v2에서는 **브라우저 렌더링과 Python 계산을 분리**했습니다.

```
사내 사용자 브라우저
  ├─ :3000  React 19 / Next.js 15 운영 UI
  └─ :8000  FastAPI 브리지 ── 로컬 MySQL
                           ├─ v5.3 예측모델
                           ├─ AI 보고서 서비스
                           └─ Excel 업로드·검증
```

검증된 자산(MySQL 스키마, 예측 모델, LangChain 보고서, 엑셀 업로드 로직)은 버리지
않고 FastAPI 브리지로 연결해, 화면만 교체하고 계산 코어는 그대로 재사용했습니다.

- 사내망 전용 설계 — DB 계정·OpenAI 키·기상청 키는 서버 프로세스 환경에서만 읽고 브라우저에 전달하지 않음
- 조회 전용 DB 계정 분리, 쓰기 작업은 관리자 IP 검사 후 기존 서비스에 위임
- 외부 클라우드로 데이터를 복제하지 않음
- 검증 완료: 타입 체크, 프로덕션 빌드, HTTP 200 기동 smoke, 백엔드 단위 테스트 20건
- 남은 작업: 재학습·기상 동기화·What-if·이상 진단 UI, 실제 사내 DB 기준 수치 동등성 검증

## 저장소

- [ai-elite-bems-next](https://github.com/kjw413/ai-elite-bems-next) — React·FastAPI 현행 버전
- [AI-Elite-BEMS](https://github.com/kjw413/AI-Elite-BEMS) — Streamlit v1 (모델링 문서·ERD 보관)
