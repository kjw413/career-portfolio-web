import type { PortfolioData, PortfolioModule } from "../../lib/portfolio";
import { withRef, type Level, type SectionKey, type Selection } from "../../lib/portfolio-selection";
import { formatCareerPeriod } from "../../lib/tenure";

/**
 * 고른 구성으로 조립한 A4 문서. 화면에서는 미리보기이고, 인쇄하면 그대로 PDF가 됩니다.
 *
 * 문장과 수치를 여기서 새로 쓰지 않습니다. 전부 원장에서 온 모듈을 순서대로 놓을 뿐입니다.
 *   - 수치는 값만 두지 않고 산출 조건을 함께 싣습니다(사이트와 같은 규칙).
 *   - 팀 작업은 요약으로 실어도 본인 범위를 함께 싣습니다.
 *   - 재직기간은 고정 문구가 아니라 기준일로 다시 계산합니다.
 */

const KIND_LABEL: Record<string, string> = { career: "경력", education: "교육" };

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function Item({
  entry,
  level,
  index,
  siteUrl,
  refCode,
  showCover,
}: {
  entry: PortfolioModule;
  level: Level;
  index: number;
  siteUrl: string;
  refCode: string;
  showCover: boolean;
}) {
  // 요약에는 근거 링크 하나만, 상세에는 연결된 사례까지 싣습니다.
  const links = level === "detail" ? entry.links : entry.links.slice(0, 1);
  // 추적 코드는 이 사이트로 가는 링크에만 붙입니다. GitHub 같은 바깥 링크에는 뜻이 없습니다.
  const withinSite = (href: string) => href.startsWith(siteUrl);

  return (
    <section className="pf-item" data-kind={entry.kind} data-level={level} data-module={entry.id}>
      {/* 제목부터 한 일 목록까지는 한 덩어리로 넘깁니다. 제목만 쪽 끝에 남지 않게. */}
      <div className="pf-item-lead">
        <div className="pf-item-head">
          <span className="pf-no">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>
              {entry.title}
              {entry.ongoing && <span className="pf-chip">진행 중</span>}
            </h3>
            <p className="pf-meta">{[entry.group, entry.role].filter(Boolean).join(" · ")}</p>
          </div>
          {entry.period && <p className="pf-period">{entry.period}</p>}
        </div>

        <p className="pf-headline">{entry.headline}</p>

        {/* 경험 카드의 태그는 분류용이라 싣지 않고, 프로젝트 사례의 기술 스택만 싣습니다. */}
        {entry.kind === "project" && entry.tags.length > 0 && (
          <p className="pf-tags">{entry.tags.join(" · ")}</p>
        )}

        {entry.highlights.length > 0 && (
          <ul className="pf-points">
            {entry.highlights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      {entry.metrics.length > 0 && (
        <table className="pf-item-metrics">
          <tbody>
            {entry.metrics.map((metric) => (
              <tr key={metric.id}>
                <th scope="row">{metric.display}</th>
                <td>{metric.label}</td>
                <td className="pf-condition">{metric.condition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {entry.teamContext && (
        <p className="pf-team">
          <strong>팀 작업 범위</strong> {entry.teamContext}
        </p>
      )}

      {level === "detail" && (
        <>
          {entry.bodyHtml && (
            <div className="pf-body" dangerouslySetInnerHTML={{ __html: entry.bodyHtml }} />
          )}
          {/* 그림은 글 뒤에 둡니다. 앞에 두면 쪽에 안 들어갈 때 글 사이에 큰 빈칸이 생깁니다. */}
          {showCover && entry.cover && (
            <figure className="pf-cover">
              {/* 인쇄할 때 빠지지 않도록 지연 로딩을 쓰지 않습니다. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.cover.src} alt="" />
              {entry.cover.caption && <figcaption>{entry.cover.caption}</figcaption>}
            </figure>
          )}
        </>
      )}

      {links.length > 0 && (
        <p className="pf-links">
          {links.map((link) => (
            <a key={link.href} href={withinSite(link.href) ? withRef(link.href, refCode) : link.href}>
              {link.label} ↗
            </a>
          ))}
        </p>
      )}
    </section>
  );
}

export default function PortfolioDocument({
  data,
  selection,
  contact,
  asOf,
}: {
  data: PortfolioData;
  selection: Selection;
  /** 저장소에 없는 연락처(전화번호 등). 이 문서에만 들어갑니다. */
  contact: string;
  /** 재직기간과 문서 날짜의 기준일 */
  asOf: Date;
}) {
  const shown = (key: SectionKey) => !selection.hidden.includes(key);
  const byId = new Map(data.modules.map((entry) => [entry.id, entry]));
  const items = selection.items.flatMap((item) => {
    const entry = byId.get(item.id);
    return entry ? [{ entry, level: item.level }] : [];
  });

  // 첫머리의 수치는 고른 경험이 만든 것만 남깁니다. 싣지 않은 경험의 수치가 홀로 남지 않게.
  const selectedIds = new Set(items.map((item) => item.entry.id));
  const metrics = data.headlineMetrics.filter((metric) =>
    metric.cardIds.some((id) => selectedIds.has(id)),
  );

  // 같은 사례를 가리키는 카드가 둘이면 대표 이미지는 먼저 나온 쪽에만 싣습니다.
  const seenCovers = new Set<string>();
  const coverShown = items.map(({ entry, level }) => {
    if (level !== "detail" || !entry.cover || seenCovers.has(entry.cover.src)) return false;
    seenCovers.add(entry.cover.src);
    return true;
  });

  const siteLink = withRef(`${data.siteUrl}/`, selection.ref);
  const stamp = `${asOf.getFullYear()}.${String(asOf.getMonth() + 1).padStart(2, "0")}.${String(
    asOf.getDate(),
  ).padStart(2, "0")}`;

  return (
    <article className="pf-doc" lang="ko">
      <div className="pf-head">
        <div>
          <h1>
            {data.person.name}
            <span>{data.person.nameEn}</span>
          </h1>
          <p className="pf-role">{data.role}</p>
        </div>
        <ul className="pf-contact">
          {contact && <li>{contact}</li>}
          {data.person.email && (
            <li>
              <a href={`mailto:${data.person.email}`}>{data.person.email}</a>
            </li>
          )}
          <li>
            <a href={data.person.githubUrl}>{stripScheme(data.person.githubUrl)}</a>
          </li>
          <li>
            <a href={siteLink}>{stripScheme(data.siteUrl)}</a>
          </li>
        </ul>
      </div>

      {shown("summary") && <p className="pf-summary">{data.summary}</p>}

      {shown("metrics") && metrics.length > 0 && (
        <dl className="pf-metrics">
          {metrics.map((metric) => (
            <div key={metric.id}>
              <dt>{metric.display}</dt>
              <dd>{metric.label}</dd>
              {metric.condition && <dd className="pf-condition">{metric.condition}</dd>}
            </div>
          ))}
        </dl>
      )}

      {shown("history") && data.history.length > 0 && (
        <section className="pf-basic">
          <h2 className="pf-h">경력 · 교육</h2>
          <table className="pf-table">
            <tbody>
              {data.history.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{KIND_LABEL[row.kind] ?? row.kind}</th>
                  <td className="pf-when">
                    {row.tenureFrom
                      ? formatCareerPeriod({ startDate: row.tenureFrom, endDate: null }, asOf)
                      : row.period}
                  </td>
                  <td>
                    <strong>{row.organization}</strong>
                    <span>{row.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {shown("qualifications") && data.qualifications.length > 0 && (
        <section className="pf-basic">
          <h2 className="pf-h">학력 · 자격 · 병역</h2>
          <table className="pf-table">
            <tbody>
              {data.qualifications.map((row) => (
                <tr key={`${row.label}-${row.title}`}>
                  <th scope="row">{row.label}</th>
                  <td colSpan={2}>
                    <strong>{row.title}</strong>
                    <span>{row.detail}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {shown("skills") && data.skills.length > 0 && (
        <section className="pf-basic">
          <h2 className="pf-h">보유 기술</h2>
          <table className="pf-table">
            <tbody>
              {data.skills.map((group) => (
                <tr key={group.title}>
                  <th scope="row">{group.title}</th>
                  <td colSpan={2}>{group.skills.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {items.length > 0 && (
        <section>
          <h2 className="pf-h">주요 경험</h2>
          {items.map(({ entry, level }, index) => (
            <Item
              key={entry.id}
              entry={entry}
              level={level}
              index={index}
              siteUrl={data.siteUrl}
              refCode={selection.ref}
              showCover={coverShown[index]}
            />
          ))}
        </section>
      )}

      <p className="pf-foot">
        수치의 산출 조건과 확인 근거, 전체 경험은 웹 포트폴리오에 있습니다 ·{" "}
        <a href={siteLink}>{stripScheme(data.siteUrl)}</a> · {stamp} 기준
      </p>
    </article>
  );
}
