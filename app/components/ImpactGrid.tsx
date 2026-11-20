import Link from "next/link";
import type { Impact } from "../../lib/content";

export default function ImpactGrid({ impacts }: { impacts: Impact[] }) {
  return (
    // 카드 수에 맞춰 열을 정합니다(3장은 3열, 4장은 2×2). 마지막 줄에 카드 하나만 남지 않게 합니다.
    <div className="impact-grid" data-count={impacts.length}>
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
