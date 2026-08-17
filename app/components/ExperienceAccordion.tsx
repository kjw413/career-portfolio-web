import type { Experience } from "../../lib/content";

export default function ExperienceAccordion({ items }: { items: Experience[] }) {
  return (
    <div className="experience-list">
      {items.map((item) => (
        <details className="experience-card" key={item.id}>
          <summary>
            <span className="experience-period">{item.period}</span>
            <span className="experience-role">
              <small>{item.organization}</small>
              <strong>{item.role}</strong>
            </span>
            <span className="experience-summary">{item.summary}</span>
            <span className="experience-toggle">상세 보기</span>
          </summary>
          <div className="experience-detail">
            <ul>{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
            <div className="tag-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
        </details>
      ))}
    </div>
  );
}
