# 구글드라이브 연동

드라이브에는 자기소개서 제출본, 증명서, 개인정보가 있고 저장소에는 사실 원장이
있습니다. 둘을 한 방향씩 이어 둡니다.

```
저장소 content/ledger/  ──빌드──▶  /ai/ledger.md  ──Apps Script──▶  드라이브 마스터 이력 문서
드라이브 자소서 폴더    ──Claude 루틴──▶  content/applications/index.json (메타데이터만)
```

## 1. 저장소 → 드라이브 (원장 미러)

`sync-ledger.gs`를 드라이브의 Apps Script에 넣고 일 단위 트리거를 겁니다. 설치 방법은
파일 맨 위 주석에 있습니다.

`TARGET_FILE_ID`는 이미 채워져 있습니다 (`지원서_마스터이력_김종우_v1.2.md`).
첫 실행에서 그 문서가 저장소에서 생성된 원장으로 바뀝니다. v1.2의 내용은 이미
`content/ledger/`로 옮겨져 있어 사라지는 사실은 없고, 드라이브 버전 기록으로 되돌릴 수
있습니다. 원본을 그대로 두고 싶으면 빈 문서를 하나 만들어 그 ID로 바꾸세요.

- GitHub 토큰이나 서비스 계정 키가 필요 없습니다. 공개 URL을 읽어 파일 하나만 고칩니다.
- 받은 내용이 원장 형식이 아니거나 너무 짧으면 덮어쓰지 않습니다.
- **덮어쓴 문서는 생성물입니다.** 드라이브에서 직접 고치면 다음 동기화에 사라집니다.

## 2. 드라이브 → 저장소 (제출 이력)

자기소개서 본문은 저장소에 넣지 않습니다. 어떤 경험과 수치를 썼는지만
`content/applications/index.json`에 남깁니다. 회사명도 넣지 않습니다
(이유는 `content/applications/README.md`).

Claude(Cowork 또는 Claude Code)에 아래를 주고 주 1회 실행하면 됩니다.

```
저장소 kjw413/career-portfolio-web 의 content/ledger/ 와 content/applications/index.json 을 읽는다.
구글드라이브 폴더 "2026 상반기", "2026 하반기", "합격자소서"를 스캔해
index.json 에 없는 자기소개서 파일을 찾는다.

새 파일마다:
  1. txt가 함께 있으면 txt를, 없으면 hwpx에서 텍스트를 뽑는다
     (scripts/drive/hwpx-to-text.py).
  2. 파일명에서 직무군을 추정한다. 반드시 selection-guide.json 의 job 이름 중에서 고른다.
  3. node scripts/claim-lint.mjs --file <텍스트> --job "<직무군>" --date <제출일> 을 돌린다.
  4. index.json 에 항목을 추가한다. 회사명·직무명·본문은 넣지 않고,
     시즌·직무군·제출일·드라이브 파일 ID·문항별 사용 카드·검사 결과만 넣는다.

PR 본문에는 검사 보고서와 "확인 필요" 목록만 넣는다. 자기소개서 본문은 절대 넣지 않는다.
원장과 어긋나는 사실이 자기소개서에 있으면 원장을 고치지 말고
content/ledger/open-questions.json 에 질문을 추가해 사용자에게 묻는다.
```

## 3. hwpx 텍스트 추출

```bash
python3 scripts/drive/hwpx-to-text.py 자소서.hwpx > 자소서.txt
python3 scripts/drive/hwpx-to-text.py 자소서.hwpx | node scripts/claim-lint.mjs --job "제조 AI·데이터"
```

표준 라이브러리만 씁니다. 문항과 답변이 이어지는 자기소개서에는 충분하지만, 표가 많은
이력서에서는 칸 순서가 읽는 순서와 달라질 수 있습니다. **드라이브에는 hwpx 옆에 txt를
함께 두는 것을 규칙으로 합니다.**

## 4. 개인정보 부록 (수동)

생년월일·주소·휴대전화·비상연락처·자격증 및 어학 등록번호는 저장소에 두지 않습니다.
지원서 양식을 채울 때 필요하면 드라이브에 `지원서_비공개정보_김종우.md` 같은 문서를
따로 만들어 두고 거기서 읽습니다. 이 문서는 자동 동기화 대상이 아닙니다.
