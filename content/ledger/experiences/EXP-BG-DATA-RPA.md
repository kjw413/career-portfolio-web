---
id: EXP-BG-DATA-RPA
title: 생산·에너지·재공품 데이터 수집 자동화
status: 확정
affiliation: binggrae
role: 단독 설계·개발
period:
  start: "2026-04-01"
  end: "2026-05-07"
  asOf: "2026-09-12"
headline: "MIS 화면에서 3종 데이터 수집을 자동화 — 1회 {{metric:mis-rpa-cycle}}, 본인 업무 시간 {{metric:mis-rpa-daily-saving}} 절감"
highlights:
  - "공장별 조회조건과 화면 좌표를 표준화하고 순차 수집·재시도·로그·검증 절차 구현"
  - "그리드 지문(SHA-1) 검사로 다른 공장 데이터가 섞이는 오적재를 차단"
  - "수집과 가공을 분리해 가공 단계는 MIS 없이도 실행"
metricIds: [mis-rpa-daily-saving, mis-rpa-cycle, bems-plants]
tags: [MES, RPA, 생산기술, 데이터수집, 업무자동화]
useFor: [MES 운영·스마트팩토리, 생산기술·설비기술, 제조 AI·데이터, 제조 일반·비반도체]
excludeFor: []
relatedCards: [EXP-BG-ENERGY-WEB]
projectSlugs: [ai-elite-mis-rpa]
evidence:
  - type: repo
    label: "AI-Elite_MIS_RPA"
    url: "https://github.com/kjw413/AI-Elite_MIS_RPA"
canonical:
  - "5개 공장의 조회조건과 화면 좌표를 표준화하고 순차 수집·실패 재시도·로그 기록·결과 검증 절차를 구현했다."
  - "수집을 맡던 본인 업무 시간이 하루 40분 줄었고, 월 22일 기준으로 환산하면 약 14.7시간이다."
forbidden:
  - "월 15시간을 절감했다"
  - "팀 전체의 수집 시간을 절감했다"
openQuestions: []
publicOnSite: true
order: 3
---

## 배경

사내 MIS에는 데이터를 꺼낼 API가 없었습니다. 5개 공장의 시스템 조회조건과 화면 좌표가
서로 달라, 생산실적·유틸리티·재공품 데이터를 매일 화면에서 조회해 옮겨 담고 다시
가공하는 일이 반복 업무로 남아 있었습니다.

## 수행

- 공장별 조회조건과 화면 좌표 표준화
- 순차 수집, 실패 재시도, 로그 기록, 결과 검증 절차 구현
- 수집(화면 조작)과 가공(엑셀 재집계)을 분리해, 가공 단계는 MIS 없이도 실행 가능하게 구성
- 그리드 지문(SHA-1) 검사로 직전 공장 데이터를 재복사한 경우 적재를 거부
- 생산실적이 없는 공장·일자는 빈 원단위를 저장하지 않고 즉시 중단
- `--dry-run` 미리보기와 실행 전 자동 백업

RPA는 DB에 직접 쓰지 않고 공유 폴더의 엑셀 파일만을 접점으로 둬, 수집이 실패해도 웹앱이
멈추지 않고 각각을 따로 재실행할 수 있습니다.

## 성과

1회 수집이 {{metric:mis-rpa-cycle}}으로 줄었고, 이 업무를 맡던 본인 시간이
{{metric:mis-rpa-daily-saving}} 줄었습니다. 화면을 보고 옮겨 적는 과정에서 생기던 오타와
누락, 공장을 헷갈려 다른 데이터를 붙여 넣는 실수의 경로 자체도 함께 없앴습니다.

절감 주체는 본인입니다. BEMS의 월 4시간(담당자들의 월간 보고 취합)과는 다른 성과이므로
합산하거나 교환하지 않습니다.

## 운영하며 만난 문제

에너지 수집(09:56)이 생산실적 도착(10:51)보다 빨라 믹스생산량이 0으로 굳은 채 일일 보고가
나간 일이 있었습니다. 수집 순서를 생산실적 우선으로 고정하고, MIS 접속 없이 수 초 만에
믹스생산량만 다시 맞추는 재집계 CLI를 따로 만들어 사후 복구도 가능하게 했습니다.
