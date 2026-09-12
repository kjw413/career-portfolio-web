import type { Metadata } from "next";
import Link from "next/link";
import { fillMetrics, getAffiliations, getPublicCards } from "../../lib/ledger";

export const metadata: Metadata = {
  title: "경험 카드 — 김종우 포트폴리오",
  description:
    "소속별로 정리한 경험 카드입니다. 각 카드는 수행 내용과 수치, 그 수치의 산출 조건과 근거를 함께 담고 있습니다.",
};

export default function ExperienceIndex() {
  const cards = getPublicCards();
  const affiliations = getAffiliations().filter((affiliation) =>
    cards.some((card) => card.affiliation === affiliation.id),
  );

  return (
    <main className="project-page">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="홈으로">
          <span>KJ</span>김종우
        </Link>
        <nav aria-label="주요 메뉴">
          <Link href="/#impact">주요 성과</Link>
          <Link href="/#projects">프로젝트</Link>
          <Link href="/#profile">보유 기술</Link>
          <a href="https://github.com/kjw413" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </nav>
      </header>

      <article className="project-detail">
        <Link className="back-link" href="/">
          ← 홈
        </Link>
        <p className="detail-eyebrow">경험 카드</p>
        <h1>무엇을, 어디서, 어떤 근거로 했는지</h1>
        <p className="detail-intro">
          경험 하나가 카드 하나입니다. 각 카드에는 수행 내용과 함께 수치의 산출 조건, 확인 근거,
          아직 확정되지 않은 항목이 적혀 있습니다. 지원서와 이 사이트가 서로 어긋나지 않도록
          같은 원장에서 생성합니다.
        </p>

        {affiliations.map((affiliation) => (
          <section key={affiliation.id} className="experience-group">
            <h2>
              {affiliation.organization}
              <small>{affiliation.role}</small>
            </h2>
            <ul className="experience-card-list">
              {cards
                .filter((card) => card.affiliation === affiliation.id)
                .map((card) => (
                  <li key={card.id}>
                    <Link href={`/experience/${card.id}/`}>
                      <span className="experience-card-title">
                        {card.title}
                        {card.status !== "확정" && (
                          <span className="status-chip">{card.status}</span>
                        )}
                      </span>
                      <span className="experience-card-headline">
                        {fillMetrics(card.headline)}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </article>

      <footer>
        <div className="footer-bottom">
          <span>© 2026 김종우</span>
          <Link href="/">홈으로 ↑</Link>
        </div>
      </footer>
    </main>
  );
}
