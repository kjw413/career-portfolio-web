/**
 * 구글드라이브의 마스터 이력 문서를 저장소에서 생성된 원장으로 덮어씁니다.
 *
 * 이 스크립트는 구글드라이브(Apps Script) 안에서 돌고, 공개 URL을 읽어 파일 하나를
 * 갱신합니다. GitHub 토큰이나 서비스 계정 키가 필요 없고, 저장소에 비밀이 남지 않습니다.
 *
 * ── 설치 (한 번만) ──────────────────────────────────────────────
 * 1. script.google.com 에서 새 프로젝트를 만들고 이 파일 내용을 붙여 넣습니다.
 * 2. TARGET_FILE_ID 를 덮어쓸 드라이브 파일의 ID로 바꿉니다.
 *    (드라이브에서 파일 열기 → 주소창의 /d/ 와 /view 사이 문자열)
 * 3. syncLedger 를 한 번 실행해 권한을 허용합니다.
 * 4. 왼쪽 "트리거" → 트리거 추가 → syncLedger / 시간 기반 / 일 단위.
 *
 * ── 주의 ───────────────────────────────────────────────────────
 * 덮어쓴 파일은 생성물입니다. 드라이브에서 직접 고치면 다음 동기화 때 사라집니다.
 * 사실을 고칠 곳은 저장소의 content/ledger/ 입니다.
 * 생년월일·주소·연락처·등록번호는 이 문서에 들어 있지 않습니다. 지원서 입력에 필요하면
 * 별도의 비공개 부록 문서를 따로 두고 씁니다.
 */

const SOURCE_URL = "https://kjw413.github.io/career-portfolio-web/ai/ledger.md";

/*
 * 지금 값은 드라이브의 `지원서_마스터이력_김종우_v1.2.md` 입니다.
 *
 * 이 ID로 두면 첫 실행에서 그 문서의 내용이 저장소에서 생성된 원장으로 바뀝니다.
 * v1.2의 내용은 이미 content/ledger/ 로 옮겨져 있으므로 사라지는 사실은 없고,
 * 드라이브의 버전 기록(파일 우클릭 → 버전 기록)으로 언제든 되돌릴 수 있습니다.
 *
 * 원본을 그대로 두고 싶으면, 드라이브에 빈 문서를 하나 만들고 그 ID를 여기 넣으세요.
 * 파일 ID는 문서를 열었을 때 주소창의 /d/ 와 /view 사이 문자열입니다.
 */
const TARGET_FILE_ID = "1G258F_3-ERP_1YHzIacxvrKLKplJl4jC";

function syncLedger() {
  const response = UrlFetchApp.fetch(SOURCE_URL, { muteHttpExceptions: true });
  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error("원장을 받지 못했습니다. HTTP " + code);
  }

  const body = response.getContentText("UTF-8");
  // 배포가 반쯤 끝난 순간에 깨진 파일로 덮어쓰지 않도록 최소한의 형태를 확인합니다.
  if (body.indexOf("document_type: application_master_profile") === -1) {
    throw new Error("받은 내용이 원장 형식이 아닙니다. 덮어쓰지 않았습니다.");
  }
  if (body.length < 5000) {
    throw new Error("받은 내용이 너무 짧습니다(" + body.length + "자). 덮어쓰지 않았습니다.");
  }

  const file = DriveApp.getFileById(TARGET_FILE_ID);
  const current = file.getBlob().getDataAsString("UTF-8");
  if (current === body) {
    console.log("변경 없음");
    return;
  }

  file.setContent(body);
  console.log("갱신함: " + body.length + "자");
}
