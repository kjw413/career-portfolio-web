# 포트폴리오 v2 설계 계획 — 시각 고도화 · 사실 원장 통합 · AI 자소서 파이프라인

**작성일:** 2026-09-12
**대상:** `kjw413/career-portfolio-web` (<https://kjw413.github.io/career-portfolio-web/>) + Google Drive `내 드라이브`
**성격:** 설계 문서. 구현은 포함하지 않는다. 7절의 각 Phase가 별도 작업 단위가 된다.
**전제:** `docs/superpowers/2026-08-16-portfolio-redesign-design.md`(v1 설계)의 정보 구조와 콘텐츠 모델을 유지하고, 그 위에 세 가지를 더한다.

---

## 0. 요약

### 0.1 목표

1. **시각 고도화** — 3D 장면 1개를 포함해 세련된 화면으로 개선하되, 채용담당자가 30초 안에 핵심을 읽는 v1의 장점을 해치지 않는다.
2. **사실 통합** — 웹사이트 콘텐츠, 드라이브의 `지원서_마스터이력_김종우_v1.2.md` 원장, 제출 자소서 세 곳에 흩어진 사실을 하나의 원장으로 묶어 불일치를 구조적으로 막는다.
3. **AI 작성 기반** — AI가 이 웹사이트와 이 저장소만 읽고도 검증된 사실·수치·표현 규칙으로 자소서를 쓸 수 있게 한다.

### 0.2 핵심 결정

| # | 결정 | 이유 |
|---|---|---|
| D1 | **저장소가 유일한 진실(SSOT)**. 드라이브 원장 md는 저장소에서 생성되는 미러 | git 이력, 검증 CI, AI 접근성. 드라이브 md를 손으로 고치면 다시 어긋난다 |
| D2 | 원장을 **경험 카드(EXP-*) 파일 + 수치 레지스트리 + 표현 규칙**으로 구조화 | 자소서는 카드 단위로 조합되고, 불일치는 거의 수치와 표현에서 생긴다 |
| D3 | **공개/비공개 분리**. 주소·전화·생년월일·등록번호는 저장소에 넣지 않는다 | 저장소와 사이트는 공개다. 자소서 작성에는 개인정보가 필요 없다 |
| D4 | 3D는 **첫 화면 1개 장면**만. 정적 대체물과 성능 예산을 갖춘다 | 3D는 장식이 아니라 "Three.js로 3D 모니터링을 만들고 싶다"(LG에너지솔루션 자소서 포부)의 증거여야 한다 |
| D5 | 드라이브 연동은 **2단계**. ① Claude + Drive 커넥터 루틴으로 즉시 시작 ② Apps Script·GitHub Actions로 자동화 | 지금 이 세션이 이미 드라이브를 읽고 있다. 서비스 계정 설정은 뒤로 미뤄도 된다 |

### 0.3 로드맵 한눈에

```
Phase 0  불일치 수정              1일   사이트 문구를 원장 v1.2 확정값에 맞춤
Phase 1  원장 구조화 + 검증 CI     1주   content/ledger/, 수치 레지스트리, 빌드 시 검사, llms.txt
Phase 2  UI v2                    1주   토큰·다크모드·타임라인·경험 카드 페이지·수치 근거 UI
Phase 3  3D 첫 화면               1주   React Three Fiber 장면 + 정적 포스터 대체
Phase 4  드라이브 연동            3일   원장 미러 push, 제출 이력 manifest, 자소서 검사
Phase 5  AI 자소서 스킬           3일   저장소 스킬 + CLAUDE.md + 검사기 연결
```

---

## 1. 현재 상태 진단

### 1.1 저장소

- **스택:** Next.js 16 App Router, `output: "export"`, React 19, Tailwind 4, Vitest 26개 테스트, GitHub Pages(`main` push·수동·매일 03:17 KST 예약 배포).
- **콘텐츠:** `content/profile.json`(소개·수치 4·impacts 3), `content/experience.json`(경력·교육 4건), `content/project-overrides.json`, `content/projects/*.md` 8건, `content/generated/github-repos.json`(GitHub API 캐시, 공개 저장소 9개).
- **화면:** 헤더 → Hero(프로필 패널 + 소개 + 수치 4) → 주요 성과 3 → 대표 프로젝트 4 → 경력·교육 아코디언 → 보유 기술 4 → 아카이브 → 학력·자격·병역 → 연락처. 프로젝트 상세 8페이지.
- **디자인:** 밝은 배경 `#F8FAFC`, 파랑 강조 `#1D5FD0`, 라벨 12.5px 하한, 다크 모드 없음. v1 설계 6.2는 "3D 그래픽·그라데이션·유리 질감 사용 금지".
- **강점:** 콘텐츠와 코드 분리, 검증 로더(`lib/content.ts`), 이미지 누락 무해 처리, 재직기간 자동 계산(`lib/tenure.ts`), GitHub 메타데이터 자동 병합.
- **약점:**
  - 같은 사실이 여러 파일에 **문장으로** 중복된다. `월 15시간`은 `profile.json` 2곳, `experience.json`, `ai-elite-mis-rpa.md` 2곳, `mis-rpa-time-saving.svg`까지 6곳에 있다.
  - 수치에 조건·근거·확정 상태가 없다. `예측 오차 7%`가 전력 단독값인지 전 에너지원 평균인지 화면만 보고는 알 수 없다.
  - `app/page.tsx`에 `capabilities`, `qualifications` 배열이 하드코딩되어 있다.
  - AI용 진입점이 없다. `llms.txt`도, 구조화 JSON도, 저장소 `CLAUDE.md`도 없다.

### 1.2 구글드라이브 자산 지도

```
내 드라이브 (root)
├─ 지원서_마스터이력_김종우_v1.2.md      ← 사실 원장 (v1.2, 2026-09-12). 0~14절, 경험 카드 13장
├─ 2026 상반기/                          ← 자소서 hwpx 10건 (기아·현대차·현대모비스·LIG·한화·현대엘리베이터·HD현대·현대케피코·유한킴벌리·현대로템)
│  ├─ 26(상)_현대모비스 전장BU r&d 운영기획 지원서.pdf
│  └─ 합격자소서/
│     ├─ SK하이닉스_기반기술.hwpx, sk하이닉스_면접복기.hwpx, 효성중공업_EMS 설치.hwpx, 현대오토에버_MES운영.hwpx
│     ├─ 26(상)_SK하이닉스_기반기술/     ← 지원서 PDF, JD PDF, 예상질문_통합.md, 면접후기, NCS 자료, 제출서류/
│     └─ 26년 3분기 현대오토에버_MES운영/ ← 서류 PDF, 과제테스트 pptx·pdf, 현직피드백 xlsx
├─ 2026 하반기/                          ← 자소서 6건 = hwpx + txt 쌍 (LG전자·LG에너지솔루션·현대모비스·AMAT·현대자동차·KT&G)
├─ 입사지원 서류/                        ← 성적·OPIc·컴활 증명 PDF, SK하이닉스·현대오토에버 지원서 PDF
├─ 증명서/                               ← 재직·졸업·성적·병적·군경력·ADsP·컴활·OPIc·국민연금·등본·초본·신분증, 자동화시스템도입기초_수료증
├─ 이력서_0001.pdf, 이력서사진_흰색.jpg
└─ (root에 hwpx 12건 중복 업로드, 2026-09-09, mimeType application/x-zip)  ← 정리 대상
```

파일 ID는 부록 C에 있다.

**관찰**

- 원장 v1.2는 이미 "AI 및 사용자 사용 지침", 사실 우선순위, 상태 표기(확정·부분확정·미확정·진행중), 카드 ID(EXP-*), 직무별 선택 가이드, 금지 표현, 충돌 표를 갖춘 잘 설계된 문서다. **이 구조를 버리지 않고 저장소로 옮기는 것**이 본 설계의 핵심이다.
- 자소서 본문은 `2026 하반기/`처럼 hwpx와 txt 쌍으로 있을 때만 기계가 읽기 쉽다. `2026 상반기/`는 hwpx만 있다. hwpx는 zip 안의 OWPML XML이라 스크립트로 텍스트 추출이 가능하다(부록 B).
- `증명서/자동화시스템도입기초_수료증.pdf`(2025-05)는 원장에 없는 교육이다. 원장에도 빈틈이 있다.

### 1.3 불일치 감사 (2026-09-12, 사이트 ↔ 원장 v1.2 ↔ 제출 자소서)

원장 v1.2가 "유일 정본"으로 확정한 값과 현재 사이트를 대조했다. 심각도: **상** = 원장이 사용 금지로 지정한 표현·수치, **중** = 수치·기간·사실 차이, **하** = 표현 정밀도.

| # | 항목 | 사이트 현재 | 원장 v1.2 확정값 | 심각도 | 위치 |
|---|---|---|---|---|---|
| A1 | 예측 오차 | `예측 오차 7%`, `전사 기준 MAPE 약 7% (전력·연료·용수)` | 전 공장·전 에너지원 평균 **MAPE 7.3%**(최근 6개월). 전력 약 7%, 연료 약 10%, 용수 약 10%, 최저 사업장 4.2%. "7%는 전력 단독값. 전 에너지원 평균을 7%로 쓰지 않는다" | **상** | `content/profile.json:44,46,69`, `content/projects/ai-elite-bems.md:65` |
| A2 | 예측값의 위상 | `시계열 예측값을 이상 여부 판단 기준으로 사용, 평균 표준오차 약 5%` | 예측값은 **보조지표**. "5% 기록은 산출 조건 미확인으로 사용하지 않는다". '예측값 기준 관리 체계' 계열 표현 사용 금지 | **상** | `content/experience.json:12` |
| A3 | CAN 통신 | `CAN can0·can1 송수신 구현`, `SPI/CAN 통신을 구현하고 검증` | CAN은 오류 분석까지. 외부 통신 실패로 **UART 전환**. "'CAN 통신을 구현했다'로 단정하지 않는다" | **상** | `content/experience.json:37`, `content/profile.json:76`, `content/projects/telechips-embedded-school-pmsa-project.md:26` |
| A4 | AI Elite 선발 근거 | `투자 등록현황 검토 자동화, 사내 데이터 샘플링 자동화, 원단위 예측모델 개발` | 선발 계기는 **투자품의 검토 자동화(EXP-BG-INVEST-RPA) 단독**. '예측모델 개발이 선정 근거' 표현 사용 금지 | **상** | `content/experience.json:24` |
| A5 | MIS RPA 절감 | `월 15시간` (6곳) | **일 40분 (월 14.66시간 환산)**. 월 15·16·12.8시간 기록은 사용 보류 | 중 | `content/profile.json:38,40,61`, `content/experience.json:10`, `content/projects/ai-elite-mis-rpa.md:18,32`, `public/projects/mis-rpa-time-saving.svg:49` |
| A6 | AI Elite 기간 | `2026.02 ~ 진행 중` | 2026-02-03 ~ **2026-05-07 수료**. 이후 사내 AI 전문가 역할 수행 중 | 중 | `content/experience.json:19` |
| A7 | BEMS 절감 | `에너지 모니터링 업무 월 4시간 절감` | "담당자들의 **월간 에너지 실적 보고용 취합 업무**를 대체해 월 4시간" | 하 | `content/experience.json:9` |
| A8 | 인바디 조치 | `노이즈 필터 처방으로 클레임 해결` | "해결에 **기여**했다"가 최신 확정 표현 | 하 | `content/experience.json:50` |
| A9 | BEMS 기술 스택 | v1 Streamlit, **v2 React 19·Next.js 15·FastAPI 진행 중** | "FastAPI 백엔드 + **Streamlit** 프론트 + MySQL" (2026-09-12 확정) | 중·**결정 필요** | `content/projects/ai-elite-bems.md:7,136-160` |
| A10 | 원장에 없는 사이트 내용 | PICP·Pinball Loss·신설 라인 사후 보정·재공품 피처 3단계 선별, MIS RPA 그리드 지문 검사·2026-07 화면 변경, PLC 2축 직교로봇, Universal RPA, trading-bot, Masking, to-do | 없음 | 중 (원장 → 갱신) | `content/projects/*.md`, `content/experience.json:13` |
| A11 | 사이트에 없는 원장 카드 | 없음 | EXP-BG-SYSTEM-COLLAB(MIS·MES 개선 2건), EXP-BG-MIXEDPACK 수치(CT 14.4→12초, 회수 1.7년), EXP-DATA-LAG3, EXP-UNIV-POWERFLOW, EXP-UNIV-MCU, EXP-CLUB-BUDGET, EDU-SEMI-01 | 중 (사이트 → 갱신) | — |
| A12 | 제출 자소서의 금지 표현 | — | 2026 하반기 현대모비스 자소서: "예측치를 활용해 이상 여부를 점검하는 **수치 기반 관리 체계로 전환**", "**평균 오차 7%**". 원장 0.4가 사용 금지로 지정 | 상 (이미 제출됨, 향후 검사기의 실례) | Drive `2026 하반기/현대모비스_전장품 품질보증.txt` |
| A13 | 연차 표기 | `제조 현장 2년차` 문자열 | 재직 20개월. 2026-12부터 3년차 | 하 (자동 계산 대상) | `content/profile.json:4` |

**A9는 사용자 결정이 필요하다.** 사이트는 v2(React·FastAPI) 재설계를 상세히 기술하는데, 원장은 6건의 자소서를 대조해 "Streamlit 프론트"로 확정했다. 두 가지 모두 사실일 수 있다(운영 중인 v1 + 개발 중인 v2). 원장에 `운영 버전`과 `개발 중 버전`을 나눠 적고, 자소서에는 운영 버전만 쓰는 규칙을 제안한다.

### 1.4 근본 원인

세 개의 "진실"이 각자 다른 시점에 갱신된다.

```
사이트 JSON/MD  ──(2026-08 수정)──┐
원장 v1.2       ──(2026-09-12)────┼──> 서로 참조하지 않음 → 같은 수치가 세 값으로 갈라짐
자소서 6건      ──(2026-09-11)────┘     (예측 오차 7% / 7.3% / 10% / 10% 이하 / 7·10·10%)
```

원장 v1.2 자체가 이 문제를 해결하려고 만든 문서인데, 사이트는 원장을 모르고 원장은 사이트를 모른다. 해결은 "더 자주 대조"가 아니라 **한 곳에서만 쓰고 나머지는 생성**하는 것이다.

---

## 2. 목표 아키텍처

### 2.1 원칙

1. **쓰는 곳은 하나.** 사실·수치·표현 규칙은 `content/ledger/`에만 쓴다. 사이트 화면, 드라이브 원장 md, AI용 JSON은 전부 여기서 생성한다.
2. **수치는 ID로 참조한다.** 본문에 `7.3%`를 직접 적지 않고 `{{metric:forecast-mape-all}}`처럼 참조한다. 빌드가 값·단위·조건을 채운다. 한 곳을 고치면 모든 곳이 바뀐다.
3. **상태가 없는 사실은 없다.** 모든 카드·수치는 `확정 | 부분확정 | 미확정 | 진행중` 중 하나다. `미확정`은 사이트에 렌더링되지 않고 AI 출력에서는 질문으로 바뀐다.
4. **공개와 비공개를 파일 경계로 나눈다.** 저장소에는 공개 가능한 것만. 개인정보는 드라이브의 비공개 md에만.
5. **검증은 빌드에 넣는다.** 참조 깨짐, 금지 표현 등장, 미확정 수치 노출, 날짜 형식 오류는 `npm run build`가 실패시킨다.

### 2.2 데이터 흐름

```
                    ┌────────────────────────────────────────────┐
                    │  content/ledger/  (저장소, 공개, SSOT)      │
                    │  facts.json · metrics.json · phrases.json   │
                    │  experiences/EXP-*.md · education.json      │
                    │  selection-guide.json · open-questions.json │
                    └───────────────┬────────────────────────────┘
                                    │ npm run build (검증 → 생성)
          ┌─────────────────────────┼──────────────────────────┐
          ▼                         ▼                          ▼
  Next.js 정적 사이트        public/ai/ledger.json        dist/ledger.md
  (사람용 화면)              public/llms.txt              (드라이브 원장 미러)
  /experience/EXP-*/         public/llms-full.txt                │
          │                         │                            │ Apps Script 또는 Actions
          ▼                         ▼                            ▼
   채용담당자·면접관          AI (Claude 등)               Drive: 지원서_마스터이력_김종우.md
                                    │                     Drive: 지원서_비공개정보_김종우.md (수동, 저장소 밖)
                                    │ 자소서 초안
                                    ▼
                        content/applications/index.json  ◄── Drive 자소서 폴더 스캔 (Claude 루틴)
                        (제출 이력 manifest: 회사·직무·일자·사용 카드·수치·Drive fileId)
                                    │
                                    ▼
                        scripts/claim-lint.mjs  → 수치·금지표현·카드 적합성 검사 보고서
```

### 2.3 역할 분담

| 저장소 | 드라이브 |
|---|---|
| 사실·수치·표현 규칙 원장 (공개분) | 개인정보 부록 (`지원서_비공개정보_김종우.md`) — 수동 관리 |
| 경험 카드 본문, 프로젝트 사례 | 원장 미러 md — **생성물, 직접 수정 금지** 머리말 |
| 제출 이력 manifest (메타데이터만) | 자소서 제출본(hwpx·pdf·txt), 과제, 면접 복기 — 본문은 여기만 |
| 사이트 소스, 검사 스크립트, AI 스킬 | 증명서 PDF |

자소서 본문을 저장소에 넣지 않는 이유: 회사별 지원 내용은 공개할 필요가 없고, 저장소는 공개다. manifest에는 어떤 카드와 수치를 썼는지만 남긴다. 그것만으로 향후 일관성 검사와 "지난번 LG전자에는 어떤 카드를 썼지"를 답할 수 있다.

---

## 3. 콘텐츠 모델 (원장 스키마)

원장 v1.2의 0~14절을 파일로 나눈다. 절 번호와 카드 ID는 그대로 유지해 사용자가 익숙한 구조를 잃지 않게 한다.

```
content/
├─ ledger/
│  ├─ README.md                 원장 v1.2의 0절(사용 지침) — 사람과 AI가 같이 읽는 규칙
│  ├─ facts.json                1~6절 중 공개분: 학력·병역·경력·자격·어학 (날짜는 YYYY-MM-DD)
│  ├─ education.json            7절: EDU-* 카드
│  ├─ experiences/              9절: 카드 1장 = 파일 1개 (frontmatter + 본문)
│  │  ├─ EXP-BG-ENERGY-WEB.md
│  │  ├─ EXP-BG-ENERGY-FORECAST.md
│  │  ├─ EXP-BG-DATA-RPA.md
│  │  └─ … (13장 + 신규)
│  ├─ metrics.json              수치 레지스트리 (원장 0.4 표 + 각 카드의 정량 성과를 ID화)
│  ├─ phrases.json              정본 표현·금지 표현 (원장 0.4, 11.2)
│  ├─ selection-guide.json      10절: 직무군별 1순위·보조·기본 제외 카드
│  └─ open-questions.json       11절: 충돌·미확정 항목과 처리 규칙
├─ applications/
│  └─ index.json                제출 이력 manifest
├─ profile.json                 화면 전용 (사진, CTA, 소개 문장). 수치는 metricId 참조로 교체
├─ project-overrides.json       유지
└─ projects/*.md                유지. frontmatter에 experienceIds, metricIds 추가
```

`content/experience.json`은 폐지하고 `ledger/experiences/` + `education.json`에서 생성한다.

### 3.1 수치 레지스트리 `metrics.json`

불일치의 80%는 수치다. 모든 수치는 여기 한 번만 산다.

```jsonc
{
  "forecast-mape-all": {
    "value": 7.3, "unit": "%", "display": "MAPE 7.3%",
    "label": "에너지 사용량 예측 오차 (전 공장·전 에너지원 평균)",
    "condition": "최근 6개월 기준, 중앙 추정(P50)과 실측의 오차",
    "basis": "사용자 확정 2026-09-12 (원장 0.4 표)",
    "status": "확정", "confirmedAt": "2026-09-12",
    "cardIds": ["EXP-BG-ENERGY-FORECAST", "EXP-BG-ENERGY-WEB"],
    "aliases": ["예측 오차", "예측 정확도", "MAPE"],
    "doNotConfuseWith": ["forecast-mape-power"],
    "notes": "7%는 전력 단독값. 전 에너지원 평균을 7%로 쓰지 않는다."
  },
  "forecast-mape-power":  { "value": 7,  "unit": "%", "display": "약 7%",  "label": "전력 예측 오차 (5개 공장 평균)", "status": "확정", "cardIds": ["EXP-BG-ENERGY-FORECAST"] },
  "forecast-mape-fuel":   { "value": 10, "unit": "%", "display": "약 10%", "label": "연료 예측 오차 (5개 공장 평균)", "status": "확정", "cardIds": ["EXP-BG-ENERGY-FORECAST"] },
  "forecast-mape-water":  { "value": 10, "unit": "%", "display": "약 10%", "label": "용수 예측 오차 (5개 공장 평균)", "status": "확정", "cardIds": ["EXP-BG-ENERGY-FORECAST"] },
  "forecast-mape-best":   { "value": 4.2, "unit": "%", "display": "4.2%", "label": "최저 사업장 예측 오차", "status": "확정", "cardIds": ["EXP-BG-ENERGY-FORECAST"] },
  "forecast-mape-baseline": { "value": 30, "unit": "%", "display": "약 30%", "label": "개선 전 초기 단일 모델 오차", "status": "확정", "cardIds": ["EXP-BG-ENERGY-FORECAST"] },
  "mis-rpa-daily-saving": {
    "value": 40, "unit": "분/일", "display": "일 40분",
    "label": "본인 데이터 수집 시간 절감 (생산·에너지·재공품)",
    "derived": { "monthly": "14.66시간 (월 22일 환산)" },
    "status": "확정", "confirmedAt": "2026-09-11",
    "cardIds": ["EXP-BG-DATA-RPA"],
    "deprecated": ["월 15시간", "월 16시간", "월 약 12.8시간"],
    "notes": "BEMS 월 4시간과 합산·교환하지 않는다"
  },
  "mis-rpa-cycle": { "value": "40분 → 3분", "unit": "회", "label": "MIS 수집 1회 소요시간", "status": "확정", "cardIds": ["EXP-BG-DATA-RPA"] },
  "bems-monthly-saving": { "value": 4, "unit": "시간/월", "display": "월 4시간", "label": "담당자 월간 에너지 실적 보고용 취합 업무 대체", "status": "확정", "cardIds": ["EXP-BG-ENERGY-WEB"] },
  "invest-rpa-saving": { "value": 1, "unit": "시간/월", "display": "월 1시간", "status": "확정", "cardIds": ["EXP-BG-INVEST-RPA"] },
  "plants": { "value": 5, "unit": "개 공장", "display": "5개 공장", "detail": "남양주1·남양주2·김해·광주·논산", "status": "확정" },
  "mixedpack-line-ct": { "value": "14.4초 → 12초", "label": "라인 전체 CT", "status": "확정", "cardIds": ["EXP-BG-MIXEDPACK"] },
  "mixedpack-payback": { "value": 1.7, "unit": "년", "display": "약 1.7년", "label": "투자 회수기간", "status": "확정", "cardIds": ["EXP-BG-MIXEDPACK"] },
  "powerflow-iterations": { "value": "4회 → 3회", "status": "확정", "cardIds": ["EXP-UNIV-POWERFLOW"] },
  "powerflow-speedup": { "value": 16, "unit": "%", "display": "16% 단축", "label": "평균 수렴 시간", "condition": "IEEE 9-bus 50회 벤치마크", "status": "확정", "cardIds": ["EXP-UNIV-POWERFLOW"] },
  "aielite-ratio": { "value": "약 300명 중 50명 (약 6:1)", "status": "확정", "cardIds": ["EDU-AIELITE-01"] },
  "telechips-rank": { "value": "5개 팀 중 3위", "status": "확정", "cardIds": ["EXP-TELECHIPS-EMBEDDED"] },
  "inbody-reversal-count": { "value": 3, "unit": "회", "status": "미확정", "notes": "증빙 확인 전 정량 문구로 사용하지 않음" }
}
```

규칙

- `status: "미확정"` 수치는 사이트에 렌더링되지 않고, AI 출력에서는 "확인 필요" 질문으로 바뀐다.
- `deprecated` 배열의 값이 사이트 소스나 자소서 본문에 나타나면 검사기가 경고한다.
- `doNotConfuseWith`는 검사기가 "7%"를 발견했을 때 어느 ID인지 문맥으로 구분하는 힌트다.

### 3.2 경험 카드 `experiences/EXP-*.md`

원장 9절 카드를 frontmatter + 본문으로 옮긴다. 원장 13절 템플릿의 항목을 그대로 필드로 쓴다.

```markdown
---
id: EXP-BG-ENERGY-FORECAST
title: 에너지 사용량 예측모델
status: 확정                      # 확정 | 부분확정 | 미확정 | 진행중
period: { start: null, end: null, asOf: "2026-09-12" }
org: 빙그레 생산담당 생산기술팀
role: 예측모델 설계·개발 (AI 전문가 과정 팀과제의 일부)
teamContext: "BEMS 팀과제의 한 축. 팀 결과물 전체를 단독 성과로 쓰지 않는다"
metricIds: [forecast-mape-all, forecast-mape-power, forecast-mape-fuel, forecast-mape-water, forecast-mape-best, forecast-mape-baseline]
tags: [제조AI, 에너지관리, 시계열예측, 머신러닝, 표준화, 협업]
useFor: [제조 AI·데이터, 에너지·유틸리티, 반도체 공정·기반기술]
excludeFor: []
relatedCards: [EXP-BG-ENERGY-WEB]       # 같은 경험의 다른 측면
projectSlugs: [ai-elite-bems]
evidence:
  - { type: repo, url: "https://github.com/kjw413/ai-elite-bems-next" }
  - { type: screenshot, src: "/projects/bems-dashboard.png", note: "예시 데이터 모드" }
canonical:                              # 정본 표현 — AI가 그대로 써도 되는 문장
  - "사용량 예측치는 실적과 함께 살펴보며 추가 확인을 위한 보조지표로 활용하고 있다."
  - "최근 6개월 기준 전 공장·전 에너지원 평균 MAPE 7.3%를 달성했다."
forbidden:                              # 사이트에는 렌더링하지 않음. AI·검사기용
  - "예측값 기준의 전사 관리 체계로 전환했다"
  - "예측치를 활용해 이상 여부를 점검하는 수치 기반 관리 체계로 전환했다"
  - "예측값을 활용해 이상 사용을 점검하는 체계로 확장했다"
  - "예측범위 이탈로 에너지 낭비·고장을 확정한다"
openQuestions: [수행 기간]
publicOnSite: true                      # false면 AI용 JSON에만 포함
---

## 배경
기존에는 생산량과 에너지 원단위의 증감 추이를 비교해 …

## 수행
- 목표값을 역산할 수 있는 컬럼을 화이트리스트로 걸러 데이터 누수 차단
- …

## 성과
{{metric:forecast-mape-all}} · 전력 {{metric:forecast-mape-power}} / 연료 {{metric:forecast-mape-fuel}} / 용수 {{metric:forecast-mape-water}}

## 현재 활용
…
```

### 3.3 표현 규칙 `phrases.json`

카드에 종속되지 않는 전역 규칙. 원장 0.4·11.2에서 추출한다.

```jsonc
{
  "preferred": [
    { "use": "해결에 기여했다", "insteadOf": ["클레임을 해결했다"], "cardIds": ["EXP-INBODY-CLAIM"] },
    { "use": "IT종합시스템설계", "insteadOf": ["학부 종합설계", "종합설계"], "cardIds": ["EXP-UNIV-POWERFLOW"] },
    { "use": "광주공장", "insteadOf": ["G공장"] },
    { "use": "전자전기공학부", "insteadOf": ["전기전자공학부"], "note": "공식 증명서 요구 시 원문 대조" },
    { "use": "MIS 1건 + MES 1건 (총 2건)", "insteadOf": ["MIS 개선 테마 3건", "MES 개선 과제"] }
  ],
  "forbidden": [
    { "pattern": "CAN 통신을 구현", "reason": "CAN은 오류 분석까지, 최종 구현은 UART", "cardIds": ["EXP-TELECHIPS-EMBEDDED"] },
    { "pattern": "예측모델 개발이 선정 근거", "reason": "선발 계기는 EXP-BG-INVEST-RPA", "cardIds": ["EDU-AIELITE-01"] },
    { "pattern": "10% 이하|10%까지 개선", "reason": "연료·용수의 값이자 상한. 전체 성과로 쓰지 않는다" }
  ],
  "recompute": [
    { "field": "빙그레 재직기간", "rule": "지원일 기준 재계산. 고정값(1년 4개월·1년 6개월) 재사용 금지", "from": "facts.career[0].startDate" }
  ]
}
```

### 3.4 공개 사실 `facts.json`

원장 1~6절 중 공개 가능한 항목만. 개인정보는 `private: true` 자리표시만 둔다.

```jsonc
{
  "person": { "name": "김종우", "nameEn": "Jong Woo Kim", "email": "kjw2110@naver.com",
              "phone": { "private": true, "ref": "drive:지원서_비공개정보#1" },
              "birth": { "private": true, "ref": "drive:지원서_비공개정보#1" },
              "address": { "private": true, "ref": "drive:지원서_비공개정보#1" } },
  "education": [
    { "school": "홍익대학교", "campus": "서울 본교", "degree": "학사", "major": "전자전기공학부",
      "start": "2018-03-01", "end": "2024-02-22", "gpa": "3.50/4.50", "credits": 136, "status": "확정",
      "evidence": "drive:증명서/성적증명서.pdf" },
    { "school": "동화고등학교", "region": "경기", "start": "2015-03", "end": "2018-02", "track": "인문", "status": "확정" }
  ],
  "military": { "branch": "육군", "start": "2019-01-21", "end": "2020-08-27", "rank": "병장", "discharge": "만기제대", "status": "확정" },
  "career": [
    { "company": "빙그레", "dept": "생산담당 생산기술팀", "title": "사원", "type": "정규직",
      "start": "2024-12-23", "end": null, "duties": "유틸리티 및 에너지 관리, 신기술 도입, 생산부문 시스템 개선",
      "extraRole": "사내 AI 전문가 (2026-05-07 수료 후 현재까지)", "status": "진행중",
      "conflicts": ["일부 과거 기록 2025-01-20 → 사용자 최종 확정 2024-12-23"] },
    { "company": "인바디", "dept": "품질파트 CS팀", "title": "인턴", "start": "2024-01-29", "end": "2024-02-27",
      "duties": "국내 Customer Service Engineer 실습", "status": "확정" }
  ],
  "certifications": [
    { "name": "ADsP(데이터분석준전문가)", "issuer": "한국데이터산업진흥원", "date": "2026-03-06", "regNo": { "private": true }, "status": "확정" },
    { "name": "컴퓨터활용능력1급", "issuer": "대한상공회의소", "date": "2021-09-17", "regNo": { "private": true }, "status": "확정" }
  ],
  "languages": [
    { "test": "OPIc", "lang": "영어", "grade": "Intermediate High (IH)", "date": "2025-08-13", "regNo": { "private": true, "openQuestion": "성적표 원본 대조" }, "status": "확정" }
  ]
}
```

### 3.5 제출 이력 `applications/index.json`

```jsonc
[
  {
    "id": "2026H2-LGES-manufacturing-intelligence",
    "company": "LG에너지솔루션", "role": "제조지능화(원격)", "season": "2026 하반기",
    "submittedAt": "2026-09-11", "result": "대기",
    "drive": { "hwpx": "1W-v5LOaiYwAQWtjyHxo8Wn1fZl2C1shJ", "txt": "1-XKB7nI1fI80zoAyFq-mEwthI5SSCKcv" },
    "questions": [
      { "no": 1, "topic": "가장 노력한 경험", "cardIds": ["EXP-TELECHIPS-EMBEDDED"] },
      { "no": 2, "topic": "지원동기", "cardIds": ["EXP-BG-ENERGY-WEB"] },
      { "no": "특화", "topic": "디지털 제조·원격", "cardIds": ["EXP-BG-ENERGY-WEB", "EXP-BG-ENERGY-FORECAST"],
        "metricIds": ["forecast-mape-power", "forecast-mape-fuel", "forecast-mape-water"] }
    ],
    "lint": { "ranAt": "2026-09-12", "status": "pass", "notes": ["전력·연료·용수 개별값 사용 — 정본과 일치"] }
  }
]
```

### 3.6 검증 규칙 (빌드 시 실패)

| 검사 | 실패 조건 |
|---|---|
| 참조 무결성 | `{{metric:x}}`, `cardIds`, `metricIds`, `projectSlugs`, `relatedCards`가 존재하지 않는 ID를 가리킴 |
| 미확정 노출 | `status: 미확정` 수치·카드가 `publicOnSite: true`로 렌더링됨 |
| 금지 표현 | `content/**`(ledger 제외)와 `app/**` 텍스트에 `phrases.forbidden` 또는 카드 `forbidden`이 등장 |
| 폐기 수치 | `metrics[*].deprecated` 값이 `content/**` 텍스트에 등장 (예: `월 15시간`) |
| 날짜 형식 | `YYYY-MM-DD` 또는 `YYYY-MM` 이외, `start > end` |
| 카드 완결성 | 카드에 `status`, `title`, `org`, 본문 `## 수행` 없음 |
| 개인정보 유출 | `facts.json`·카드 본문에 전화번호·주민번호·주소 패턴 등장 |
| 프로젝트 연결 | `projects/*.md`의 `experienceIds`가 카드에 없음, 카드의 `projectSlugs`가 프로젝트에 없음 |

구현은 기존 `lib/content.ts`의 `require*` 패턴을 확장한다. 별도 스키마 라이브러리 없이도 가능하지만, 필드가 많아지므로 `zod` 도입을 권장한다(런타임 의존성 아님, 빌드 전용).

---

## 4. UI·시각 설계

### 4.1 방향에 대한 솔직한 의견

- v1 설계는 "3D 그래픽 사용 금지"를 명시했고, 그 판단은 채용담당자용 사이트에서는 지금도 옳다. 3D는 대개 로딩을 늦추고 내용을 가린다.
- 그런데 사용자의 2026 하반기 LG에너지솔루션 자소서는 "Three.js를 학습하고 AI를 활용해 3D 원격 모니터링 시제품을 만들겠다"를 입사 후 포부로 썼다. **이 포트폴리오에 3D 장면이 있으면 그 문장은 포부가 아니라 증거가 된다.** 그래서 3D를 넣되, 그 이유를 화면에 드러내는 방식으로 넣는다.
- 결론: **3D는 첫 화면 1개 장면**만, 나머지는 v1의 절제된 시스템을 다듬는다. "5개 공장 에너지 데이터 흐름"이라는 실제 업무를 장면으로 만들고, 장면 아래에 "이 장면은 어떻게 만들었나 →" 링크를 둔다. 프로젝트 카드나 섹션 배경에 3D를 흩뿌리지 않는다.

### 4.2 첫 화면 3D 장면 — "5-Plant Energy Graph"

**장면**

- 아이소메트릭 저폴리곤 무대 위에 공장 블록 5개(남양주1·남양주2·김해·광주·논산). 각 블록에서 중앙 BEMS 노드로 전력·연료·용수 3색 데이터 펄스가 흐른다.
- 중앙 노드 위로 예측 구간 리본(P05~P95 띠)이 실측 선과 함께 흐른다. 실제 대시보드의 시각 언어(`bems-dashboard.png`)를 3D로 옮긴 것이라 설명 문장이 필요 없다.
- 색: 기존 토큰만 사용(`--blue`, `--cyan`, `--sky`, `--ink`). 텍스처 없음, 조명은 ambient + directional 1개, 후처리 없음.
- 상호작용: 마우스 이동에 따른 미세한 시차(±3°), 공장 블록 hover 시 이름과 담당 데이터 툴팁. 스크롤 시 카메라가 천천히 물러난다. 자동 회전은 하지 않는다.

**기술**

- `three` + `@react-three/fiber` + `@react-three/drei`(필요한 것만 import). React 19·Next 16과 호환되는 R3F 9.x.
- `next/dynamic(…, { ssr: false })`로 클라이언트 전용. 마운트는 `requestIdleCallback` 이후. 정적 export와 충돌 없음.
- 지오메트리는 코드로 생성(box·cylinder·tube). glTF 파일을 두지 않아 저장소가 무겁지 않고 basePath 문제도 없다.
- 오프스크린 시 렌더 루프 정지(`IntersectionObserver` + `frameloop="demand"`).

**로드 조건과 대체물**

| 조건 | 동작 |
|---|---|
| `prefers-reduced-motion: reduce` | 정적 포스터(`public/hero-poster.webp`, 같은 장면을 오프라인 렌더) |
| WebGL2 미지원, `navigator.deviceMemory < 4` | 정적 포스터 |
| 뷰포트 < 720px | 정적 포스터 (모바일 기본). 설정으로 켤 수 있게 남김 |
| 3D 청크 로드 실패 | 정적 포스터 |
| 그 외 | 텍스트·수치가 먼저 그려진 뒤 포스터 위에 캔버스가 페이드인 |

포스터는 `scripts/render-hero-poster.mjs`(Playwright 헤드리스)로 같은 장면에서 생성한다. 장면을 바꾸면 포스터도 같이 바뀐다.

**성능 예산**

| 항목 | 예산 |
|---|---|
| 3D 청크 (gzip) | ≤ 250KB. `three` 트리셰이킹 + drei 부분 import |
| 삼각형 | ≤ 20,000. 공장 블록은 InstancedMesh |
| LCP | 3D와 무관. Hero 텍스트와 포스터가 LCP 후보 |
| CLS | 0. 캔버스 컨테이너는 `aspect-ratio` 고정 |
| Lighthouse | Performance·Accessibility·Best Practices·SEO 각 90 이상 (v1 기준 유지) |

**증거로 연결**

- 새 프로젝트 사례 `content/projects/portfolio-3d-scene.md`와 카드 `EXP-PORTFOLIO-3D`(상태: 진행중)를 만든다. 장면 설계·성능 예산·대체물 전략을 문제→수행→검증 순으로 쓴다. 자소서의 "3D 모니터링" 포부는 이 카드를 인용한다.

### 4.3 시각 시스템 갱신

| 요소 | v1 | v2 |
|---|---|---|
| 글꼴 | 시스템 산세리프 폴백 | **Pretendard Variable** dynamic subset (jsDelivr CSS, `font-display: swap`). 수치·ID·기간은 `JetBrains Mono` 또는 시스템 모노 |
| 색 | 라이트 전용 | 라이트 유지 + **다크 모드** 토큰 세트(`prefers-color-scheme`, 수동 토글 없음). 3D 장면도 토큰을 읽는다 |
| 수치 표현 | 값 + 라벨 + 근거 한 줄 | 값 + 라벨 + **조건 칩**("최근 6개월 · 전 공장 평균") + 클릭 시 근거 팝오버(산출 조건, 확정일, 관련 카드) |
| 상태 | `진행 중` 칩 | `확정 / 진행중 / 부분확정` 칩. 미확정은 노출 안 함 |
| 카드 | 테두리·그림자 변화 | 유지 + 마우스 위치 기반 **2° 기울기**(CSS `perspective`, WebGL 아님). reduced-motion에서 제거 |
| 섹션 헤더 | 번호 + 제목 | 유지 + 얇은 격자 배경(전자전기 정밀함의 은유, v1 6.1 의도 유지) |
| 이미지 | `<img>` 그대로 | 갤러리 라이트박스, 캡션 유지, `loading="lazy"` 유지 |

### 4.4 정보 구조 변경

```
/                        Hero(3D) → 주요 성과(레지스트리 수치) → 대표 프로젝트 → 경험 타임라인 → 보유 기술 → 아카이브 → 기본 이력 → 연락
/projects/[slug]/        유지 + "관련 경험 카드" 블록 + 수치 칩 + 갤러리 라이트박스
/experience/[id]/        신규. 카드 1장 = 페이지 1개 (EXP-*, EDU-*)
/experience/             신규. 전체 카드 목록, 직무군 필터(selection-guide 기반)
/ai/ledger.json          기계용 (빌드 생성)
/llms.txt, /llms-full.txt 기계용 (빌드 생성)
```

**경험 타임라인 (홈)** — 2018 홍익대 → 2019~20 육군 → 2023 SEMI → 2024.01 인바디 → 2024.06~12 텔레칩스 → 2024.12 빙그레 → 2026.02~05 AI Elite → 현재. 데스크톱은 가로, 모바일은 세로. 각 점은 카드 페이지로 간다. 현재 `ExperienceAccordion`을 대체한다.

**경험 카드 페이지** — 사람에게 보여주는 것과 기계에만 주는 것을 나눈다.

| 화면에 보임 | 기계 전용 (`/ai/ledger.json`, 저장소) |
|---|---|
| 제목, 소속, 기간, 상태 칩, 태그 | `useFor`, `excludeFor` |
| 배경 → 수행 → 성과(수치 칩) → 현재 활용 → 배운 점 | `forbidden` 표현 |
| 정본 표현 1~2문장 ("한 줄 요약") | `openQuestions` |
| 관련 프로젝트·증빙 링크 (공개 가능한 것만) | `teamContext` 상세 |

**하드코딩 제거** — `app/page.tsx`의 `capabilities`는 `content/skills.json`으로, `qualifications`는 `facts.json`에서 생성한다.

### 4.5 반응형·접근성

v1 기준(360/768/1440, 키보드 조작, WCAG AA, reduced-motion) 유지. 추가:

- 3D 캔버스는 `aria-hidden`, 장면 설명은 시각적으로 숨긴 텍스트로 제공.
- 수치 근거 팝오버는 `<button aria-expanded>` + `<dialog>` 또는 `popover` 속성. 키보드로 열고 닫힌다.
- 다크 모드에서 대비 재검증. 3D 장면의 선 색도 토큰에서 읽으므로 자동 전환.

---

## 5. 구글드라이브 연동

### 5.1 방식 비교

| 방식 | 장점 | 단점 | 판정 |
|---|---|---|---|
| **Claude(Cowork/Code) + Drive 커넥터 루틴** | 설정 0. 이 세션이 이미 md·txt·pdf를 읽고 있다. hwpx 판단, 카드 매칭 같은 판단 작업에 강함. 예약 루틴 가능 | 사람이 세션을 만들어야 함(루틴으로 완화). 결정론적이지 않음 | **1단계 채택** |
| **Google Apps Script** (Drive 안에서 GitHub Pages의 생성물을 fetch해 Drive 파일 덮어쓰기) | 비밀키가 GitHub에 없다. 10줄. 시간 트리거 | Drive → 저장소 방향은 GitHub 토큰이 필요 | **2단계 채택 (저장소 → Drive 미러)** |
| GitHub Actions + 서비스 계정 | 완전 자동, 양방향 | GCP 프로젝트·Drive API·서비스 계정 JSON을 GitHub Secret으로. 폴더를 서비스 계정 이메일에 공유해야 함 | 3단계 선택지 |
| rclone in Actions | SDK 없이 파일 동기화 | 위와 같은 인증 필요 | 대안 |
| 수동 | — | 지금 상태. 다시 어긋난다 | 탈락 |

### 5.2 흐름별 설계

**F1. 저장소 → Drive: 원장 미러**

1. `npm run build`가 `scripts/export-ledger-md.mjs`로 `dist/지원서_마스터이력_김종우.md`를 생성한다. 원장 v1.2와 같은 절 구조(0~14절)를 유지하고 머리말에 다음을 넣는다.
   ```
   ---
   document_type: application_master_profile
   generated_from: github.com/kjw413/career-portfolio-web@<commit>
   generated_at: 2026-09-12T…
   warning: 이 파일은 생성물입니다. 수정은 저장소 content/ledger/ 에서 합니다.
   ---
   ```
2. 배포 워크플로가 이 파일을 `out/ai/ledger.md`로도 내보낸다(공개 URL).
3. Apps Script(시간 트리거, 매일 1회)가 `https://kjw413.github.io/career-portfolio-web/ai/ledger.md`를 fetch해 Drive 파일 `1G258F_3-ERP_1YHzIacxvrKLKplJl4jC`를 덮어쓴다. 스크립트는 부록 B.
4. 개인정보 부록 `지원서_비공개정보_김종우.md`는 원장 v1.2의 1절·1.1절·5절 등록번호·6절 등록번호를 잘라 만든다. 저장소에 절대 넣지 않는다. 지원서 양식 자동입력 때만 Drive에서 읽는다.

**F2. Drive → 저장소: 제출 이력 manifest**

1. Claude 루틴(주 1회, Cowork 또는 Claude Code 예약)이 `2026 상반기/`, `2026 하반기/`, `합격자소서/`를 스캔한다.
2. `applications/index.json`에 없는 파일이 있으면 텍스트를 추출(txt 우선, 없으면 hwpx → 부록 B 스크립트)하고 검사기(F3)를 돌린 뒤, manifest 항목과 검사 보고서를 담은 PR을 연다.
3. 사용자는 PR에서 카드 매칭과 결과(합격·불합격·대기)만 확인한다. 자소서 본문은 PR에 포함되지 않는다.

**F3. 자소서 검사기 `scripts/claim-lint.mjs`**

입력: 자소서 텍스트 + 지원 직무군. 출력: 마크다운 보고서 + 종료 코드.

| 단계 | 방법 | 출력 예 |
|---|---|---|
| ① 수치 추출 | 정규식으로 `숫자+단위`(%·시간·분·초·개·명·년·개월·배·%p), `A → B` 패턴 | `7%`, `40분 → 3분`, `1년 6개월` |
| ② 레지스트리 대조 | 단위·주변 키워드(`aliases`)로 metric 매칭. `value` 일치 / 근사(7 vs 7.3) / 미등록 | `7% ≈ forecast-mape-power? 문맥 "전 공장 3가지 에너지원" → forecast-mape-all(7.3) 불일치` |
| ③ 폐기 수치 | `deprecated` 값 검색 | `월 15시간 → mis-rpa-daily-saving 사용` |
| ④ 금지 표현 | 공백·조사 정규화 후 문자 3-gram 유사도 ≥ 0.8 | `"수치 기반 관리 체계로 전환" → forbidden (EXP-BG-ENERGY-FORECAST)` |
| ⑤ 카드 적합성 | 카드별 키워드 집합으로 사용 카드 추정 → `selection-guide`의 `기본 제외`와 대조 | `반도체 직무에 EXP-CLUB-BUDGET 사용 → 경고` |
| ⑥ 기간 재계산 | `총 경력 N년 M개월` 발견 시 `facts.career`와 제출일로 재계산 | `1년 6개월 → 제출일 기준 1년 8개월` |
| ⑦ 미확정 사용 | `status: 미확정` 수치·카드 인용 | `역전 3회 → 미확정` |

A12의 현대모비스 자소서를 이 검사기에 넣으면 ②(7% vs 7.3%)와 ④(관리 체계 전환)에서 경고가 나온다. 제출 전에 잡을 수 있었던 항목이다.

**F4. 원장 갱신 루프**

```
사용자가 대화에서 사실을 확정  →  AI가 content/ledger/ 수정 PR  →  CI 검증  →  merge
→  사이트 재빌드  →  ledger.md 재생성  →  Apps Script가 Drive 미러 갱신
```

원장 v1.2의 0.1 사실 우선순위(대화 확정 > 공식 증빙 > 최근 지원서 > 과거 기록)를 `ledger/README.md`에 그대로 옮긴다. 확정 시 `confirmedAt`과 `basis`를 반드시 적는다.

### 5.3 hwpx 처리

hwpx는 zip이다. `Contents/section*.xml`의 `<hp:t>` 텍스트를 순서대로 이으면 본문이 나온다. 표·각주는 순서가 섞일 수 있어 자소서(문항+답변 구조)에는 충분하고 이력서 표에는 부족하다. 스크립트는 부록 B. 사용자가 이미 `2026 하반기/`에서 하듯 hwpx 옆에 txt를 같이 두는 습관을 규칙으로 만든다.

### 5.4 개인정보 경계

| 저장소에 넣지 않음 | 근거 |
|---|---|
| 생년월일, 주소·우편번호·상세주소, 휴대전화, 비상연락처(모), 한문명 | 원장 1절·1.1절 |
| 자격증·어학 등록번호 | 원장 5·6절 |
| 주민등록등본·초본·신분증·병적증명서 등 증명서 실물 | 드라이브 `증명서/`에만. 저장소는 `evidence: "drive:증명서/…"` 문자열만 |
| 자소서 본문, 면접 복기, 과제 제출물 | 드라이브에만. manifest는 메타데이터만 |

검증 규칙(3.6)의 개인정보 패턴 검사가 실수로 들어간 전화번호·주소를 빌드에서 막는다.

---

## 6. AI 자소서 파이프라인

### 6.1 진입점

| 경로 | 내용 | 대상 |
|---|---|---|
| `/llms.txt` | 사이트 개요 + 각 카드·프로젝트 URL 목록 + 사용 규칙 요약 (llms.txt 관례) | 사이트만 읽는 AI |
| `/llms-full.txt` | 카드 본문·수치·정본 표현 전문 (텍스트 1개 파일) | 사이트만 읽는 AI |
| `/ai/ledger.json` | `content/ledger/` 전체를 합친 JSON (forbidden 포함 여부는 `publicGuidance` 옵션) | 구조화 접근 |
| `/ai/ledger.md` | 드라이브 미러와 같은 md | Apps Script, 사람 |
| 저장소 `CLAUDE.md` | 저장소를 연 AI가 처음 읽는 규칙. 사실 우선순위·상태 처리·금지 표현 정책·카드 선택 절차 | Claude Code |
| 저장소 `.claude/skills/cover-letter-ledger/SKILL.md` | 자소서 작성 절차(6.2) | Claude Code / Cowork |

`llms.txt`와 `ledger.json`은 `scripts/build-ai-exports.mjs`가 `next build` 전에 `public/`에 쓴다. 정적 export와 맞는다.

### 6.2 작성 절차 (저장소 스킬)

```
1. 입력: 회사, 직무, 문항 목록, 글자수, 제출일
2. content/ledger/ 로드 (또는 /ai/ledger.json fetch)
3. selection-guide로 직무군 판정 → 1순위·보조·기본 제외 카드 결정
4. 문항별 카드 배정 (1문항 1~2카드). 배정표를 먼저 사용자에게 보여준다
5. 초안 작성. 수치는 metricIds로 인용하고, canonical 문장을 우선 사용
   (기존 anthropic-skills:cover-letter-writing 스킬의 문항별 구조 규칙을 그대로 적용)
6. 자체 검사: npm run lint:claims -- --text 초안 --job <직무군>
7. 출력: 본문 + 근거표(문항 → 카드 ID → 수치 ID → 정본 표현) + openQuestions에서 걸린 "확인 필요" 목록
8. 저장: Drive <시즌>/<회사>_<직무>.txt 업로드 + applications/index.json 항목 추가 PR
```

핵심은 5·6·7이다. AI가 수치를 "기억"하지 않고 ID로 인용하게 하고, 결과물에 근거표를 붙여 사용자가 검토할 때 원장 대조를 안 해도 되게 한다.

### 6.3 원장 v1.2 규칙의 이식

| 원장 절 | 이식 위치 |
|---|---|
| 0.1 사실 우선순위 | `ledger/README.md`, `CLAUDE.md` |
| 0.2 자동입력 원칙 | `CLAUDE.md` (자소서 완성문은 요청 시에만, B2B 프로젝트란 규칙, 날짜 형식, 재직기간 재계산) |
| 0.3 상태 표기 | 모든 카드·수치의 `status` 필드 |
| 0.4 BEMS 확정 사실·금지 표현 | `EXP-BG-ENERGY-WEB.md`, `EXP-BG-ENERGY-FORECAST.md`의 `canonical`·`forbidden`, `metrics.json` |
| 8·9 카드 인덱스·상세 | `experiences/*.md` (인덱스는 빌드가 생성) |
| 10 직무별 선택 가이드 | `selection-guide.json` |
| 11 충돌·미확정 | `open-questions.json` + 각 카드 `openQuestions` |
| 12 입력 체크리스트 | `CLAUDE.md` |
| 13 템플릿 | `experiences/_TEMPLATE.md` |
| 14 변경 이력 | git log + `CHANGELOG-ledger.md`(빌드 생성) |

---

## 7. 구현 로드맵

각 Phase는 독립 PR 1~3개로 끝나고, 끝날 때 `npm run lint && npm test && npm run build`가 통과해야 한다.

### Phase 0 — 불일치 수정 (1일, 코드 변경 없음)

1.3 감사표의 A1~A8·A13을 원장 v1.2 확정값으로 고친다. 자세히:

- [ ] A1: `profile.json` metrics.forecast → `MAPE 7.3%` / "전 공장·전 에너지원 평균 · 최근 6개월"; impacts.bems.result → "5개 공장 통합, 예측 오차 MAPE 7.3%"; `ai-elite-bems.md` 65행 → 7.3% + 전력 7%·연료 10%·용수 10%·최저 4.2%
- [ ] A2: `experience.json:12` → "에너지 사용량 예측모델 개발 — 예측치를 실적과 함께 보조지표로 활용, 전 공장·전 에너지원 평균 MAPE 7.3%"
- [ ] A3: `experience.json:37` → "CAN can0·can1 송수신 시도, 필터·종단저항·Bus Off 오류 분석 후 UART로 전환"; `profile.json:76`·`telechips…md:26` 동일 취지
- [ ] A4: `experience.json:24` → "선발 계기 — 투자품의 전산 등록 검토 자동화가 사내 업무혁신 사례로 이어짐"
- [ ] A5: `월 15시간` 6곳 → "일 40분 (월 14.66시간 환산)". SVG 텍스트 포함
- [ ] A6: `experience.json:19` → "2026.02 ~ 2026.05 수료 · 이후 사내 AI 전문가 역할 수행 중"
- [ ] A7·A8: 표현 정밀화
- [ ] A13: `role`의 "2년차"를 `tenure.ts`로 계산한 값으로 교체
- [ ] A9: 사용자 결정 전까지 `ai-elite-bems.md`에 "운영 버전: Streamlit v1 / 개발 중: React·FastAPI v2" 구분 문장 추가

수용 기준: 사이트 어느 화면에도 원장 0.4 금지 표현과 폐기 수치가 없다.

### Phase 1 — 원장 구조화 + 검증 CI (1주)

- [ ] `content/ledger/` 생성. 원장 v1.2의 13개 카드 + EDU 3개를 `experiences/*.md`, `education.json`으로 이식. 수치 30여 개를 `metrics.json`으로
- [ ] A10의 사이트 전용 내용을 원장 카드에 추가 (PICP·Pinball·신설 라인 보정·그리드 지문 검사 등). A11의 카드 7장을 사이트 렌더 대상으로 표시
- [ ] `lib/ledger.ts` 로더 + 3.6 검증 규칙 + 테스트
- [ ] `{{metric:id}}` 치환기. `profile.json`·`projects/*.md`의 직접 기재 수치를 참조로 교체
- [ ] `content/experience.json` 폐지 → 카드에서 생성
- [ ] `scripts/build-ai-exports.mjs` → `public/ai/ledger.json`, `public/ai/ledger.md`, `public/llms.txt`, `public/llms-full.txt`
- [ ] `CLAUDE.md`, `ledger/README.md`
- [ ] `applications/index.json` 초기 적재: 2026 상반기 10건 + 합격 4건 + 2026 하반기 6건 (카드 매칭은 Claude 루틴이 초안 작성, 사용자가 PR에서 확인)

수용 기준: 폐기 수치를 어느 파일에 넣어도 빌드가 실패한다. `/ai/ledger.json`만 읽고 AI가 A1~A8을 정확히 답한다.

### Phase 2 — UI v2 (1주)

- [ ] 디자인 토큰 정리, 다크 모드, Pretendard Variable, 모노 숫자
- [ ] 경험 타임라인 컴포넌트 (아코디언 대체), `/experience/`, `/experience/[id]/`
- [ ] 수치 칩 + 근거 팝오버 컴포넌트 (Hero·주요 성과·프로젝트 상세·카드 페이지 공용)
- [ ] 프로젝트 상세: 관련 카드 블록, 갤러리 라이트박스
- [ ] `capabilities`·`qualifications` 하드코딩 제거
- [ ] 카드 기울기·격자 배경 등 미세 모션, reduced-motion 처리
- [ ] 360/768/1440 검증, Lighthouse 90+

권장: 이 Phase 전에 **Claude Design**으로 홈·카드 페이지·다크 모드 목업을 먼저 만든다(8절).

### Phase 3 — 3D 첫 화면 (1주)

- [ ] `three`, `@react-three/fiber`, `@react-three/drei` 추가. 번들 분석으로 250KB 예산 확인
- [ ] `app/components/hero-scene/` — Scene, PlantBlock(Instanced), DataPulse, ForecastRibbon, 토큰 연동
- [ ] 로드 게이트(4.2 표) + 포스터 대체 + 페이드인
- [ ] `scripts/render-hero-poster.mjs` (Playwright)
- [ ] `content/projects/portfolio-3d-scene.md` + `EXP-PORTFOLIO-3D` 카드
- [ ] 저사양·모바일·reduced-motion 시나리오 테스트, Lighthouse 재검증

수용 기준: 3D를 끈 상태와 켠 상태의 LCP 차이 ≤ 0.2s. 포스터만 봐도 장면의 의미가 읽힌다.

### Phase 4 — 드라이브 연동 (3일)

- [ ] F1: `scripts/export-ledger-md.mjs` + 배포 워크플로에 `out/ai/ledger.md` 포함
- [ ] F1: Apps Script 배포(부록 B) + 일일 트리거. 기존 `_v1.2.md`는 `_archive/`로 이동하고 새 파일명 `지원서_마스터이력_김종우.md`로 고정
- [ ] `지원서_비공개정보_김종우.md` 분리 (사용자 승인 후 Claude가 Drive에 생성)
- [ ] F3: `scripts/claim-lint.mjs` + `npm run lint:claims` + 테스트(현대모비스 A12 케이스를 픽스처로)
- [ ] F2: Claude 루틴 프롬프트 작성 → Cowork 예약(주 1회). 부록 B에 프롬프트
- [ ] root의 hwpx 중복 12건 정리 제안 (사용자 확인 후 휴지통)

### Phase 5 — AI 자소서 스킬 (3일)

- [ ] `.claude/skills/cover-letter-ledger/SKILL.md` (6.2 절차). `anthropic-skills:cover-letter-writing`을 하위 스킬로 호출
- [ ] 스킬 출력 형식: 본문 + 근거표 + 확인 필요 목록
- [ ] 실전 검증: 2026 하반기 6건 중 1건을 스킬로 다시 써서 제출본과 비교, 검사기 통과 확인
- [ ] `README.md` 갱신: 원장 수정 절차, 자소서 작성 절차, 드라이브 규칙

---

## 8. 작업 도구 추천

| 단계 | 도구 | 이유 |
|---|---|---|
| Phase 2 목업, 3D 장면 구도·색 | **Claude Design** | 코드 전에 홈·카드 페이지·다크 모드 아트보드를 놓고 직접 조정. 3D 장면의 카메라 각도·색 배치를 2D 시안으로 먼저 합의 |
| Phase 0·1·2·3·5 구현 | **Claude Code (웹)** | 저장소 브랜치에서 PR 단위로. 이 세션과 같은 환경 |
| Phase 4 드라이브 스캔·원장 갱신 루틴, 주간 검사 | **Cowork** | Drive 커넥터 + 예약 실행. 파일 판단이 필요한 작업에 적합 |
| 자소서 실제 작성 | **Claude 웹** + 저장소 스킬 | 사이트·저장소만 참조하게 하고 근거표를 받는다. 대화 중 확정된 사실은 Phase 4 루프로 원장에 반영 |

---

## 9. 리스크·반대 의견·결정 필요 사항

### 9.1 반대 의견 (검토 결과)

- **"3D 넣지 마라"** — 채용담당자 관점에서는 여전히 타당하다. 그래서 1개 장면, 모바일 기본 끔, 포스터 대체, LCP 무영향을 조건으로 건다. 이 조건을 못 지키면 Phase 3은 포스터(정적 3D 렌더 이미지)로 끝내도 목표의 대부분을 달성한다.
- **"원장은 도구가 아니라 습관 문제다"** — 맞다. 스키마와 검사기는 어긋남을 *발견*할 뿐이고, 원장을 먼저 고치는 습관이 없으면 소용없다. 그래서 F4 루프에서 "대화 확정 → 즉시 원장 PR"을 AI의 기본 행동으로 `CLAUDE.md`에 박는다.
- **"공개 저장소에 표현 규칙을 두면 이상해 보인다"** — `forbidden`은 사이트 화면에 렌더링하지 않는다. `/ai/ledger.json`에 포함할지는 `publicGuidance` 옵션이며 기본값은 **제외**로 두고, AI는 저장소를 직접 읽게 한다.

### 9.2 리스크

| 리스크 | 완화 |
|---|---|
| 3D로 성능·접근성 저하 | 4.2 로드 게이트와 예산. Lighthouse를 CI에 추가 |
| 원장 이식 중 원장 v1.2와 의미가 달라짐 | Phase 1 PR에 v1.2 ↔ 생성 md diff를 첨부해 사용자가 검토 |
| hwpx 텍스트 추출 누락 | txt 병행 저장 규칙. 검사기는 txt 우선 |
| Apps Script가 사용자 계정 권한으로 동작 | 읽기는 공개 URL, 쓰기는 파일 1개로 한정 |
| 미확정 항목이 계속 미확정으로 남음 | `open-questions.json`을 홈에는 안 보이고 `/experience/`의 관리자용 섹션이 아닌 **PR 체크리스트**로 노출. 자소서 스킬이 매번 "확인 필요" 목록을 낸다 |
| 자소서 본문이 실수로 저장소에 커밋됨 | `.gitignore`에 `applications/**/*.txt`, 검증 규칙의 개인정보 패턴, PR 템플릿 체크 항목 |

### 9.3 사용자 결정이 필요한 항목

1. **A9 BEMS 기술 스택** — 원장에 운영/개발 버전을 나눠 적는 안에 동의하는가.
2. **3D 범위** — Phase 3 전체(인터랙티브) vs 포스터 이미지까지만.
3. **`publicGuidance` 기본값** — `/ai/ledger.json`에 금지 표현을 포함할지(기본: 제외).
4. **드라이브 파일명 고정** — 원장 미러를 `지원서_마스터이력_김종우.md`(버전 접미사 없음)로 바꾸는 데 동의하는가. 버전은 머리말의 commit으로 추적.
5. **비공개 부록 분리** — `지원서_비공개정보_김종우.md` 생성을 Claude가 해도 되는가(Drive 쓰기).
6. **원장 빈틈** — `자동화시스템도입기초_수료증`(2025-05), 사이트의 PLC 직교로봇·데이터 샘플링 자동화를 카드로 만들 것인가.

이 6개는 Phase 0·1 시작 전에 답이 있으면 좋고, 없으면 각 항목의 기본값(본문에 표시)으로 진행한 뒤 PR에서 바꾼다.

---

## 부록 0. 구현하며 설계에서 바꾼 것

기록을 남깁니다. 설계와 다르게 한 것은 전부 여기에 적습니다.

| 설계 | 실제 | 이유 |
|---|---|---|
| `/experience` 페이지는 Phase 2 | Phase 1에서 함께 만듦 | `llms.txt`가 카드 URL을 가리키는데 페이지가 없으면 죽은 링크가 공개된다 |
| 수치는 클릭 시 근거 팝오버 | 조건을 항상 보이게 두고, 카드 페이지로 보내는 링크를 붙임 | 근거를 숨기지 않기로 한 기존 결정(`Hero.test.tsx`)이 채용담당자에게 더 낫다 |
| 카드에 마우스 위치 기반 2° 기울기 | 넣지 않음 | 자바스크립트를 더해 얻는 것이 적고, 흔한 생성형 장식으로 읽힌다. 기존의 들어올림+그림자를 유지 |
| 섹션 헤더에 격자 배경 | 넣지 않음 | 화면이 이미 선과 수치로 충분히 정밀하다. 장식을 더하면 수치가 묻힌다 |
| 경력 아코디언 유지 후 타임라인 추가 | 아코디언을 타임라인으로 교체 | 두 벌을 두면 같은 내용이 두 곳에서 갈라진다 |
| 제출 이력 manifest에 회사명 기재 | 회사명·직무명 제외, 직무군만 기재 | 공개 저장소다. 재직 중인 사람의 지원 대상 목록이 공개되면 현 직장에서 그대로 보인다 |
| 카드 `highlights` 없음 | 카드마다 1~4개 추가 | 원장을 SSOT로 바꾸면서 홈 화면 세부 항목이 한 줄로 줄어드는 손실을 막기 위해 |

## 부록 A. 원장 이식 매핑 (v1.2 → content/ledger/)

| v1.2 카드 | 파일 | 상태 | 사이트 노출 | 연결 프로젝트 |
|---|---|---|---|---|
| EXP-BG-ENERGY-WEB | experiences/EXP-BG-ENERGY-WEB.md | 진행중 | O | ai-elite-bems |
| EXP-BG-ENERGY-FORECAST | experiences/EXP-BG-ENERGY-FORECAST.md | 확정 | O | ai-elite-bems |
| EXP-BG-DATA-RPA | experiences/EXP-BG-DATA-RPA.md | 완료(확정) | O | ai-elite-mis-rpa |
| EXP-BG-INVEST-RPA | experiences/EXP-BG-INVEST-RPA.md | 완료(확정) | O | investment-checker-rpa |
| EXP-BG-SYSTEM-COLLAB | experiences/EXP-BG-SYSTEM-COLLAB.md | 확정 | O (신규 노출) | — |
| EXP-BG-MIXEDPACK | experiences/EXP-BG-MIXEDPACK.md | 확정 | O (수치 신규 노출) | — |
| EXP-INBODY-CLAIM | experiences/EXP-INBODY-CLAIM.md | 확정 | O | — |
| EXP-DATA-LAG3 | experiences/EXP-DATA-LAG3.md | 부분확정 | O (미확정 필드 숨김) | — |
| EXP-TELECHIPS-EMBEDDED | experiences/EXP-TELECHIPS-EMBEDDED.md | 확정 | O | telechips-embedded-school-pmsa-project |
| EXP-UNIV-POWERFLOW | experiences/EXP-UNIV-POWERFLOW.md | 확정 | O (신규) | — |
| EXP-UNIV-MCU | experiences/EXP-UNIV-MCU.md | 확정 | O (신규) | — |
| EXP-CLUB-BUDGET | experiences/EXP-CLUB-BUDGET.md | 확정 | 선택 (기본 O) | — |
| EXP-MIL-LEADERSHIP | experiences/EXP-MIL-LEADERSHIP.md | 부분확정 | X (사실 확인 전) | — |
| EDU-TELECHIPS-01 / EDU-SEMI-01 / EDU-AIELITE-01 | education.json | 확정·확정·확정(시간 미확정) | O | — |
| (신규) EXP-PORTFOLIO-3D | experiences/EXP-PORTFOLIO-3D.md | 진행중 | O | portfolio-3d-scene |
| (신규 후보) EXP-BG-PLC-ROBOT, EXP-BG-SAMPLING-RPA, EDU-AUTOMATION-BASICS | — | 미확정 | X | — |

## 부록 B. 스크립트 스켈레톤

### B.1 hwpx 텍스트 추출 (`scripts/drive/hwpx-to-text.py`)

```python
import re, sys, zipfile
from xml.etree import ElementTree as ET

NS = {"hp": "http://www.hancom.co.kr/hwpml/2011/paragraph"}

def hwpx_text(path: str) -> str:
    out = []
    with zipfile.ZipFile(path) as z:
        sections = sorted(n for n in z.namelist() if re.match(r"Contents/section\d+\.xml", n))
        for name in sections:
            root = ET.fromstring(z.read(name))
            for p in root.iter("{%s}p" % NS["hp"]):
                text = "".join(t.text or "" for t in p.iter("{%s}t" % NS["hp"]))
                if text.strip():
                    out.append(text)
    return "\n".join(out)

if __name__ == "__main__":
    sys.stdout.write(hwpx_text(sys.argv[1]))
```

### B.2 Apps Script — 원장 미러 (Drive 안에서 실행, 비밀키 없음)

```javascript
const SOURCE_URL = "https://kjw413.github.io/career-portfolio-web/ai/ledger.md";
const TARGET_FILE_ID = "1G258F_3-ERP_1YHzIacxvrKLKplJl4jC"; // 지원서_마스터이력_김종우.md

function syncLedger() {
  const res = UrlFetchApp.fetch(SOURCE_URL, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error("fetch failed " + res.getResponseCode());
  const body = res.getContentText("UTF-8");
  if (!body.startsWith("---")) throw new Error("unexpected content");
  const file = DriveApp.getFileById(TARGET_FILE_ID);
  if (file.getBlob().getDataAsString("UTF-8") !== body) file.setContent(body);
}
// 트리거: 시간 기반, 매일 1회 (Apps Script 편집기 → 트리거 → syncLedger)
```

### B.3 claim-lint 핵심 (`scripts/claim-lint.mjs`, 발췌)

```javascript
const NUM = /(\d+(?:[.,]\d+)?)\s*(%p|%|시간|분|초|개월|년|개|명|배|회)/g;
const ARROW = /(\d+(?:[.,]\d+)?\s*[가-힣%]*)\s*(?:→|->|에서)\s*(\d+(?:[.,]\d+)?\s*[가-힣%]*)/g;

export function lint(text, { metrics, phrases, cards, job, submittedAt, facts }) {
  const findings = [];
  for (const m of text.matchAll(NUM)) {
    const ctx = text.slice(Math.max(0, m.index - 40), m.index + 40);
    const hit = matchMetric(m[1], m[2], ctx, metrics);          // aliases + unit
    if (!hit) findings.push({ level: "info", kind: "unregistered", value: m[0], ctx });
    else if (hit.kind === "near") findings.push({ level: "warn", kind: "near-miss", value: m[0], expected: hit.metric.display, id: hit.id, ctx });
    else if (hit.metric.status === "미확정") findings.push({ level: "error", kind: "unconfirmed", id: hit.id, ctx });
  }
  for (const [id, metric] of Object.entries(metrics))
    for (const dep of metric.deprecated ?? [])
      if (text.includes(dep)) findings.push({ level: "error", kind: "deprecated", value: dep, use: metric.display, id });
  for (const f of [...phrases.forbidden, ...cards.flatMap((c) => c.forbidden.map((p) => ({ pattern: p, cardIds: [c.id] })))])
    if (fuzzyIncludes(text, f.pattern)) findings.push({ level: "error", kind: "forbidden", pattern: f.pattern, cardIds: f.cardIds });
  const used = detectCards(text, cards);
  for (const id of used)
    if (selectionGuide[job]?.exclude.includes(id)) findings.push({ level: "warn", kind: "excluded-card", id, job });
  for (const t of text.matchAll(/총\s*경력\s*(\d+)년\s*(\d+)개월/g))
    findings.push(checkTenure(t, facts.career[0].startDate, submittedAt));
  return { findings, usedCards: used };
}
```

### B.4 Claude 루틴 프롬프트 (Cowork, 주 1회)

```
저장소 kjw413/career-portfolio-web 의 content/ledger/ 와 content/applications/index.json 을 읽는다.
Google Drive 폴더 "2026 상반기", "2026 하반기", "합격자소서" 를 스캔해 index.json 에 없는 자소서 파일(hwpx/txt/pdf)을 찾는다.
새 파일마다: txt가 있으면 txt를, 없으면 hwpx에서 텍스트를 추출한다. 파일명에서 회사·직무를 추정한다.
scripts/claim-lint.mjs 를 그 텍스트와 직무군으로 실행한다.
index.json 항목(회사·직무·시즌·제출일 추정·Drive fileId·문항별 사용 카드 추정·lint 결과)을 추가하는 PR을 연다.
PR 본문에는 lint 보고서와 "확인 필요" 목록만 넣는다. 자소서 본문은 절대 PR에 넣지 않는다.
원장과 어긋난 사실이 자소서에 있으면 원장을 고치지 말고 open-questions.json 에 항목을 추가해 사용자에게 묻는다.
```

## 부록 C. 드라이브 파일 ID

| 항목 | ID |
|---|---|
| 지원서_마스터이력_김종우_v1.2.md | `1G258F_3-ERP_1YHzIacxvrKLKplJl4jC` |
| 2026 상반기/ | `1dCbp-A-TvU_seqUTR_JFM0406Tqxaghh` |
| 2026 상반기/합격자소서/ | `10HiDxoQs0U4VOaMW8TfOZnGUsBysNQSX` |
| 합격자소서/26(상)_SK하이닉스_기반기술/ | `1ysGv-z6gKkQPIH_I2eWTjOplGjY7ZweZ` |
| 합격자소서/26년 3분기 현대오토에버_MES운영/ | `1_EOShGjEIAMNqVmckqsIFtXWLvSsCsLV` |
| 2026 하반기/ | `1XN3kp6q8HmsQOQ6ky2-25yDjj2nQfn8y` |
| 입사지원 서류/ | `1XHJKDPAPqqfGvK_Sy1XddYasscD-K-bs` |
| 증명서/ | `1TFzIjpLCyVEuLEzgj48KZYmlmNnYu8y0` |
| 2026 하반기/LG에너지솔루션 (hwpx / txt) | `1W-v5LOaiYwAQWtjyHxo8Wn1fZl2C1shJ` / `1-XKB7nI1fI80zoAyFq-mEwthI5SSCKcv` |
| 2026 하반기/현대모비스 (hwpx / txt) | `1D7Ocf1hwhbogUYSaYbj6ORXaNRYcpWvw` / `1NujKd2QF7qxgJn6Ca2F3GujE6OTOcVEO` |
| 2026 하반기/LG전자 (hwpx / txt) | `1OjiQvblL4SrpG7OMyzZi1YD2tfc-Uv2Z` / `1nXK-t-tshClbnTxjPtgT61XpAITSnsUI` |
| 2026 하반기/AMAT (hwpx / txt) | `1zh3JVDNZ1ClHZm0ilwzdXAcPwpH7nEtr` / `1qfidnQBrMtYLK1Z6rv1T-TOmbs212LKy` |
| 2026 하반기/현대자동차 (hwpx / txt) | `1vnCRVvA5UvJ-i7v4EzvmKTVtjSZoumBF` / `1AzAb-Joe8dP62RU0cK9PARRb6vFtI1yz` |
| 2026 하반기/KT&G (hwpx / txt) | `1yS_lzit9lXvByz_CIgirbAQrrYVbnNq_` / `1fo1RsIOy4bZPkeergDvUD59gzKsJlPiy` |
| 이력서_0001.pdf | `1QgzRkLSCl9iDtRw5EC8Z6dPXCQJ_wmqM` |
| 증명서/자동화시스템도입기초_수료증.pdf | `1_QWugeNH9igH4s4TF4WMUMtTi2-cwOB0` |

## 부록 D. 설계 근거

- 원장 v1.2의 구조(카드 ID, 상태, 금지 표현, 선택 가이드)는 이미 검증된 설계라 그대로 계승했다. 본 문서가 더한 것은 *저장 위치*(저장소), *참조 방식*(ID), *검증 시점*(빌드)이다.
- `llms.txt`는 사이트가 AI에게 읽힐 내용을 스스로 선언하는 관례로, 사이트만 참조하는 시나리오의 진입점으로 채택했다.
- 3D 라이브러리는 React 19·Next 16 정적 export와 호환되고 트리셰이킹이 가능한 React Three Fiber를 택했다. Spline 같은 외부 임베드는 외부 의존과 성능 제어 불가로 제외했다.
