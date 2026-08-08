---
title: "Universal RPA Studio"
repoName: "universal-rpa"
category: "AUTOMATION"
kind: "AUTOMATION · DESKTOP APP"
summary: "업무를 한 번 시연해 기록하고 그대로 재실행하는 Windows RPA 스튜디오"
intro: "특정 업무에 종속된 자동화 스크립트를 만드는 대신, 사용자가 자기 업무를 직접 기록해 재실행할 수 있는 도구를 만들었습니다. 프로그래밍 지식 없이 쓸 수 있게 하는 것이 목표입니다."
period: "2026 — 현재"
tags: [Python, Windows, PySide, "Hexagonal Architecture", pytest]
stack: "Python · PySide · Windows · pytest"
github: "https://github.com/kjw413/universal-rpa"
visibility: "PUBLIC"
status: "ongoing"
featured: 2
order: 2
cover:
  src: "/projects/universal-rpa-flow.svg"
  caption: "기록 → 다듬기 → 실행 → 확인 흐름과 계층 분리 구조"
---

## 개요

앞선 RPA 프로젝트들에서 반복해 깨달은 문제가 있었습니다. 자동화가 필요한 사람은
현업 실무자인데, 자동화를 만들 수 있는 사람은 코드를 쓸 줄 아는 사람뿐이라는 것입니다.
그래서 **업무를 한 번 시연하면 기록하고, 그대로 다시 실행하는** 도구를 만들고 있습니다.

프로그래밍 지식 없이 쓸 수 있어야 하므로, 실행 파일 하나를 복사해 나눠주면 되는
형태로 배포합니다.

## 설계 원칙

- **결정론적 동작** — 실행할 때마다 결과가 달라지지 않도록 설계. 런타임 LLM 의존성이 없습니다
- **보안 경계를 넘지 않음** — UAC·MFA·CAPTCHA를 우회하지 않습니다. 사람이 할 수 있는 조작만 대신합니다
- **로컬 전용** — 외부로 데이터를 보내지 않고 사용자 PC 안에서 동작합니다
- **어댑터 구조** — 도메인·애플리케이션·포트·어댑터를 분리해, 새로운 대상 프로그램 지원을 어댑터 추가로 해결합니다

## 구현 현황

- 기록 → 단계 편집 → 실행 → 보고서 확인의 전체 흐름
- 실행 변수와 반복 실행, 자격증명 안전 처리
- 실행 결과 보고서 생성
- 배포용 단일 실행 파일 빌드와 패키징 후 smoke 검증(`packaged_smoke`), 자체 점검(`self_check`)
- 비개발자 대상 사용설명서 — 배포 담당자용 0부, 일반 사용자용 1부로 분리해 14장 구성

## 코드 품질

RPA는 잘못 동작하면 실제 업무 데이터를 망가뜨리기 때문에, 테스트를 특히 중요하게
다뤘습니다. 전체 Python 소스 217개 파일 중 **116개가 테스트 파일**입니다.

계층을 분리한 구조(`domain` / `application` / `ports` / `adapters` / `infrastructure`)로
Windows 환경에 의존하지 않는 로직을 독립적으로 검증할 수 있게 했습니다.
