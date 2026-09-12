---
# ── 새 경험 카드를 추가하려면 ─────────────────────────────────
# 1. 이 파일을 복사해 `EXP-<소속>-<주제>.md` 로 저장합니다 (파일명 = id).
#    교육 과정은 카드가 아니라 content/ledger/education.json 에 넣습니다.
# 2. 아래 필드를 채웁니다. `_`로 시작하는 파일은 원장에 포함되지 않습니다.
# 3. 수치는 본문에 직접 적지 않고 metrics.json 에 등록한 뒤
#    `{{metric:id}}` 로 인용합니다. 한 곳을 고치면 모든 화면이 같이 바뀝니다.
# 4. 소속(affiliation)이 새로 생기면 affiliations.json 에도 항목을 추가합니다.

id: EXP-ORG-TOPIC # 파일명과 같아야 합니다
title: 한 줄 경험명
status: 미확정 # 확정 | 부분확정 | 미확정 | 진행중
affiliation: binggrae # affiliations.json 의 id
role: 본인이 맡은 범위
period:
  start: null # YYYY-MM-DD 또는 YYYY-MM, 모르면 null
  end: null
  asOf: "2026-09-12" # 이 카드를 마지막으로 확인한 날
headline: "타임라인에 보이는 한 줄. {{metric:id}} 사용 가능"
highlights: [] # 공개 카드는 1~4개. 읽는 사람이 훑는 구체적 사실
teamContext: null # 팀 작업이면 본인 범위의 경계를 적습니다 (선택)
metricIds: [] # metrics.json 의 키
tags: []
useFor: [] # selection-guide.json 의 직무군 이름
excludeFor: []
relatedCards: []
projectSlugs: [] # content/projects/*.md 의 파일명(확장자 제외)
evidence: []
#  - type: repo | screenshot | document
#    label: "무엇인지 한 줄"
#    url: "https://..."        # 공개 링크
#    ref: "drive:증명서/..."   # 비공개 자료는 url 대신 ref 로만
canonical: [] # AI가 그대로 써도 되는 정본 문장
forbidden: [] # 쓰면 안 되는 표현. 사이트에는 렌더링하지 않습니다
openQuestions: [] # open-questions.json 의 id
publicOnSite: false # 확정되기 전에는 false
order: 99
---

## 배경

어떤 상황에서 무엇이 문제였는지 적습니다.

## 수행

본인이 한 행동과 기술적 판단을 적습니다. 팀 작업이면 본인 범위를 분명히 합니다.

## 성과

`status: 확정`인 카드에는 이 절이 반드시 있어야 합니다.
수치는 `{{metric:id}}`로 인용하고, 근거 없는 값을 만들지 않습니다.

## 확인이 필요한 것

미확정 항목을 적습니다. open-questions.json 에도 같은 내용을 등록합니다.
