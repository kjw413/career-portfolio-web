import Link from "next/link";
import type { Profile } from "../../lib/content";
import type { Metric } from "../../lib/ledger";
import { withBasePath } from "../../lib/projects";
import { formatCareerPeriod } from "../../lib/tenure";

export type HeadlineMetric = Metric & { id: string; cardId: string | null };

export default function Hero({
  profile,
  metrics,
}: {
  profile: Profile;
  metrics: HeadlineMetric[];
}) {
  const email = profile.emailHref?.replace(/^mailto:/, "") ?? null;
  const githubLabel = profile.githubUrl.replace(/^https?:\/\/(www\.)?/, "");
  const careerPeriod = formatCareerPeriod(profile.career, new Date());

  return (
    <section className="profile-hero" id="top">
      <aside className="profile-panel" aria-label="기본 이력">
        <div className="profile-identity">
          {profile.photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="profile-photo"
              src={withBasePath(profile.photoSrc)}
              alt={`${profile.name} 프로필 사진`}
            />
          ) : (
            <div className="profile-placeholder" aria-label="프로필 사진 준비 중">
              KJ
            </div>
          )}
          <div>
            <p className="profile-name">{profile.name}</p>
            <p className="profile-name-en">{profile.nameEn}</p>
          </div>
        </div>

        <dl className="profile-facts">
          <div>
            <dt>학력</dt>
            <dd>
              <strong>
                {profile.education.school} {profile.education.degree}
              </strong>
              <span>{profile.education.period}</span>
              <span>{profile.education.detail}</span>
            </dd>
          </div>
          <div>
            <dt>경력</dt>
            <dd>
              <strong>
                {profile.career.company} {profile.career.position}
              </strong>
              <span>{careerPeriod}</span>
              <span>{profile.career.detail}</span>
            </dd>
          </div>
          <div>
            <dt>자격 · 어학</dt>
            <dd className="profile-list">
              {profile.certifications.map((certification) => (
                <span key={certification}>{certification}</span>
              ))}
            </dd>
          </div>
          <div>
            <dt>연락처</dt>
            <dd className="profile-contact">
              {email && profile.emailHref && <a href={profile.emailHref}>{email}</a>}
              <a href={profile.githubUrl} target="_blank" rel="noreferrer">
                {githubLabel}
              </a>
            </dd>
          </div>
        </dl>
      </aside>

      <div className="hero-content">
        <p className="eyebrow">제조 데이터 · 업무 자동화 · 임베디드</p>
        <h1>{profile.role}</h1>
        <p className="hero-description">{profile.summary}</p>
        <div className={`hero-actions${profile.resumeHref ? " has-resume" : ""}`}>
          <a className="button primary" href="#projects">
            대표 프로젝트 보기
          </a>
          {profile.resumeHref && (
            <a className="button secondary" href={withBasePath(profile.resumeHref)}>
              이력서
            </a>
          )}
          <a
            className="button secondary"
            href={profile.githubUrl}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
        {/*
          수치는 값만 두지 않고 산출 조건을 함께 보여 줍니다. `7%`처럼 조건을 뗀 숫자가
          지원서로 옮겨 가면서 뜻이 달라지는 일을 막기 위한 것입니다.
          근거로 가는 길은 숫자 자체에 둡니다. "근거 보기" 같은 문구를 달면 감사 보고서처럼 읽힙니다.
        */}
        <dl className="hero-metrics">
          {metrics.map((metric) => (
            <div key={metric.id}>
              <dt>
                {metric.cardId ? (
                  <Link href={`/experience/${metric.cardId}/`} title="산출 근거와 경험 카드">
                    {metric.display}
                  </Link>
                ) : (
                  metric.display
                )}
              </dt>
              <dd>{metric.label}</dd>
              {metric.condition && <dd className="metric-evidence">{metric.condition}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
