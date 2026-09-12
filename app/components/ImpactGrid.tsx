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
          {/* 결과를 먼저 크게, 그다음 무엇이 문제였고 무엇을 했는지를 한 문단으로 잇습니다. 라벨은 달지 않습니다. */}
          <p className="impact-result">
            <strong>{impact.result}</strong>
          </p>
          <h3>{impact.title}</h3>
          <p className="impact-story">
            {impact.problem} {impact.action}
          </p>
          {(impact.cardId || impact.projectSlug) && (
            <Link
              className="impact-link"
              href={
                impact.cardId
                  ? `/experience/${impact.cardId}/`
                  : `/projects/${impact.projectSlug}/`
              }
            >
              자세히 보기{" "}
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}
