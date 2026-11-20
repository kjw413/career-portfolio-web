---
title: "설비 고장 분석기"
repoName: "equipment-failure-analyzer"
category: "AUTOMATION"
kind: "MAINTENANCE · DESKTOP APP"
summary: "MES 비가동 기록의 자유서술 비고를 고장 분야·설비·부품·현상으로 분류해 Excel·PDF 보고서로 만드는 오프라인 분석기"
intro: "작업자가 자유롭게 적은 비가동 비고를 고장 분야·상세설비·세부 부품·고장 현상 네 축으로 분류해, 공장·팀·라인·설비별 건수와 정지시간을 Excel·PDF 보고서로 만듭니다. 근거가 부족한 기록은 추정하지 않고 사람에게 넘깁니다."
period: "2026.10–11 · 약 6주"
tags: [Python, pandas, PySide6, "Excel VBA", ReportLab, pytest]
stack: "Python · PySide6 · pandas · openpyxl · Excel VBA · ReportLab"
visibility: "PRIVATE"
status: "completed"
order: 2
cover:
  src: "/projects/efa-cover.svg"
  caption: "비고 한 줄이 네 축으로 나뉘는 과정 — 예시 문장을 실제 프로그램(v1.34.1)에 넣어 얻은 판정입니다."
gallery:
  - src: "/projects/efa-excel-team-issues.png"
    caption: "Excel 결과 · 02.팀별 주요이슈. 막대나 표의 항목을 더블클릭하면 라인 → 상세설비 → 세부 부품 → 이력 순으로 내려갑니다. 가상 공장·라인 데이터로 다시 생성한 화면입니다."
  - src: "/projects/efa-excel-fault-compare.png"
    caption: "Excel 결과 · 04.고장비교. 기준과 비교 대상의 선택 깊이에 따라 부서·라인·상세설비별로 비교합니다. 가상 데이터입니다."
  - src: "/projects/efa-pdf-summary.png"
    caption: "PDF 최종보고서 첫 쪽. Excel과 같은 분석 결과에서 함께 만들어집니다. 가상 데이터입니다."
    tall: true
---

## 성과

| | 네 축 독립 판정 도입 (v1.13) | 규칙 개선 후 (v1.15) |
|---|---|---|
| 사람이 확인해야 하는 기록 | 54.3% | **14.5%** |

2026년 실제 고장이력 전수(11월 11일까지)를 같은 조건으로 다시 분석한 값입니다. 중간 버전
v1.14에서는 29.8%였습니다. 현장 정답셋이 없어 이 값은 정확도가 아니라 **검토 대상의
비율**이고, 규칙이 확신하지 못하는 기록은 일부러 검토로 남깁니다.

규칙과 보고서를 고치는 동안 자동 테스트(2026-11-20 기준 1,165개)와 실제 이력 재분석으로
원본 파일·기록 ID·총 정지시간이 바뀌지 않았는지 확인했습니다.

> 사내 데이터라 기록 건수·정지시간·라인명은 공개하지 않습니다. 이 페이지의 화면은 가상
> 공장·라인으로 만든 예제 데이터를 같은 프로그램에 넣어 새로 생성한 것입니다.

## 문제

MES에서 내려받는 라인 비가동 기록의 비고는 작업자가 자유롭게 적은 한 줄입니다. 같은
부품도 표기가 제각각이고(실러/씰러), 단어가 잘리고('후크 교'), 확신이 없는 내용은 '또는'과
'의심'으로 적힙니다. 이대로는 어떤 설비의 어떤 부품이 어떻게 고장 났는지를 부품·현상
단위로 모아 보기 어려웠습니다.

## 한 줄을 네 축으로

<div class="axis-figure">
<table class="axis-table">
<caption>예시 문장을 설비 고장 분석기 v1.34.1에 넣어 얻은 판정</caption>
<thead><tr><th scope="col">원문 비고</th><th scope="col">고장 분야</th><th scope="col">상세설비</th><th scope="col">세부 부품</th><th scope="col">고장 현상</th><th scope="col">조치</th><th scope="col">판정</th></tr></thead>
<tbody>
<tr data-status="full"><th scope="row"><span class="axis-raw">포장기 <mark>실러</mark> 히터 단선 교체</span><span class="axis-note">실러 → 씰러로 표준화</span></th><td data-label="고장 분야">전기·제어</td><td data-label="상세설비">씰러</td><td data-label="세부 부품">히터</td><td data-label="고장 현상">단선</td><td data-label="조치">교체</td><td data-label="판정"><span class="axis-status">완전 자동분류</span></td></tr>
<tr data-status="partial"><th scope="row"><span class="axis-raw">후크 <mark>교</mark></span><span class="axis-note">잘린 단어 → 후크 교체</span></th><td data-label="고장 분야">기계</td><td data-label="상세설비" class="is-empty">미상</td><td data-label="세부 부품">후크</td><td data-label="고장 현상" class="is-empty">미기재</td><td data-label="조치">교체</td><td data-label="판정"><span class="axis-status">부분 자동분류</span></td></tr>
<tr data-status="review"><th scope="row"><span class="axis-raw">컨베어 모터 <mark>또는</mark> 센서 고장 <mark>의심</mark></span><span class="axis-note">후보 둘(센서·모터)을 근거와 함께 보존</span></th><td data-label="고장 분야" class="is-empty">검토</td><td data-label="상세설비">컨베어</td><td data-label="세부 부품" class="is-empty">검토</td><td data-label="고장 현상" class="is-empty">검토</td><td data-label="조치" class="is-empty">—</td><td data-label="판정"><span class="axis-status">검토 필요</span></td></tr>
</tbody>
</table>
</div>

