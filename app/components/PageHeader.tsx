import Link from "next/link";

/**
 * 하위 페이지(프로젝트 사례 · 경험 카드)의 머리글.
 *
 * 홈 머리글과 같은 메뉴를 같은 순서로 둡니다. 페이지마다 메뉴가 다르면 방문자가 지금
 * 어디에 있고 어디로 갈 수 있는지를 페이지를 옮길 때마다 새로 읽어야 합니다.
 * 지금 보고 있는 갈래(프로젝트 · 경험 카드)는 aria-current로 표시합니다.
 */
type Section = "projects" | "experience";

const ITEMS: { href: string; label: string; section?: Section }[] = [
  { href: "/#impact", label: "주요 성과" },
  { href: "/#projects", label: "프로젝트", section: "projects" },
  { href: "/#experience", label: "경력" },
  { href: "/experience/", label: "경험 카드", section: "experience" },
  { href: "/#contact", label: "연락처" },
];

export default function PageHeader({ current }: { current?: Section }) {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="홈으로">
        <span>KJ</span>김종우
      </Link>
      <nav aria-label="주요 메뉴">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.section && item.section === current ? "true" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
