import type { Profile } from "../../lib/content";
import { withBasePath } from "../../lib/projects";
import { formatCareerPeriod } from "../../lib/tenure";

export default function Hero({ profile }: { profile: Profile }) {
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
        <dl className="hero-metrics">
          {profile.metrics.map((metric) => (
            <div key={metric.id}>
              <dt>{metric.value}</dt>
              <dd>{metric.label}</dd>
              <dd className="metric-evidence">{metric.evidence}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