비고에서 부품과 현상을 찾아 **고장 분야 · 상세설비 · 세부 부품 · 고장 현상** 네 축으로
나누고, 교체·수리 같은 조치는 따로 보존합니다. 분류 체계는 고장 분야 6, 상세설비 68,
세부 부품 201, 고장 현상 25, 조치 7종입니다.

- **완전 자동분류** — 네 축이 모두 원문에서 확인될 때만
- **부분 자동분류** — 확인된 축만 채우고, 원문에 없는 축은 추정하지 않고 '미상·미기재'로 남깁니다
- **검토 필요** — 의심·대안·근거 부족. 후보와 판정 근거를 함께 보여 사람이 하나를 고릅니다

후보가 여럿이어도 기록마다 최종 분류는 하나만 집계하고, 정지시간은 기록당 한 번만 셉니다.

## 지킨 원칙

- **사내 데이터는 PC 밖으로 나가지 않습니다.** 외부 전송이나 AI 모델 없이, 누구나 열어
  보고 고칠 수 있는 규칙표로만 분류합니다.
- **원문에 없는 것은 만들지 않습니다.** 1순위 후보는 규칙 근거의 순서일 뿐 확률이
  아니어서, 근거가 없는 1위를 2위로 바꿔 끼우지 않습니다.
- **원본은 건드리지 않습니다.** 입력 파일은 읽기만 하고, 검토가 필요한 행은 결과 Excel
  안의 원본 사본에 색과 사유 메모로 표시합니다. 저장 중 한쪽 파일이 실패하면 기존 결과를
  되살립니다.

## 처리 흐름

<ol class="flow-steps">
<li><strong>읽기</strong><span>제목 행을 찾아 열을 맞추고, 한 번 정한 열 매핑은 다시 씁니다</span></li>
<li><strong>표준화</strong><span>고장 기록만 골라 오타·띄어쓰기·잘린 단어를 사전으로 복원합니다</span></li>
<li><strong>분류</strong><span>부품과 현상이 문맥으로 이어질 때만 네 축을 채우고, 나머지는 검토로 보냅니다</span></li>
<li><strong>집계</strong><span>공장·팀·라인·상세설비·세부 부품·월별로, 기록마다 한 번만 셉니다</span></li>
<li><strong>보고서</strong><span>Excel과 PDF를 같은 분석 결과에서 함께 만듭니다</span></li>
</ol>

화면(PySide6)과 명령행이 같은 분석 서비스를 부르고, Excel과 PDF는 같은 분석 결과에서
만들어집니다. Python이 없는 PC에서도 실행되도록 단일 EXE와 사용 안내서로 배포본을
구성했습니다.

## 결과물

결과는 Excel 1개와 PDF 1개입니다.

- **01 종합현황** — 고장 건수·정지시간과 라인별 우선순위
- **02 팀별 주요이슈** — 공장·팀을 고르면 라인 → 상세설비 → 세부 부품 → 이력으로 내려가는 드릴다운
- **03 월별 주요이슈** — 월별 실적, 월을 더블클릭하면 그달의 일별 실적
- **04 고장비교** — 기준 부서·라인·상세설비와 비교 대상의 건수·정지시간
- **별첨** — 검토·분류현황, 표준화한 고장이력, 색칠한 원본

긴 목록에서 항목을 찾기 쉽도록, 필터 칸을 누르면 입력하는 동안 정확·앞부분·포함·오타
유사도 순으로 후보를 보여 주는 검색창을 VBA로 만들었습니다. 매크로를 허용하지 않는
환경에서는 일반 목록으로 같은 필터를 씁니다.

## 바꾼 판단

- **점수로 가르던 자동 확정을 버렸습니다.** 후보 점수와 점수 차로 자동 분류 여부를 정하던
  방식(v1.6)은 검토 대상을 제대로 가르지 못해, 부품·현상 조건과 결정 규칙으로 판정하도록
  되돌렸습니다(v1.7.2).
- **한 기록에 여러 고장을 확정하지 않습니다.** 복수 확정을 허용하자 같은 기록이 여러 번
  집계될 수 있어, 기록마다 최종 분류 하나만 남기고 나머지 후보는 검토용으로 보존했습니다.
- **결과 파일을 줄였습니다.** 18개였던 Excel 시트를 기본 7개 시트로 통합하고, 따로 나가던
  검토 현황과 색칠한 원본을 별첨으로 넣어 결과를 Excel 1개와 PDF 1개로 정리했습니다.

## 검증

- 분류 규칙을 크게 바꾼 버전(v1.14~v1.16)마다 3개년 실제 이력을 다시 분석해 원본 SHA-256·원본 행·기록 ID·총 정지시간이 그대로인지 확인
- 새로 자동 처리된 기록과 남은 검토 후보를 원문과 전수 대조
- 실제 Excel에서 셀 선택 이벤트, 검색창, 드릴다운, 비교 범위가 원본 기록의 집계와 맞는지 확인
- 자동 테스트 1,165개 (2026-11-20 기준)

## 본인의 역할

주제와 초기 아이디어는 현업 부서의 생산담당자가 제안했습니다. 저는 출력 내용, 프로그램 화면,
차트를 누르면 하위 항목으로 내려가는 Excel 드릴다운 구조를 포함해 상세 설계와 구현의 대부분을
맡았습니다. 무엇을 자동으로 확정하고 무엇을 사람에게 넘길지 정하는 분류 정책과 분류 체계,
EXE 배포본과 사용 안내서도 직접 만들었습니다.

지금은 주제를 제안한 생산담당자가 업무에 쓰고 있고, 사내 AI 개발물 게시판에도 공개했습니다.
