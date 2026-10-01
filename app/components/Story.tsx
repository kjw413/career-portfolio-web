import Link from "next/link";

/**
 * 첫 화면 제목의 세 동사를 차례로 풀어 쓰는 단계 설명입니다. 글이 화면 가운데에 오면
 * 뒤의 3D 장면이 같은 단계를 비춥니다(사업장 → 검증 게이트 → 예측 패널).
 *
 * 문구는 프로젝트 사례(ai-elite-mis-rpa, ai-elite-bems)에 이미 적힌 사실만 옮깁니다.
 * 수치는 첫 화면과 주요 성과에 있으므로 여기서 되풀이하지 않습니다.
 * 예측은 원장의 정본 표현대로 "보조지표"로만 씁니다.
 */

type Step = {
  id: string;
  number: string;
  kicker: string;
  verb: string;
  title: string;
  body: string;
  chips: string[];
  href: string;
  linkLabel: string;
};

function steps(plants: string[]): Step[] {
  return [
    {
      id: "collect",
      number: "01",
      kicker: "COLLECT",
      verb: "모으고",
      title: "다섯 공장의 데이터를 매일 모읍니다",
      body:
        "전력·연료·용수와 생산실적이 공장마다 따로 쌓입니다. API가 없는 사내 MIS 화면에서 5개 공장의 생산실적·유틸리티·재공품 데이터를 수집합니다.",
      chips: plants,
      href: "/projects/ai-elite-mis-rpa/",
      linkLabel: "MIS 데이터 수집 자동화",
    },
    {
      id: "automate",
      number: "02",
      kicker: "AUTOMATE",
      verb: "자동화하고",
      title: "수집 · 검증 · 표준화를 하나의 파이프라인으로",
      body:
        "화면 수집과 엑셀 재가공을 두 단계로 나누고, 공장별 그리드 지문을 비교해 다른 공장 데이터가 섞이면 적재를 멈춥니다. 웹앱은 공유 폴더의 표준 데이터셋만 읽습니다.",
      chips: ["수집 → 가공 2단계", "그리드 지문 검사", "--dry-run 미리보기", "실행 전 자동 백업"],
      href: "/experience/EXP-BG-DATA-RPA/",
      linkLabel: "수집 자동화 경험 카드",
    },
    {
      id: "predict",
      number: "03",
      kicker: "PREDICT",
      verb: "예측합니다",
      title: "사용량을 예측하고 실측과 나란히 봅니다",
      body:
        "전력·연료·용수 사용량을 값 하나가 아니라 P05~P95 구간으로 예측합니다. 예측치는 실적과 함께 살펴보며 추가 확인을 위한 보조지표로 씁니다.",
      chips: ["LightGBM · XGBoost · CatBoost", "구간 예측 P05~P95", "MySQL · FastAPI · Next.js"],
      href: "/projects/ai-elite-bems/",
      linkLabel: "공장 에너지 AI 플랫폼",
    },
  ];
}

export default function Story({ plants }: { plants: string[] }) {
  return (
    <section className="story" aria-labelledby="story-heading">
      <h2 id="story-heading" className="visually-hidden">
        하는 일 — 모으고, 자동화하고, 예측합니다
      </h2>
      {steps(plants).map((step) => (
        <article className="story-step" id={`story-${step.id}`} key={step.id}>
          <div className="story-card">
            <p className="story-index">
              <span>{step.number}</span>
              {step.kicker}
            </p>
            <p className="story-verb">{step.verb}</p>
            <h3>{step.title}</h3>
            <p className="story-body">{step.body}</p>
            <ul className="story-chips">
              {step.chips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
            <Link className="story-link" href={step.href}>
              {step.linkLabel} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
