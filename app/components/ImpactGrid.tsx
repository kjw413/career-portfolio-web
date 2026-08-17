import Link from "next/link";
import type { Impact } from "../../lib/content";

export default function ImpactGrid({ impacts }: { impacts: Impact[] }) {
  return (
    <div className="impact-grid">
      {impacts.map((impact, index) => (
        <article className="impact-card" key={impact.id}>
          <div className="impact-card-top">
            <span>{String(index + 1).padStart(2, "0")}</span>
          </div>
          <div className="impact-result">
            <span>결과</span>
            <strong>{impact.result}</strong>
          </div>
          <h3>{impact.title}</h3>
          <dl className="impact-details">
            <div>
              <dt>문제</dt>
              <dd>{impact.problem}</dd>
            </div>
            <div>
              <dt>수행</dt>
              <dd>{impact.action}</dd>
            </div>
          </dl>
          {impact.projectSlug && (
            <Link className="impact-link" href={`/projects/${impact.projectSlug}/`}>
              프로젝트 보기 <span aria-hidden="true">→</span>
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}
