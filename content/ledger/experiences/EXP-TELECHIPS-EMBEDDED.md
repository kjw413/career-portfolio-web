---
id: EXP-TELECHIPS-EMBEDDED
title: 페달 오조작 방지 보조시스템 개발
status: 확정
affiliation: telechips-school
role: 보드 간 통신 · 적색 신호등 인식 · 최종 발표
period:
  start: "2024-06-17"
  end: "2024-12-20"
  asOf: "2026-09-12"
headline: "차량용 페달 오조작 방지 보조시스템에서 통신과 적색 신호 인지를 담당 — {{metric:telechips-rank}}"
highlights:
  - "SPI 내부 루프백 테스트 수행과 드라이버 콜플로우 문서화"
  - "CAN can0·can1의 필터·종단저항·Bus Off 오류를 분석했으나 보드 외부 통신을 해결하지 못해 제출 10일 전 UART로 전환"
  - "YOLOv5로 신호등 적색등을 인지({{metric:telechips-vision}})하고 IPC 플래그로 제어측에 전달"
  - "통합 테스트의 {{metric:telechips-latency}} — 레지스터 설정 조정으로 해소"
teamContext: "텔레칩스 임베디드 스쿨 1기 팀 프로젝트다. 담당 범위는 통신, 인지, 최종 발표다."
metricIds: [telechips-rank, telechips-hours, telechips-latency, telechips-vision]
tags: [임베디드SW, 자동차전장, Linux, FreeRTOS, CAN, UART, SPI, AI비전]
useFor:
  [임베디드·자동차 전장 SW, 기술지원·CS·품질, 어려움 극복·제약 하 문제해결, 제조 AI·데이터]
excludeFor: [에너지·유틸리티, 생산기술·설비기술]
relatedCards: [EXP-UNIV-MCU]
projectSlugs: [telechips-embedded-school-pmsa-project]
evidence:
  - type: repo
    label: "telechips-embedded-school-pmsa-project"
    url: "https://github.com/kjw413/telechips-embedded-school-pmsa-project"
canonical:
  - "SPI 내부 루프백 테스트를 수행하고 드라이버 구조와 콜플로우를 문서화했다."
  - "CAN can0·can1 송수신을 시도하며 필터·종단저항·Bus Off 오류를 분석했지만 보드 외부 통신을 해결하지 못해, 제출 10일 전 UART로 전환해 시스템을 완성했다."
  - "통합 테스트에서 발생한 약 5초의 동작 지연을 디버그 출력으로 추적하고 레지스터 설정을 조정해 해결했다."
forbidden:
  - "CAN 통신을 구현했다"
  - "CAN can0·can1 송수신 구현"
  - "SPI/CAN 통신을 구현하고 검증했다"
openQuestions: []
publicOnSite: true
order: 9
---

## 배경

텔레칩스 임베디드 스쿨 1기({{metric:telechips-hours}})의 팀 프로젝트입니다. 차량의 페달
오조작(가속·제동 혼동) 상황을 감지해 운전자를 보조하는 시스템을 목표로, 메인 코어(Linux)와
MICOM(제어) 두 축으로 나눠 개발했습니다. 환경은 TCC8050, ARM A72·A53 Linux 5.4.159,
R5 FreeRTOS입니다.

## 수행

- **SPI** — 내부 루프백 테스트를 수행하고 드라이버 구조·콜플로우를 문서화
- **CAN** — can0·can1 송수신을 시도하며 필터·종단저항·Bus Off 오류를 분석. 상세 가이드가
  부족해 부품을 직접 구매하고 데이터시트를 읽으며 회로와 통신 조건을 점검했으나 보드 외부
  통신 오류를 해결하지 못함
- **UART 전환** — 제출 10일 전, 전체 시스템 완성을 위해 UART로 전환
- **지연 해결** — 통합 테스트에서 {{metric:telechips-latency}}. 디버그 출력을 추가해 데이터
  전달 과정을 추적하고 드라이버 문서를 대조한 뒤, 데이터 처리 기준을 정하는 레지스터 설정을
  조정해 해결
- **인지** — YOLOv5로 신호등 적색등을 인지({{metric:telechips-vision}})하고 결과를 IPC
  플래그로 제어측에 전달
- 최종 발표 담당

## 성과

{{metric:telechips-rank}}로 수상에는 이르지 못했습니다. 구현한 기능이 실제로 어떻게
동작하는지 확인할 기록의 중요성을 배웠고, 이후 에너지 웹앱과 RPA를 개발할 때 단계별 로그
분석으로 적용했습니다.

CAN은 오류 분석까지이고 최종 구현은 UART입니다. "CAN 통신을 구현했다"로 단정하지
않습니다.
