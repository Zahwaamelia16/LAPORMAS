
import { Link } from 'react-router-dom';

import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

export default function WargaLayout({
  title,
  subtitle,
  heroContent,
  heroVariant = 'dashboard',
  children,
}) {
  const hasHero = heroContent !== undefined && heroContent !== null;

  return (
    <div className="citizen-site">
      <SiteHeader />

      <main className="citizen-main">
        {hasHero ? (
          <section
            className={`citizen-dashboard-hero ${
              heroVariant === 'form' ? 'citizen-form-hero' : ''
            }`}
          >
            <div className="citizen-hero-inner">
              <h1>{title}</h1>
              <p>{subtitle}</p>
              {heroContent}
            </div>
          </section>
        ) : (
          <section className="workspace-top citizen-page-top">
            <div className="workspace-heading">
              <div className="workspace-breadcrumb">
                <Link to="/">Beranda</Link>
                <span className="breadcrumb-divider">/</span>
                <span>Warga</span>
                <span className="breadcrumb-divider">/</span>
                <span className="breadcrumb-current">{title}</span>
              </div>

              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </section>
        )}

        <div className="workspace-content citizen-content">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
