---
id: EXP-BG-ENERGY-FORECAST
title: 에너지 사용량 예측모델 개발
status: 확정
affiliation: binggrae
role: 예측모델 설계·개발
period:
  start: null
  end: null
  asOf: "2026-09-12"
headline: "생산·기상·달력 데이터로 에너지 사용량 예측모델을 개발 — 전 공장·전 에너지원 평균 {{metric:forecast-mape-all}}"
highlights:
  - "MIS 3년치 실적과 기상청 관측값, 달력 정보를 학습 데이터로 사용"
  - "부스팅 3종 × 피처셋 2종을 가중 결합해 초기 단일 모델 {{metric:forecast-mape-baseline}}를 {{metric:forecast-mape-all}}로 개선"
  - "학습이 불가능한 신설 라인은 잔차 기반 사후 보정으로 연료 {{metric:forecast-newline-fuel}}"
teamContext: "BEMS 팀과제 안에서 예측모델 부분을 담당했다."
metricIds:
  [
    forecast-mape-all,
    forecast-mape-power,
    forecast-mape-fuel,
    forecast-mape-water,
    forecast-mape-best,
    forecast-mape-baseline,
    forecast-newline-fuel,
    forecast-newline-power,
    forecast-feature-funnel,
  ]
tags: [제조AI, 에너지관리, 시계열예측, 머신러닝, 표준화, 협업]
useFor: [제조 AI·데이터, 에너지·유틸리티, 반도체 공정·기반기술, 생산관리·생산계획]
excludeFor: []
relatedCards: [EXP-BG-ENERGY-WEB]
projectSlugs: [ai-elite-bems]
evidence:
  - type: repo
    label: "AI-Elite-BEMS — 모델링 문서·ERD"
    url: "https://github.com/kjw413/AI-Elite-BEMS"
canonical:
  - "최근 6개월 기준 전 공장·전 에너지원 평균 MAPE 7.3%를 달성했다."
  - "사용량 예측치는 실적과 함께 살펴보며 추가 확인을 위한 보조지표로 활용하고 있다."
  - "초기 단일 모델의 오차 약 30%를 부스팅 계열 3종과 피처셋 2종의 가중 결합으로 낮췄다."
forbidden:
  - "예측치를 활용해 이상 여부를 점검하는 수치 기반 관리 체계로 전환했다"
  - "예측값을 활용해 이상 사용을 점검하는 체계로 확장했다"
  - "예측범위 이탈로 에너지 낭비·고장을 확정한다"
  - "평균 표준오차 약 5%"
openQuestions: [OQ-BEMS-STACK]
publicOnSite: true
order: 2
---

## 배경

기존에는 생산량과 에너지 원단위의 증감 추이를 비교해 이상 여부를 판단했으나, 정상
가동일도 이상으로 분류하는 문제가 있었습니다. 명확한 비교 기준을 만들기 위해 생산
조건을 반영한 예측모델을 개발했습니다.

## 수행

**학습 데이터** — MIS의 3년치 생산·유틸리티 실적, 기상청 API 관측값, 달력 정보.

**전처리**

- 목표값을 역산할 수 있는 컬럼을 화이트리스트로 걸러 데이터 누수 차단
- 결측은 변수별로 보간과 유지를 구분해 처리
- 기온·습도 기반 부하 파생변수(냉난방도일 CDD·HDD, 불쾌지수) 생성

**모델 구성**

- 부스팅 계열 3종(LightGBM·XGBoost·CatBoost)에 목적이 다른 피처셋 2종을 조합해 6개 모델 구성
- 검증 데이터의 오차를 최소화하는 최적화로 공장·에너지원별 가중치 산출
- 학습에 쓰지 않은 최근 3개월로 최종 성능 채점

**재공품 변수 반영** — 특정 요일(목·금)에 오차가 집중되는 패턴을 확인하고, 전체 생산량의
교란 효과를 통제하는 잔차 분석을 먼저 수행한 뒤 유의 변수를 추출했습니다. 다중공선성을
유발하는 중복 변수는 제외했습니다. {{metric:forecast-feature-funnel}}로 좁혔습니다.

**신설 라인 사후 보정** — 학습 데이터에서 분산이 0인 피처는 트리 모델이 무시하므로, 김해
신설 라인 가동 구간은 재학습이 아니라 운영 단계의 잔차 기반 보정으로 풀었습니다.
연료 {{metric:forecast-newline-fuel}}, 전력 {{metric:forecast-newline-power}}로 개선했고
용수는 효과가 없어 그대로 기록에 남겼습니다.

## 성과

| 구분 | 값 | 조건 |
|---|---|---|
| 전 공장 · 전 에너지원 평균 | {{metric:forecast-mape-all}} | 최근 6개월 |
| 전력 | {{metric:forecast-mape-power}} | 5개 공장 평균 |
| 연료 | {{metric:forecast-mape-fuel}} | 5개 공장 평균 |
| 용수 | {{metric:forecast-mape-water}} | 5개 공장 평균 |
| 최저 사업장 | {{metric:forecast-mape-best}} | 특정 사업장 |
| 개선 전 단일 모델 | {{metric:forecast-mape-baseline}} | 초기 baseline |

7%는 전력 단독값입니다. 전 에너지원 평균은 7.3%이고 연료·용수는 약 10%이므로, 세 값을
하나로 뭉뜽그려 쓰지 않습니다.

## 현재 활용

일일 메일에서 생산량 감소와 에너지 사용량 증가가 함께 나타나는 역행 현상을 발견하면
BEMS에서 예측값 등을 추가로 확인합니다. 예측값 자체를 주 기준으로 점검하거나 이상·낭비를
확정하지 않습니다.
