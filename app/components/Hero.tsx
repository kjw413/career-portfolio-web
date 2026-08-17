import type { Profile } from "../../lib/content";
import { withBasePath } from "../../lib/projects";

export default function Hero({ profile }: { profile: Profile }) {
  return (
    <section className="profile-hero" id="top">
      <div className="profile-panel">
        {profile.photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="profile-photo"
            src={withBasePath(profile.photoSrc)}
            alt={`${profile.name} 비즈니스 프로필 사진`}
          />
        ) : (
          <div className="profile-placeholder" aria-label="프로필 사진 준비 중">
            KJ
          </div>
        )}
        <p className="profile-name">{profile.name}</p>
        <p>{profile.major}</p>
      </div>
      <div className="hero-content">
        <p className="eyebrow">MANUFACTURING · DATA/AI · EMBEDDED SYSTEM</p>
        <h1>{profile.role}</h1>
        <p className="hero-description">{profile.summary}</p>
        <div className={`hero-actions${profile.resumeHref ? " has-resume" : ""}`}>
          <a className="button primary" href="#projects">
            대표 프로젝트
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
            <div key={metric.id} title={metric.evidence}>
              <dt>{metric.value}</dt>
              <dd>{metric.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
