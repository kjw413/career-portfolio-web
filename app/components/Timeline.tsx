import Link from "next/link";
import type { TimelineEntry } from "../../lib/ledger";

const KIND_LABEL: Record<string, string> = {
  career: "경력",
  education: "교육",
  university: "학부",
  military: "병역",
};

/**
 * 경력·교육 연혁. 각 시기 아래의 항목은 전부 경험 카드에서 만들어지고,
 * 항목을 누르면 그 수치의 산출 조건과 확인 근거가 있는 카드로 갑니다.
 *
 * 펼침은 `<details>`로 둡니다. 자바스크립트 없이도 키보드로 열고 닫을 수 있고,
 * 브라우저 찾기(Ctrl+F)가 닫힌 내용까지 찾아 줍니다.
 */
export default function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="timeline">
      {entries.map((entry) => (
        <li className="timeline-entry" key={entry.id} data-kind={entry.kind}>
          <div className="timeline-rail" aria-hidden="true">
            <span className="timeline-dot" />
          </div>

          <div className="timeline-body">
            <p className="timeline-period">
              <span className="timeline-kind">{KIND_LABEL[entry.kind] ?? entry.kind}</span>
              {entry.period}
            </p>
            <h3>
              {entry.organization}
              <small>{entry.role}</small>
            </h3>
            <p className="timeline-summary">{entry.summary}</p>

            {entry.items.length > 0 && (
              <details className="timeline-detail">
                <summary>
                  한 일 {entry.items.length}건
                  <span aria-hidden="true" className="timeline-caret" />
                </summary>

                <ul className="timeline-items">
                  {entry.items.map((item) => (
                    <li key={item.cardId}>
                      <Link href={`/experience/${item.cardId}/`}>
                        <span className="timeline-item-title">
                          {item.title}
                          {item.status !== "확정" && (
                            <span className="status-chip">{item.status}</span>
                          )}
                        </span>
                        <span className="timeline-item-headline">{item.headline}</span>
                      </Link>
                      {item.highlights.length > 0 && (
                        <ul className="timeline-highlights">
                          {item.highlights.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="tag-row">
                  {entry.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </details>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
