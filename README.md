# 김종우 커리어 포트폴리오

현장의 문제를 데이터와 시스템으로 해결하는 엔지니어 김종우의 포트폴리오 웹사이트입니다.

**배포 주소:** <https://kjw413.github.io/career-portfolio-web/>

## 기술 스택

- [Next.js 16](https://nextjs.org/) — App Router + 정적 내보내기(`output: "export"`)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [GitHub Pages](https://pages.github.com/) + GitHub Actions 자동 배포

서버·데이터베이스 없이 순수 정적 파일로 빌드되므로 무료로 호스팅됩니다.

## 로컬 개발

```bash
npm install     # 의존성 설치 (최초 1회)
npm run dev     # 개발 서버 실행 → http://localhost:3000
```

콘텐츠는 대부분 `app/page.tsx`의 데이터 배열(`featured`, `experience`, `archive` 등)에
있으므로, 해당 배열만 수정하면 사이트 내용이 갱신됩니다. 스타일은 `app/globals.css`에 있습니다.

정적 빌드 결과를 확인하려면:

```bash
npm run build   # out/ 디렉터리에 정적 사이트 생성
npx serve out   # 로컬에서 빌드 결과 미리보기
```

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
