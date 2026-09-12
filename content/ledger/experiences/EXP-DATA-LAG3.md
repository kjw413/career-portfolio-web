---
id: EXP-DATA-LAG3
title: 판매실적과 날씨 데이터 시계열 분석
status: 부분확정
affiliation: binggrae
role: 분석 수행
period:
  start: null
  end: null
  asOf: "2026-09-12"
headline: "판매실적과 날씨의 3일 시차를 찾아 발주 소요시간을 역으로 도출"
highlights:
  - "동시점 상관이 유의하지 않아 시차 변수를 적용해 3일 시차(Lag 3)를 발견"
  - "찾아낸 시차에서 발주 소요시간을 역으로 도출"
metricIds: [lag3-correlation]
tags: [데이터분석, 수요예측, 생산관리, 문제해결]
useFor: [제조 AI·데이터, 생산관리·생산계획]
excludeFor: []
relatedCards: [EXP-BG-ENERGY-FORECAST]
projectSlugs: []
evidence: []
canonical:
  - "초기 상관분석에서 유의미한 결과가 나오지 않자 시차 변수를 적용해 3일 시차(Lag 3)를 발견하고, 거기서 발주 소요시간을 역으로 도출했다."
forbidden: []
openQuestions: [OQ-LAG3-SCOPE]
publicOnSite: true
order: 13
---

## 배경

판매실적과 날씨 데이터의 관계를 확인하려 했으나 초기 상관분석에서 유의미한 결과가 나오지
않았습니다.

## 수행

동시점 비교 대신 시차 변수를 적용해 다시 분석했고, 3일 시차(Lag 3)에서 관계가 드러났습니다.
이 시차에서 발주 소요시간을 역으로 도출했습니다.

## 성과

{{metric:lag3-correlation}}을 확인했습니다.

분석 대상 제품, 데이터 기간, 상관계수 종류, 업무 적용 결과가 확정되지 않았습니다. 수치를
인용할 때는 조건을 함께 확인한 뒤 씁니다.
