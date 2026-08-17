# 김종우 커리어 포트폴리오

현장의 문제를 데이터와 시스템으로 해결하는 엔지니어 김종우의 포트폴리오 웹사이트입니다.

**배포 주소:** <https://kjw413.github.io/career-portfolio-web/>

## 기술 스택

- [Next.js 16](https://nextjs.org/) — App Router + 정적 내보내기(`output: "export"`)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [GitHub Pages](https://pages.github.com/) + GitHub Actions 자동 배포

서버·데이터베이스 없이 순수 정적 파일로 빌드되므로 무료로 호스팅됩니다.

## 프로젝트 추가·수정 방법 (코드 수정 불필요)

프로젝트의 공개 제목·분류·대표 노출 순서·아카이브 순서는
`content/project-overrides.json`에서 우선 관리합니다. 수행 과정과 성과 같은 상세
사례는 `content/projects/` 폴더의 **마크다운 파일**에서 관리합니다. 파일 하나 =
상세 프로젝트 하나이며, 파일을 수정하고 `main`에 커밋하면 2~3분 내 사이트에 자동
반영됩니다. 로컬 환경 없이 **GitHub 웹사이트에서 바로** 편집할 수 있습니다.

### 기존 프로젝트 내용 수정 (진행 상황 업데이트)

1. GitHub에서 `content/projects/` 폴더의 해당 `.md` 파일 열기
2. 연필 아이콘(Edit this file) 클릭
3. 본문(수행 과정·성과)이나 상세 사례용 상단 필드 수정 후 **Commit changes** (main 브랜치에 커밋)
4. Actions 탭에서 배포가 끝나면(2~3분) 사이트에 반영됨

공개 제목·분류·대표 노출 순서·아카이브 순서를 바꾸려면 같은 `repoName`을 가진
`content/project-overrides.json` 항목을 수정합니다.

### 새 프로젝트 추가

1. `content/projects/_TEMPLATE.md`를 열어 내용 복사
2. `content/projects/` 폴더에서 **Add file → Create new file**
3. 파일명은 `영문-소문자-하이픈.md` 형식 (예: `smart-factory-dashboard.md`) —
   파일명이 상세 페이지 주소가 됩니다
4. 템플릿의 필드와 본문을 채우고, 필요하면 같은 `repoName`의 항목을
   `content/project-overrides.json`에 추가한 뒤 커밋

### 주요 필드

| 필드 | 설명 |
| --- | --- |
| `title` | 상세 페이지 제목. override 제목이 없을 때 카탈로그 표시 제목으로도 사용 |
| `repoName` | GitHub·override·마크다운을 연결하는 저장소명 키 |
| `category` | override 분류가 없을 때 사용하는 상세 사례의 기본 분류 |
| `summary` | 아카이브 목록의 한 줄 설명 (필수) |
| `status` | `ongoing`(진행 중 — IN PROGRESS 배지 표시) 또는 `completed` |
| `featured` | override에 순위가 없을 때 사용하는 대표 프로젝트 노출 순서 |
| `order` | override에 순서가 없을 때 사용하는 아카이브 정렬 순서 |

`project-overrides.json`의 `title`, `category`, `featured`, `order`가 Markdown
frontmatter와 GitHub 메타데이터보다 우선합니다. 대표 프로젝트는 이 병합 카탈로그의
`featured` 순서로 고른 뒤, 같은 `repoName`의 Markdown 상세 사례와 연결합니다. 따라서
대표 카드에는 Markdown 본문과 소개가 있는 프로젝트만 노출됩니다. Markdown
frontmatter의 같은 필드는 override가 없을 때의 fallback입니다.

`---` 아래 본문은 자유로운 마크다운입니다 (`## 개요`, `## 수행 과정`, `## 성과` 등).
현장 개선 과제와 경력 상세는 `content/experience.json`의 해당 경험 항목에서 수정합니다.

## 포트폴리오 내용 수정

- 사진: `public/profile.webp` 추가 후 `content/profile.json`의 `photoSrc`를 `/profile.webp`로 설정
- 이력서: `public/resume.pdf` 추가 후 `resumeHref`를 `/resume.pdf`로 설정
- 경력·교육: `content/experience.json` 수정
- 대표 성과: `content/profile.json`의 `metrics`, `impacts` 수정
- 프로젝트 공개 제목·분류·대표 노출·아카이브 순서: `content/project-overrides.json` 수정
- 상세 사례: `content/projects/*.md` 수정
- GitHub 기본 정보: 저장소 설명·Topics 수정 후 Actions의 예약 실행 또는 수동 실행

GitHub Pages는 정적 호스팅이므로 GitHub 기본 정보는 빌드 시 생성된 정적 파일에
반영됩니다. GitHub 토큰은 Actions 실행 중에만 사용되며, GitHub API 호출에 실패하면
마지막으로 유효한 캐시를 사용합니다.

### 스크린샷·GIF 추가

`public/projects/` 폴더에 이미지를 올리고 `cover` / `gallery` 필드로 연결하면
카드 썸네일과 상세 페이지에 표시됩니다. 작성법과 권장 사양, **회사 데이터 노출
주의사항**은 [`public/projects/README.md`](public/projects/README.md)에 정리했습니다.

## 로컬 개발

```bash
npm install     # 의존성 설치 (최초 1회)
npm run dev     # 개발 서버 실행 → http://localhost:3000
```

사이트 구조·스타일을 바꾸려면: 페이지 골격은 `app/page.tsx`(경력·역량 섹션 포함),
프로젝트 상세 페이지는 `app/projects/[slug]/page.tsx`, 스타일은 `app/globals.css`.

정적 빌드 결과를 확인하려면:

```bash
npm run build   # out/ 디렉터리에 정적 사이트 생성
npx serve out   # 로컬에서 빌드 결과 미리보기
```

## 최종 검증 기록 (2026-08-17)

브라우저 엔진이 설치되지 않은 격리 실행 환경에서 검증했습니다. `npm run dev`는
샌드박스의 네트워크 인터페이스 조회 제한(`uv_interface_addresses`) 때문에 로컬
서버를 열지 못했습니다. 따라서 base path를 적용한 production export의 HTML과
PostCSS로 파싱한 반응형 규칙을 함께 검사하고, 고정 폭 요소의 너비 예산을 각
viewport에서 계산했습니다. 실제 브라우저의 픽셀 렌더링과 GitHub Pages 배포 확인은
push 이후에 별도로 확인해야 합니다.

| 너비 | 정적 layout 검증 결과 |
| --- | --- |
| 360px | 수평 넘침 방지 규칙 통과, 프로필 4:5, CTA grid와 `min-width: 0`, 성과 지표 2열, 경험 토글 독립 열, 아카이브 stacked card 확인 |
| 768px | CTA 최대 3개 너비 `588px ≤ 660px`, 성과 지표 2열, 경험 토글 `auto` 열, 아카이브 row와 고정 폭 예산 `128px < 691px` 확인 |
| 1440px | CTA 최대 3개 너비 `588px ≤ 720px`, 성과 지표 4열, 경험 토글 `auto` 열, 아카이브 고정 폭 예산 `280px < 1296px` 확인 |

모바일 header의 IMPACT, PROJECTS, EXPERIENCE, CONTACT 링크 4개가 모두 생성되고
문서상 마지막 링크만 남기던 CSS가 제거된 것도 확인했습니다. `Field Evidence`
하위 섹션은 Task 5에서 제거되어 이전 heading-depth 지적은 현재 구조에 적용되지
않습니다.

실행 결과:

```text
HOME=/tmp NPM_CONFIG_CACHE=/tmp/npm-cache npm test
PASS — 6 files, 18 tests

HOME=/tmp NPM_CONFIG_CACHE=/tmp/npm-cache npm run lint
PASS — ESLint errors 0

HOME=/tmp NPM_CONFIG_CACHE=/tmp/npm-cache NEXT_PUBLIC_BASE_PATH=/career-portfolio-web npm run build
PASS — Next.js static export, 12 pages generated
```

export 산출물에서 `/career-portfolio-web/` 홈, 내부 상세 경로
`/career-portfolio-web/projects/ai-elite-bems/`, GitHub-only 아카이브 링크
`https://github.com/kjw413/career-portfolio-web`를 검사했습니다. 내부 project 링크
14개와 root-relative asset URL 전부가 `/career-portfolio-web/` prefix를 유지했습니다.

## 배포 (GitHub Pages)

`main` 브랜치에 푸시하면 `.github/workflows/deploy.yml` 워크플로가 자동으로
빌드하고 GitHub Pages에 배포합니다. 별도의 서버나 유료 구독이 필요 없습니다.

### 최초 1회 설정

워크플로가 Pages를 자동 활성화하지만, 만약 배포가 실패하면 저장소에서 한 번만
수동 설정해 주세요:

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → **Source**를 **GitHub Actions**로 선택

이후에는 `main`에 푸시할 때마다 자동 배포되며, **Actions** 탭에서 진행 상황을
확인할 수 있습니다. 수동 배포는 Actions 탭에서 "Deploy to GitHub Pages" 워크플로의
**Run workflow** 버튼으로 실행합니다.

### 커스텀 도메인 (선택)

개인 도메인을 연결하려면 Settings → Pages → **Custom domain**에 도메인을 입력하고,
`next.config.ts`의 `basePath` 환경 변수 주입(워크플로의 `NEXT_PUBLIC_BASE_PATH`)을
제거하면 됩니다. 도메인 없이도 위의 `github.io` 주소로 충분히 사용할 수 있습니다.

## OpenAI Sites에서 마이그레이션한 내역

이 프로젝트는 원래 ChatGPT의 사이트 제작 기능(OpenAI Sites)으로 만들어져
vinext + Cloudflare Workers 기반 전용 스택 위에서 동작했습니다. 구독 없이도
자유롭게 수정·배포할 수 있도록 표준 Next.js 정적 사이트로 전환했습니다.

제거된 것들:

- `.openai/hosting.json`, `worker/`, `build/sites-vite-plugin.ts` — OpenAI Sites/Cloudflare 전용 배포 구성
- `vite.config.ts`, `vinext`, `wrangler` — vinext 빌드 체인 (표준 `next build`로 대체)
- `app/chatgpt-auth.ts` — ChatGPT 로그인 헬퍼 (사이트가 사용하지 않음)
- `db/`, `drizzle/`, `examples/` — D1 데이터베이스 예제 (사이트가 사용하지 않음)
- `scripts/` — Sites 전용 설치·빌드·검증 스크립트

사이트 화면과 콘텐츠(`app/page.tsx`, `app/globals.css`)는 그대로 유지되었습니다.

## 다른 무료 호스팅 대안

GitHub Pages 대신 아래 서비스에서도 무료로 배포할 수 있습니다. 모두 이 저장소를
연결하면 자동 인식됩니다 (`NEXT_PUBLIC_BASE_PATH` 없이 빌드).

- [Vercel](https://vercel.com/) — Next.js 제작사, 저장소 연결만으로 배포
- [Netlify](https://www.netlify.com/) — 빌드 명령 `npm run build`, 배포 디렉터리 `out`
- [Cloudflare Pages](https://pages.cloudflare.com/) — 빌드 명령 `npm run build`, 출력 디렉터리 `out`
