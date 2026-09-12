# 이 저장소를 다루는 AI를 위한 지침

김종우의 커리어 포트폴리오 사이트이자, **지원서·자기소개서에 쓰이는 사실의 원장**입니다.
사이트 화면, 구글드라이브의 마스터 이력 문서, AI용 JSON은 전부 `content/ledger/`에서
생성됩니다. 사실을 고칠 곳은 원장 하나뿐입니다.

## 0. 가장 먼저 읽을 것

- `content/ledger/README.md` — 원장의 구조와 편집 규칙
- `content/ledger/metrics.json` — 모든 정량 수치의 값·조건·확정 상태
- `content/ledger/phrases.json` — 정본 표현과 사용 금지 표현
- `content/ledger/open-questions.json` — 아직 확인되지 않은 항목

## 1. 사실 우선순위

1. 대화에서 사용자가 직접 확정한 최신 값
2. 증명서·성적표·자격증·어학성적표 등 공식 증빙
3. 가장 최근에 제출한 지원서
4. 과거 지원서와 기억에 의존한 기록

값이 충돌하면 임의로 고르지 말고 `open-questions.json`을 확인한 뒤 사용자에게 묻습니다.

## 2. 자기소개서·지원서를 쓸 때

- **수치는 지어내지 않습니다.** `metrics.json`에 없는 수치는 쓰지 않고, 있는 수치는
  값·단위·조건을 함께 씁니다. 서로 다른 경험의 수치를 합산하거나 교환하지 않습니다.
- **`status: 미확정`인 사실과 수치는 쓰지 않습니다.** 대신 "확인 필요" 목록에 넣어
  사용자에게 되돌립니다.
- **각 카드의 `forbidden` 표현은 쓰지 않습니다.** `canonical` 문장은 그대로 써도 됩니다.
- **재직기간과 총경력은 지원일 기준으로 다시 계산합니다.** 고정값을 재사용하지 않습니다.
- **경험은 지원 직무와 관련될 때만 씁니다.** `selection-guide.json`의 `exclude`를 확인합니다.
- **팀 작업은 본인 범위를 분명히 합니다.** 카드의 `teamContext`를 확인하고, 팀 결과물
  전체를 개인 성과로 쓰거나 기여율을 추정하지 않습니다.
- 자기소개서 완성문은 사용자가 명시적으로 요청할 때만 씁니다.
- 결과물에는 **근거표**(문항 → 카드 ID → 수치 ID → 정본 표현)를 붙입니다.

작성 절차는 `.claude/skills/cover-letter-ledger/SKILL.md`에 있습니다.

## 3. 사실이 새로 확정되면

대화에서 사용자가 사실을 확정하면 **그 자리에서 원장을 고칩니다.** 나중으로 미루면
사이트·드라이브·지원서가 다시 갈라집니다.

1. `content/ledger/`의 해당 파일을 고칩니다 (수치면 `metrics.json`, 경험이면 카드).
2. `basis`와 `confirmedAt`에 무엇을 근거로 언제 확정했는지 적습니다.
3. 옛 표기는 지우지 말고 `deprecated`에 남깁니다. 검사기가 재발을 막습니다.
4. `npm run lint:ledger && npm test`로 확인하고 커밋합니다.

확정되지 않았다면 원장을 고치는 대신 `open-questions.json`에 항목을 추가합니다.

## 4. 개인정보 경계

저장소와 사이트는 공개입니다. 다음은 **절대 커밋하지 않습니다.**

- 생년월일, 주소, 휴대전화, 비상연락처, 한문명
- 자격증·어학 등록번호
- 자기소개서 본문, 면접 복기, 과제 제출물
- 증명서 실물 (참조는 `drive:증명서/…` 문자열로만)

빌드가 전화번호·주민번호·상세주소 패턴을 검사해 실수를 막습니다. 지원서에 개인정보가
필요하면 드라이브의 비공개 부록을 쓰거나 사용자에게 직접 받습니다.

## 5. 명령

```bash
npm run lint:ledger   # 원장 무결성 + 공개 콘텐츠의 폐기 수치·금지 표현
npm test              # 단위 테스트 (원장 검증기의 실패 사례 포함)
npm run lint          # ESLint
npm run build         # 위 검사 → AI 내보내기 생성 → 정적 빌드
npm run ai:exports    # public/ai/*, llms.txt 재생성 (빌드가 자동 실행)
npm run poster        # 3D 장면을 고쳤을 때 정적 포스터를 다시 생성 (playwright 필요)
npm run lint:claims -- --file 초안.txt --job "제조 AI·데이터" --date 2026-09-12
                      # 자기소개서 초안을 원장과 대조
```

자기소개서를 쓰거나 고쳤으면 제출 전에 반드시 `lint:claims`를 돌립니다. 수치 불일치,
폐기된 표기, 금지 표현, 확정 전 수치, 직무에서 제외한 경험, 재직기간을 잡습니다.

`app/components/hero-scene/`를 고쳤으면 `npm run poster`로 포스터를 다시 만듭니다.
포스터는 3D를 켜지 않는 환경에서 그대로 남는 그림이라, 장면과 갈라지면 안 됩니다.

`public/ai/`, `public/llms.txt`, `public/llms-full.txt`는 생성물이라 커밋하지 않습니다.

## 6. 저장소 구조

```
content/ledger/          사실 원장 — 여기서만 씁니다
  facts.json             학력·병역·경력·자격·어학 (공개분)
  metrics.json           모든 정량 수치의 값·조건·상태·폐기 표기
  phrases.json           정본 표현과 금지 표현
  affiliations.json      타임라인 단위 소속
  education.json         EDU-* 교육 과정
  selection-guide.json   직무군별 1순위·보조·기본 제외 카드
  open-questions.json    확인이 필요한 항목
  experiences/EXP-*.md   경험 카드 (frontmatter + 본문)
content/projects/*.md    프로젝트 사례 (사이트 상세 페이지)
content/applications/    제출 이력 manifest (메타데이터만, 본문 없음)
lib/ledger-core.mjs      원장 읽기·검증 (앱과 스크립트가 공유)
lib/ledger.ts            화면용 타입과 파생
scripts/ledger-lint.mjs  검증 실행기
scripts/build-ai-exports.mjs  llms.txt · ledger.json · ledger.md 생성
scripts/claim-lint.mjs   자기소개서 본문 ↔ 원장 대조
scripts/drive/           드라이브 연동 (원장 미러 Apps Script, hwpx 텍스트 추출)
```

설계 배경은 `docs/superpowers/2026-09-12-portfolio-v2-design.md`에 있습니다.
