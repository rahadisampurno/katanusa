import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router';
// @ts-expect-error - SVG import
import LogoKataNusa from '../svgs/logo-katanusa.svg?react';
import './auth.css';

export interface AuthStep {
  number: number;
  label: string;
  shortLabel?: string;
}

interface AuthShellProps {
  children: ReactNode;
  variant?: 'login' | 'signup' | 'verify';
  storyEyebrow: string;
  storyTitle: string;
  storyDescription: string;
  storyImage?: string;
  storyImageWebp?: string;
  topAction?: ReactNode;
  steps?: AuthStep[];
  currentStep?: number;
  wide?: boolean;
}

const transparentPixel =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

const AuthShell = ({
  children,
  variant = 'login',
  storyEyebrow,
  storyTitle,
  storyDescription,
  storyImage,
  storyImageWebp,
  topAction,
  steps = [],
  currentStep = 1,
  wide = false,
}: AuthShellProps) => {
  const safeStep = Math.min(Math.max(currentStep, 1), Math.max(steps.length, 1));
  const progress = steps.length > 0 ? (safeStep / steps.length) * 100 : 0;
  const activeLabel = steps.find((step) => step.number === safeStep)?.label;

  const defaultImage =
    variant === 'signup'
      ? '/assets/pakar-nyata/Sambutan-Nusantara-di-Senja-Tropis.webp'
      : '/assets/panorama-budaya-nusantara-fajar.webp';

  const defaultWebp =
    variant === 'signup'
      ? '/assets/pakar-nyata/Sambutan-Nusantara-di-Senja-Tropis.webp'
      : '/assets/panorama-budaya-nusantara-fajar.webp';

  const imageSrc = storyImage || defaultImage;
  const webpSrc = storyImageWebp || defaultWebp;

  return (
    <div className={`auth-experience auth-experience--${variant}`}>
      <div className="auth-shell">
        <aside className="auth-story" aria-label="Cerita KataNusa">
          <picture className="auth-story__art" aria-hidden="true">
            {webpSrc ? (
              <source media="(min-width: 900px)" type="image/webp" srcSet={webpSrc} />
            ) : null}
            <source media="(min-width: 900px)" srcSet={imageSrc} />
            <img src={imageSrc} alt="" />
          </picture>
          <div className="auth-story__wash" aria-hidden="true" />
          <span className="auth-ribbon auth-ribbon--red" aria-hidden="true" />
          <span className="auth-ribbon auth-ribbon--green" aria-hidden="true" />
          <span className="auth-cloud auth-cloud--one" aria-hidden="true" />
          <span className="auth-cloud auth-cloud--two" aria-hidden="true" />

          {/* Logo KataNusa & Story Copy di area atas (khusus varian signup agar tidak menutupi karakter latar) */}
          <div className="auth-story__header">
            <Link to="/" aria-label="Kembali ke beranda KataNusa" className="auth-story__logo-link">
              <LogoKataNusa className="auth-story__logo" />
            </Link>

            {variant === 'signup' && (
              <div className="auth-story__copy auth-story__copy--top">
                <p className="auth-story__eyebrow">{storyEyebrow}</p>
                <h2>{storyTitle}</h2>
                <p>{storyDescription}</p>
              </div>
            )}
          </div>

          <div className="auth-story__bottom">
            {variant !== 'signup' && (
              <div className="auth-story__copy">
                <p className="auth-story__eyebrow">{storyEyebrow}</p>
                <h2>{storyTitle}</h2>
                <p>{storyDescription}</p>
              </div>
            )}

            {steps.length > 0 ? (
              <ol className="auth-journey" aria-label="Tahapan pendaftaran">
                {steps.map((step) => {
                  const isComplete = currentStep > step.number;
                  const isCurrent = currentStep === step.number;

                  return (
                    <li
                      key={step.number}
                      className={`auth-journey__step${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      <span className="auth-journey__marker">
                        {isComplete ? <Check aria-hidden="true" size={13} strokeWidth={3} /> : step.number}
                      </span>
                      <span>
                        <small>Langkah {step.number}</small>
                        <strong>{step.shortLabel || step.label}</strong>
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </div>
        </aside>

        <section className="auth-content">
          <header className={`auth-topbar${!topAction ? ' auth-topbar--mobile-only' : ''}`}>
            <Link to="/" aria-label="Kembali ke beranda KataNusa" className="auth-topbar__mobile-logo">
              <LogoKataNusa className="auth-logo" />
            </Link>
            {topAction ? <div className="auth-topbar__action">{topAction}</div> : null}
          </header>

          {steps.length > 0 ? (
            <div className="auth-mobile-progress" aria-label={`Langkah ${safeStep} dari ${steps.length}: ${activeLabel ?? ''}`}>
              <div>
                <span>Langkah {safeStep} dari {steps.length}</span>
                <strong>{activeLabel}</strong>
              </div>
              <div className="auth-mobile-progress__track" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}

          <main className={`auth-main${wide ? ' auth-main--wide' : ''}`}>
            {children}
          </main>

          <footer className="auth-footer">
            © {new Date().getFullYear()} KataNusa · Ruang pengetahuan budaya Indonesia
          </footer>
        </section>
      </div>
    </div>
  );
};

export default AuthShell;

