---
title: "페달 오조작 감지 보조 시스템"
repoName: "telechips-embedded-school-pmsa-project"
category: "EMBEDDED"
kind: "EMBEDDED · VISION"
summary: "차량 페달 오조작 상황을 감지하는 임베디드 팀 프로젝트 (통신·인지·제어 통합)"
intro: "TOPST D3 보드 위에서 통신·인지·제어를 하나로 묶은 팀 프로젝트입니다. 페달 오조작 상황을 감지해 운전자를 보조하는 것이 목표였고, 카메라 기반 적색 신호 인지 모듈을 맡았습니다."
period: "2024 · 1,000시간 집중과정"
tags: [YOLOv5, Linux, FreeRTOS, "C/C++", OpenCV]
stack: "C/C++ · Linux · FreeRTOS · YOLOv5"
github: "https://github.com/kjw413/telechips-embedded-school-pmsa-project"
visibility: "PUBLIC"
status: "completed"
order: 7
---

## 개요

Telechips 임베디드 스쿨(1,000시간 집중과정)의 팀 프로젝트 '텔레강스'입니다.
차량의 **페달 오조작(가속·제동 혼동) 상황을 감지해 운전자를 보조하는 시스템**을
목표로, 메인 코어(Linux)와 MICOM(제어) 두 축으로 나눠 개발했습니다.

## 담당한 부분

- **적색 신호 인지** — YOLOv5로 카메라 입력에서 신호등의 적색 상태를 탐지하고, 판정 결과를 제어 측으로 전달
- **보드 간 통신** — TOPST D3 환경에서 Linux·FreeRTOS 기반 SPI/CAN 통신 구현 및 검증
- **MICOM 제어** — GPIO·세그먼트 표시 등 제어 측 기능

## 배운 것

카메라 입력에서 나온 인지 결과가 실제 제어로 이어지려면, 인지 정확도만큼이나
**보드 사이를 건너가는 경로의 신뢰성**이 중요하다는 것을 확인했습니다. 모델
성능과 별개로 통신 지연·유실을 다루는 일이 시스템의 실제 동작을 좌우했습니다.

이 경험이 이후 제조 현장에서 센서·설비 데이터를 다룰 때 물리 신호와 데이터
파이프라인을 같은 선상에서 보는 관점으로 이어졌습니다.
