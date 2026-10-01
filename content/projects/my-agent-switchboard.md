---
title: "My Agent Switchboard"
repoName: "my-agent-switchboard"
category: "웹·도구"
kind: "AI · ORCHESTRATION"
summary: "Claude Code와 Codex를 한 작업에서 함께 쓰는 agent-switchboard를 Gemini 구독 없이 멈춤 없이 쓰게 하는 Windows 보완 킷"
intro: "Claude와 GPT(Codex)를 함께 부리는 오픈소스 도구 agent-switchboard가 Gemini 구독이 없으면 몇 분마다 작업을 멈추는 원인을 소스 코드 수준에서 찾고, 도구가 공식으로 제공하는 설정과 보호 규칙만으로 해결했습니다."
period: "2026"
tags: [PowerShell, "Claude Code", "Codex CLI", MCP, Multi-Agent]
stack: "PowerShell · Claude Code · Codex CLI · MCP"
github: "https://github.com/kjw413/my-agent-switchboard"
visibility: "PUBLIC"
status: "ongoing"
order: 5
---

## 문제 정의

[agent-switchboard](https://github.com/FutureisinPast/mcp-agent-switchboard)는 판단을 맡은
AI(브레인)가 직접 일을 4번 하면 다음 행동을 막고, 다른 AI(워커)에게 위임해야 풀어주는
"게이트"를 둡니다. 그런데 Gemini 구독이 없는 사용자에게는 위임할 곳이 사실상 없었습니다.

- 기본 지시문이 **Gemini Flash를 기본 워커로 고정**해, 구독이 없으면 위임이 항상 실패
- Codex에게 넘기면 일은 끝나지만, switchboard가 Gemini 경로에만 영수증을 붙여 **위임으로 인정되지 않음**
- 설정을 손으로 고쳐도 switchboard가 **시작할 때마다 설정 파일을 다시 써서** 원래대로 되돌림

결국 막힐 때마다 해제 명령을 손으로 입력하는 것 말고는 방법이 없었습니다.

## 해결 방법

해킹이나 우회 없이, switchboard 소스 코드에 이미 있는 설정과 보호 규칙만 사용했습니다.

| 문제 | 해결 |
|---|---|
| 게이트가 계속 막음 | 공식 환경변수로 차단 대신 기록만 하는 모드로 전환 |
| 없는 워커(Gemini)를 쓰라고 지시 | 실제로 가진 Claude·Codex 기준 지시문으로 교체 |
| 재시작하면 지시문·롤 파일이 되돌아감 | switchboard가 "사용자 소유"로 판정해 건드리지 않도록 표식 정리 |
| 모델·effort를 한곳에서 못 바꿈 | `roles.json` 한 파일 → 롤 파일 자동 동기화 |

`roles.json`의 `active_profile` 한 줄로 설계·구현·읽기·리뷰 역할을 Claude와 GPT 사이에서
통째로 바꿀 수 있고, 프로젝트별 설정이 전역 설정보다 우선합니다.

## 성과

같은 작업 흐름의 게이트 로그를 개선 전(7.1일)과 개선 후(3.1일)로 비교했습니다. 저자 PC
한 대에서 측정했고, Python과 PowerShell 두 방법으로 따로 계산해 결과가 일치하는 것을
확인했습니다.

| 항목 | 개선 전 | 개선 후 |
|---|---:|---:|
| 게이트에 막힌 호출 | 34회 | **0회** |
| 손으로 게이트를 푼 횟수 | 37회 | **0회** |

설정을 적용한 2026-08-29부터 2026-09-27까지 여러 번 재시작해도 설정이 한 번도 되돌아가지
않았습니다.

## 검증과 안전장치

- 설치기는 건드리는 모든 파일을 먼저 백업하고, `-DryRun`으로 바꿀 내용만 미리 볼 수 있습니다. 여러 번 실행해도 결과가 같습니다
- 제거 스크립트는 이 킷이 넣은 부분만 되돌리고, 사용자가 직접 추가한 설정은 남깁니다
- 테스트는 임시 폴더의 가짜 사용자 환경에서만 돌고, 실제 switchboard 코드(1.0.39, 1.0.47)로 설정 새로고침을 두 번 돌려 설치 결과가 한 바이트도 바뀌지 않는 것을 확인합니다

## 알려진 한계

- Windows 전용입니다
- 차단 대신 기록만 하므로 위임을 강제하는 규율은 꺼지고, 지시문이 위임 원칙을 안내하는 방식입니다
- Codex 위임의 영수증 누락은 switchboard 쪽 버그라 이 킷으로는 고칠 수 없습니다
