import CustomSelect from './components/CustomSelect';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboard';
import AdminReportsPage from './pages/admin/AdminReports';
import AdminStaffRequestsPage from './pages/admin/AdminStaffRequests';
import AdminUsersPage from './pages/admin/AdminUsers';

import CitizenDashboardPage from './pages/warga/WargaDashboard';
import CitizenReportsPage from './pages/warga/WargaReports';
import NewReportPageModule from './pages/warga/NewReportPage';
import ProfilePageModule from './pages/warga/ProfilePage';
import RegistrationLocationPicker from './components/RegistrationLocationPicker';

import StaffDashboardPage from './pages/pengelola/PengelolaDashboard';
import StaffReportsPage from './pages/pengelola/PengelolaReports';
import StaffReportDetailPage from './pages/pengelola/PengelolaReportDetail';
import PengelolaPublicReportsPage from './pages/pengelola/PengelolaPublicReports';
import StaffLayout from './layouts/PengelolaLayout';
import PublicReportFilters from './pages/shared/PublicReportFilters';
import { usePublicReports } from './pages/shared/usePublicReports';
import ReportLocationMap from './components/ReportLocationMap';
import SiteHeader from './components/SiteHeader';

import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Construction,
  CircleHelp,
  Clock3,
  Droplets,
  Eye,
  EyeOff,
  FileCheck2,
  FileImage,
  FilePlus2,
  Filter,
  HeartHandshake,
  House,
  Lightbulb,
  LocateFixed,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Trees,
  TreePine,
  UploadCloud,
  UserRound,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { api, formatDate, getPosition, imageUrl, IS_DEMO_MODE } from './api';
import { useAuth } from './auth';

const DEMO_PHOTOS = {
  hero: '/images/hero.png',
  road: '/images/infrastruktur.png',
  trash: '/images/kebersihan.png',
  light: '/images/penerangan.png',
  drain: '/images/drainase.png',
  login: '/images/bg-login.jpg',
};

function Notice({ type = 'info', children, onClose }) {
  if (!children) return null;
  return <div className={`notice ${type}`} role="status">
    {type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
    <span>{children}</span>
    {onClose && <button className="icon-button" onClick={onClose} aria-label="Tutup"><X size={16} /></button>}
  </div>;
}

function LocalImagePreview({ file, alt }) {
  const [source, setSource] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setSource(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return source ? <img className="local-image-preview" src={source} alt={alt || file.name} /> : null;
}

function Status({ value }) {
  const key = (value || 'diterima').toLowerCase().replaceAll(' ', '-');
  return <span className={`status status-${key}`}>{value || 'Diterima'}</span>;
}
function getDashboardPath(role) {
  return role === 'admin' ? '/admin' : role === 'pengelola' ? '/pengelola' : '/warga';
}
function PageIntro({ eyebrow, title, subtitle, children }) {
  return <section className="page-intro">
    <div className="container">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  </section>;
}
function Footer() {
  return <footer className="footer">
    <div className="container footer-grid">
      <div>
        <Link to="/" className="brand brand-light">LAPORMAS</Link>
        <p>Layanan Pelaporan & Resolusi Masalah Area</p>
        <p className="muted-light">Dari kepedulian warga, untuk area yang lebih baik</p>
        <small>© 2026 LAPORMAS</small>
      </div>
      <div>
        <b>Jelajahi</b>
        <Link to="/laporan">Laporan publik</Link>
        <Link to="/cara-melapor">Cara melapor</Link>
        <Link to="/tentang">Tentang LAPORMAS</Link>
      </div>
      <div>
        <b>Informasi</b>
        <a href="mailto:bantuan@lapormas.id">Pusat bantuan</a>
        <Link to="/tentang#privasi">Kebijakan privasi</Link>
        <Link to="/tentang#ketentuan">Syarat & ketentuan</Link>
      </div>
    </div>
  </footer>;
}
function PublicNav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardPath = getDashboardPath(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container nav-inner">

        <Link to="/" className="brand brand-mark">
          <img src="/images/logo utama.png" alt="LAPORMAS" />
        </Link>

        <button
          className="mobile-menu"
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Buka menu navigasi"
          aria-expanded={open}
        >
          <Menu size={21} />
        </button>

        <nav className={open ? 'nav-links open' : 'nav-links'}>
          <NavLink to="/" end onClick={() => setOpen(false)}>
            Beranda
          </NavLink>

          <NavLink to="/tentang" onClick={() => setOpen(false)}>
            Tentang Kami
          </NavLink>

          <NavLink to="/laporan" onClick={() => setOpen(false)}>
            Laporan Publik
          </NavLink>

          <NavLink to="/cara-melapor" onClick={() => setOpen(false)}>
            Cara Melapor
          </NavLink>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <Link className="nav-user" to={dashboardPath}>
                <UserRound size={15} />
                {user.name?.split(' ')[0] || 'Akun'}
              </Link>

              {user.role === 'warga' && (
                <Link
                  to="/laporan/buat"
                  className="btn btn-primary btn-small"
                >
                  Buat Laporan
                </Link>
              )}

              <button
                className="btn btn-outline btn-small nav-logout"
                type="button"
                onClick={handleLogout}
              >
                Keluar
              </button>
            </>
          ) : (
          <>
            <Link
              to="/laporan/buat"
              className="btn btn-primary btn-small"
            >
              Buat Laporan
            </Link>

            <Link
              to="/masuk"
              className="btn btn-primary btn-small nav-login-button"
            >
              Login
            </Link>
          </>
          )}
        </div>
      </div>
    </header>
  );
}

function PublicLayout({ children }) {
  const { user, loading } = useAuth();

  // Memeriksa sesi akun
  if (loading) {
    return (
      <div className="screen-loading">
        Memeriksa akses...
      </div>
    );
  }

  // Admin hanya menggunakan portal administrator
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      <SiteHeader />
      {children}
      <Footer />
    </>
  );
}
function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="screen-loading">Memuat akun...</div>;
  if (!user) return <Navigate to="/masuk" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={getDashboardPath(user.role)} replace />;
  return children;
}

function HomePage() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    rate: 0,
    areas: 0
  });

  const [code, setCode] = useState('');
  const [tracked, setTracked] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [faq, setFaq] = useState(0);

  useEffect(() => {
    api('/stats')
      .then((d) => setStats(d.stats))
      .catch(() => {});
  }, []);

  const track = async (e) => {
    e.preventDefault();

    setTrackError('');
    setTracked(null);

    if (!code.trim()) {
      return setTrackError(
        'Masukkan nomor laporan terlebih dahulu.'
      );
    }

    try {
      const d = await api(
        `/reports/track/${encodeURIComponent(code.trim())}`
      );

      setTracked(d.report);
    } catch (err) {
      setTrackError(err.message);
    }
  };

  const categories = [
    {
      title: 'Infrastruktur',
      description: 'Jalan, trotoar, dan fasilitas umum',
      photo: DEMO_PHOTOS.road,
    },
    {
      title: 'Kebersihan',
      description: 'Sampah dan kebersihan area',
      photo: DEMO_PHOTOS.trash,
    },
    {
      title: 'Penerangan',
      description: 'Lampu jalan dan area publik',
      photo: DEMO_PHOTOS.light,
    },
    {
      title: 'Drainase',
      description: 'Saluran air dan genangan',
      photo: DEMO_PHOTOS.drain,
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Ceritakan masalahnya',
      description:
        'Isi detail kejadian, pilih lokasi, dan sertakan foto pendukung.',
    },
    {
      number: '2',
      title: 'Laporan diarahkan',
      description:
        'Sistem dan petugas memeriksa lalu meneruskan laporan ke unit yang bertanggung jawab.',
    },
    {
      number: '3',
      title: 'Pantau sampai selesai',
      description:
        'Cek status menunggu, diverifikasi, diproses, hingga selesai dari satu halaman.',
    },
  ];

  const faqs = [
    [
      'Masalah apa saja yang bisa dilaporkan?',
      'Kamu bisa melaporkan masalah infrastruktur, kebersihan, penerangan, drainase, pohon tumbang, dan kerusakan fasilitas umum di area tempat tinggalmu.',
    ],
    [
      'Apakah identitas pelapor ditampilkan ke publik?',
      'Tidak. Nama, nomor telepon, dan email pelapor tidak ditampilkan pada halaman laporan publik.',
    ],
    [
      'Bagaimana cara memantau laporan saya?',
      'Gunakan nomor laporan yang diterima setelah pengiriman. Kamu juga dapat melihat riwayat penanganan melalui dashboard akun.',
    ],
    [
      'Apakah LAPORMAS untuk keadaan darurat?',
      'Bukan. Untuk kondisi yang mengancam keselamatan, segera hubungi layanan darurat atau instansi setempat.',
    ],
  ];

  return (
    <PublicLayout>
      <main className="home-page">

        {/* HERO */}
        <section className="hero">

          <div className="hero-background">
            <img
              src={DEMO_PHOTOS.hero}
              alt="Lingkungan permukiman"
            />
          </div>

          <div className="hero-overlay" />

          <div className="container hero-inner">
            <div className="hero-copy">

              <h1>
                Lingkungan lebih baik,
                <br />
                dimulai dari laporanmu
              </h1>

              <p>
                Sampaikan masalah di sekitarmu, LAPORMAS membantu
                meneruskan laporan ke pihak terkait dan memantau
                penyelesaiannya secara terbuka.
              </p>

              <div className="hero-actions">
                <Link
                  to="/laporan/buat"
                  className="btn btn-primary"
                >
                  Buat Laporan
                </Link>

                <a
                  href="#lacak"
                  className="btn btn-outline"
                >
                  Lacak Laporan
                </a>
              </div>

            </div>
          </div>

          {/* STATISTIK */}
          <div className="container home-stats-wrap">
            <div className="home-stats-card">

              <div className="home-stat">
                <span>Laporan diterima</span>
                <strong>
                  {stats.total.toLocaleString('id-ID')}
                </strong>
              </div>

              <div className="home-stat">
                <span>Laporan diselesaikan</span>
                <strong>
                  {stats.completed.toLocaleString('id-ID')}
                </strong>
              </div>

              <div className="home-stat">
                <span>Tingkat Penyelesaian</span>
                <strong>{stats.rate}%</strong>
              </div>

              <div className="home-stat">
                <span>Area terjangkau</span>
                <strong>{stats.areas}</strong>
              </div>

            </div>
          </div>

        </section>

        {/* KATEGORI */}
        <section className="section container category-section">

          <div className="home-section-heading">
            <h2>
              Masalah di sekitar kita layak mendapat perhatian
            </h2>

            <p>
              Pilih kategori yang sesuai agar laporanmu segera sampai
              kepada pihak yang tepat
            </p>
          </div>

          <div className="category-grid">

            {categories.map((category) => (
              <Link
                key={category.title}
                to={`/laporan/buat?category=${encodeURIComponent(category.title)}`}
                className="category-card"
              >

                <span
                  className="category-photo"
                  style={{
                    backgroundImage: `url("${category.photo}")`
                  }}
                />

                <span className="category-shade" />

                <span className="category-content">
                  <b>{category.title}</b>
                  <span>{category.description}</span>
                </span>

              </Link>
            ))}

          </div>
        </section>

        {/* CARA MELAPOR */}
        <section className="steps-section">
          <div className="container">

            <div className="home-section-heading">
              <h2>
                Tiga langkah sederhana untuk ikut merawat lingkungan
              </h2>
            </div>

            <div className="steps-list">

              {steps.map((step) => (
                <div className="step-row" key={step.number}>

                  <span className="step-number">
                    {step.number}
                  </span>

                  <div>
                    <b>{step.title}</b>
                    <p>{step.description}</p>
                  </div>

                </div>
              ))}

            </div>
          </div>
        </section>

        {/* LACAK LAPORAN */}
        <section className="track-section" id="lacak">
          <div className="container">

            <div className="track-heading">
              <h2>Lacak laporanmu</h2>

              <p>
                Masukkan nomor laporan untuk melihat status dan
                riwayat penanganannya
              </p>
            </div>

            <div className="track-panel">

              <form
                className="track-form"
                onSubmit={track}
              >

                <label htmlFor="track-code">
                  Nomor laporan
                </label>

                <div>
                  <input
                    id="track-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: LPM-2026-0824"
                  />

                  <button
                    className="btn btn-primary"
                    type="submit"
                  >
                    Lacak
                  </button>
                </div>

              </form>

              {trackError && (
                <p className="form-error">{trackError}</p>
              )}

              {tracked && (
                <TrackSummary report={tracked} />
              )}

            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section container home-faq">

          <div className="home-faq-intro">

            <h2>
              Temukan jawaban sebelum membuat laporan pertamamu
            </h2>

          </div>

          <div className="faq-list">

            {faqs.map((item, i) => (
              <button
                key={item[0]}
                className={
                  faq === i
                    ? 'faq-item open'
                    : 'faq-item'
                }
                onClick={() => setFaq(faq === i ? -1 : i)}
              >

                <span>
                  <b>{item[0]}</b>

                  {faq === i && (
                    <p>{item[1]}</p>
                  )}
                </span>

                <span className="faq-toggle">
                  {faq === i ? '−' : '+'}
                </span>

              </button>
            ))}

          </div>
        </section>

      </main>
    </PublicLayout>
  );
}


function ReportCards({ reports = [] }) {
  if (!reports.length) {
    return (
      <div className="public-report-empty">
        <FileCheck2 size={34} />
        <b>Belum ada laporan yang ditampilkan</b>
        <span>
          Laporan akan muncul di sini setelah tersedia
        </span>
      </div>
    );
  }

  const categoryIcons = {
    'Sampah Menumpuk': Trash2,
    'Jalan Rusak': Construction,
    'Pohon Tumbang': TreePine,
    'Lampu Jalan Mati': Lightbulb,
    'Saluran Tersumbat': Waves,
    Banjir: Waves,
    'Fasilitas Umum Rusak': House,
    Lainnya: MapPin,
  };

  return (
    <div className="public-report-list">
      {reports.map((report) => {
        const reportImage =
          report.images?.[0]?.image_url || report.image_url;

        const CategoryIcon =
          categoryIcons[report.category_name] || MapPin;

        const attachmentCount =
          report.images?.length || (reportImage ? 1 : 0);

        const reportCode =
          report.report_code ||
          `LPM-${String(report.report_id).padStart(5, '0')}`;

        const location = [
          report.village_name
            ? `Desa ${report.village_name}`
            : '',
          report.district_name
            ? `Kec. ${report.district_name}`
            : '',
        ]
          .filter(Boolean)
          .join(', ');

        return (
          <article
            className="public-report-card"
            key={report.report_id}
          >
            {/* FOTO LAPORAN */}
            <div className="public-report-media">
              {reportImage ? (
                <img
                  src={imageUrl(reportImage)}
                  alt={`Foto laporan ${report.title}`}
                  loading="lazy"
                />
              ) : (
                <div className="public-report-placeholder">
                  <CategoryIcon size={37} />
                  <span>Foto belum tersedia</span>
                  <small>{report.category_name}</small>
                </div>
              )}

              <div className="public-report-attachment">
                <FileImage size={13} />
                {attachmentCount} foto lampiran
              </div>
            </div>

            {/* INFORMASI LAPORAN */}
            <div className="public-report-content">

              <div className="public-report-topline">
              <div className="public-report-identity">

                <span className="public-report-category-icon">
                  <CategoryIcon size={15} />
                </span>

                <div className="public-report-identity-text">
                  <span className="public-report-category">
                    {report.category_name}
                  </span>

                  <span className="public-report-code">
                    {reportCode}
                  </span>
                </div>

              </div>

                <Status value={report.status_name} />
              </div>

              <h3>
                <Link to={`/laporan/${report.report_id}`}>
                  {report.title}
                </Link>
              </h3>

              <p className="public-report-description">
                {report.description || 'Tidak ada deskripsi laporan.'}
              </p>

              <div className="public-report-meta">
                <span>
                  <MapPin size={14} />
                  {location || report.location || 'Lokasi belum dicantumkan'}
                </span>

                <span>
                  Dilaporkan {formatDate(report.created_at)}
                </span>
              </div>

              <Link
                to={`/laporan/${report.report_id}`}
                className="public-report-detail"
              >
                Lihat detail
                <ArrowRight size={14} />
              </Link>

            </div>
          </article>
        );
      })}
    </div>
  );
}


function TrackSummary({ report }) {
  return <div className="track-result">
    <div><span className="eyebrow">{report.report_code}</span><Status value={report.status_name} /></div>
    <b>{report.title}</b>
    <span>{report.village_name}, {report.district_name}, {report.regency_name}</span>
    <Link to={`/lacak/${report.report_code}`} className="text-link">Lihat riwayat lengkap <ArrowRight size={14} /></Link>
  </div>;
}


function PublicReportsPage() {
  const {
    reports,
    areas,
    categories,
    statuses,
    filters,
    setFilters,
    loading,
  } = usePublicReports();

  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
  });

  const [visibleCount, setVisibleCount] = useState(3);

  // Ambil statistik keseluruhan dari database
  useEffect(() => {
    let active = true;

    api('/stats')
      .then((data) => {
        if (!active) return;

        const result = data.stats || {};

        setStats({
          total: Number(result.total || 0),
          processing: Number(result.processing || 0),
          completed: Number(result.completed || 0),
        });
      })
      .catch((error) => {
        console.error('Gagal memuat statistik laporan:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  // Kembali ke tiga laporan pertama saat filter berubah
  useEffect(() => {
    setVisibleCount(3);
  }, [filters]);

  const visibleReports = reports.slice(0, visibleCount);
  const hasMore = visibleCount < reports.length;

  return (
    <PublicLayout>
      <main className="public-reports-page">

        {/* HERO DAN STATISTIK */}
        <section className="public-report-hero">
          <div className="container public-report-hero-inner">

            <div className="public-report-hero-copy">
              <span>TRANSPARANSI LAPORAN</span>

              <h1>Laporan Publik</h1>

              <p>
                Pantau masalah lingkungan dan proses
                penanganannya di berbagai wilayah
              </p>
            </div>

            <div className="public-report-stats">

              <div>
                <span>Total</span>
                <strong>
                  {stats.total.toLocaleString('id-ID')}
                </strong>
              </div>

              <div>
                <span>Diproses</span>
                <strong>
                  {stats.processing.toLocaleString('id-ID')}
                </strong>
              </div>

              <div>
                <span>Selesai</span>
                <strong>
                  {stats.completed.toLocaleString('id-ID')}
                </strong>
              </div>

            </div>
          </div>
        </section>

        {/* PENCARIAN, FILTER, DAN DAFTAR LAPORAN */}
        <section className="container public-listing-v2">

          <PublicReportFilters
            areas={areas}
            categories={categories}
            statuses={statuses}
            filters={filters}
            setFilters={setFilters}
          />

          <div className="public-report-results-heading">
            <span>
              Menampilkan {visibleReports.length} laporan
            </span>
          </div>

          {loading ? (
            <div className="screen-loading">
              Memuat laporan...
            </div>
          ) : (
            <>
              <ReportCards reports={visibleReports} />

              {hasMore && (
                <div className="public-report-load-more">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((current) => current + 3)
                    }
                  >
                    Muat lebih banyak
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}

        </section>
      </main>
    </PublicLayout>
  );
}

function GlobeIcon() {
  return <MapPin size={15} />;
}

function PublicReportDetail({ track = false, manager = false }) {
  const { id, code } = useParams();
  const navigate = useNavigate();
  const currentLocation = useLocation();

  const fallbackPath = manager
    ? '/pengelola/laporan-publik'
    : currentLocation.pathname.startsWith('/warga/laporan/')
      ? '/warga'
      : track
        ? '/'
        : '/laporan';

  const handleBack = () => {
    if (currentLocation.key !== 'default') {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const endpoint = track
      ? `/reports/track/${encodeURIComponent(code)}`
      : `/reports/${id}`;

    api(endpoint)
      .then((data) => setReport(data.report))
      .catch((requestError) => setError(requestError.message));
  }, [id, code, track]);

  const subtitle = report
    ? `${report.report_code} · ${[
      report.village_name,
      report.district_name,
      report.regency_name,
    ].filter(Boolean).join(', ')}`
    : 'Informasi laporan dan riwayat penanganan.';

  const Layout = manager ? StaffLayout : PublicLayout;

  return (
    <Layout
      {...(manager ? {
        title: report?.title || 'Detail laporan publik',
        subtitle,
      } : {})}
    >
    {!manager && (
      <section className="page-intro">
        <div className="container">
          <div className="eyebrow detail-page-eyebrow">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Kembali ke halaman sebelumnya"
              title="Kembali"
            >
              <ArrowLeft size={17} />
            </button>

            <span>DETAIL LAPORAN</span>
          </div>

          <h1>{report?.title || 'Detail laporan'}</h1>
          <p>{subtitle}</p>
        </div>
      </section>
    )}

      {manager && (
        <Link to="/pengelola/laporan-publik" className="text-link back-inline">
          Kembali ke laporan publik
        </Link>
      )}

      <main className="container section detail-layout">
        {error ? (
          <Notice type="error">{error}</Notice>
        ) : !report ? (
          <div className="screen-loading">Memuat detail laporan...</div>
        ) : (
          <>
            <section className="detail-main">
              <div className="detail-status-row">
                <Status value={report.status_name} />
                <span>Dikirim {formatDate(report.created_at)}</span>
              </div>

              <h2>{report.title}</h2>
              <p>{report.description}</p>

              <div className="detail-info-grid">
                <div>
                  <span>Kategori</span>
                  <b>{report.category_name}</b>
                </div>

                <div>
                  <span>Lokasi kejadian</span>
                  <b>{report.location}</b>
                </div>

                <div>
                  <span>Wilayah terdeteksi</span>
                  <b>
                    {[
                      report.village_name,
                      report.district_name,
                      report.regency_name,
                    ].filter(Boolean).join(', ')}
                  </b>
                </div>
              </div>

              {/* Peta lokasi kejadian */}
              <ReportLocationMap
                latitude={report.latitude}
                longitude={report.longitude}
                location={report.location}
              />

              {/* Foto bukti laporan */}
              {report.images?.length > 0 && (
                <div className="detail-images">
                  {report.images.map((image, index) => (
                    <img
                      key={index}
                      src={imageUrl(image.image_url)}
                      alt={`Foto laporan ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </section>

            <aside className="timeline-panel">
              <h3>Riwayat penanganan</h3>
              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-dot done" />
                  <div>
                    <b>Laporan diterima</b>
                    <small>{formatDate(report.created_at)}</small>
                  </div>
                </div>

                {(report.updates || []).map((update, index) => (
                  <div className="timeline-item" key={index}>
                    <span className="timeline-dot" />
                    <div>
                      <b>{update.new_status}</b>
                      <small>{formatDate(update.updated_at)}</small>
                      {update.notes && <p>{update.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </>
        )}
      </main>
    </Layout>
  );
}

function HowPage() {
  const steps = [
    {
      number: '1',
      title: 'Pilih kategori dan jelaskan masalah',
      description:
        'Tentukan jenis masalah, tulis judul singkat, lalu jelaskan kondisi yang kamu temukan dengan jelas',
    },
    {
      number: '2',
      title: 'Lengkapi bukti dan lokasi',
      description:
        'Tambahkan foto yang terlihat jelas serta tuliskan alamat atau patokan lokasi kejadian',
    },
    {
      number: '3',
      title: 'Periksa lalu kirim laporan',
      description:
        'Pastikan seluruh informasi sudah benar. Setelah dikirim, kamu akan menerima nomor referensi',
    },
    {
      number: '4',
      title: 'Pantau perkembangan',
      description:
        'Gunakan nomor referensi untuk mengikuti status dan catatan petugas hingga laporan selesai',
    },
  ];

  const checklist = [
    'Judul singkat dan spesifik',
    'Lokasi atau patokan jelas',
    'Foto sesuai kondisi terkini',
    'Deskripsi faktual dan sopan',
    'Kategori masalah sesuai',
    'Tidak memuat data pribadi',
  ];

  return (
    <PublicLayout>
      <main className="how-page-v2">

        {/* JUDUL DAN PENGANTAR */}
        <section className="container how-intro-v2">
          <h1>Cara melapor di LAPORMAS</h1>

          <p>
            Ikuti empat langkah sederhana berikut untuk menyampaikan
            masalah di lingkunganmu, agar laporanmu lengkap, mudah
            diverifikasi, dan segera diteruskan ke pihak yang tepat
          </p>
        </section>

        {/* EMPAT LANGKAH PELAPORAN */}
        <section
          className="container how-steps-v2"
          aria-label="Empat langkah melapor"
        >
          {steps.map((step) => (
            <article className="how-step-item" key={step.number}>
              <span className="how-step-number">
                {step.number}
              </span>

              <div className="how-step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </section>

        {/* TIPS MEMBUAT LAPORAN */}
        <section className="container how-guidance-v2">

          <div className="how-guidance-heading">
            <h2>
              Laporan yang baik mempercepat penanganan
            </h2>

            <p>
              Sebelum dikirim, pastikan laporanmu memenuhi
              beberapa hal sederhana ini
            </p>
          </div>

          <div className="how-guidance-media">

            <img
              src="/images/cara%20melapor.png"
              alt="Pemandangan lingkungan permukiman dan area sekitar warga"
            />

            <div className="how-checklist">
              {checklist.map((item) => (
                <div className="how-check-item" key={item}>
                  <CheckCircle2
                    size={17}
                    aria-hidden="true"
                  />

                  <span>{item}</span>
                </div>
              ))}
            </div>

          </div>
        </section>

      </main>
    </PublicLayout>
  );
}

function AboutPage() {
  const aboutSteps = [
    {
      number: '1',
      title: 'Pelaporan yang mudah',
      description:
        'Formulir sederhana dan terarah agar laporan bisa dikirim tanpa kebingungan.',
    },
    {
      number: '2',
      title: 'Bukti yang lengkap',
      description:
        'Sertakan foto dan lokasi kejadian untuk membantu proses pemeriksaan.',
    },
    {
      number: '3',
      title: 'Pantau perkembangannya',
      description:
        'Ikuti setiap perubahan status dan catatan penanganan secara transparan.',
    },
    {
      number: '4',
      title: 'Ditangani pihak tepat',
      description:
        'Laporan diarahkan ke unit bertanggung jawab berdasarkan kategori dan wilayah.',
    },
  ];

  return (
    <PublicLayout>
      <main className="about-page">

        {/* PEMBUKA DAN TAHAPAN LAPORMAS */}
        <section className="about-intro">
          <div className="container">
            <h1>Satu tempat untuk setiap suara warga</h1>

            <p>
              Bukan sekadar tempat mengirim pengaduan. LAPORMAS
              memastikan warga tahu apa yang terjadi setelah
              laporannya dikirim.
            </p>

            <div className="about-steps">
              {aboutSteps.map((step) => (
                <article className="about-step-card" key={step.number}>
                  <span className="about-step-number">
                    {step.number}
                  </span>

                  <h3>{step.title}</h3>

                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* TUJUAN LAPORMAS */}
        <section className="container about-story">

          <div className="about-photo">
            <img
              src="/images/tentang kami.png"
              alt="Warga dan petugas bekerja sama membersihkan lingkungan"
            />
          </div>

          <div className="about-copy">
            <h2>
              Lingkungan yang nyaman dimulai dari kepedulian bersama
            </h2>

            <p>
              Warga dapat melaporkan masalah di berbagai wilayah,
              memantau progres penanganan dan melihat laporan publik.
              Pengelola menangani laporan sesuai area tugasnya,
              sedangkan admin memantau keseluruhan sistem
            </p>

            <div className="about-feature">
              <HeartHandshake
                size={25}
                aria-hidden="true"
              />

              <div>
                <b>Terbuka dan kolaboratif</b>
                <span>
                  Informasi laporan yang dapat dipantau tanpa membuka
                  data pribadi pelapor
                </span>
              </div>
            </div>

            <div className="about-feature">
              <MapPin
                size={25}
                aria-hidden="true"
              />

              <div>
                <b>Berbasis wilayah</b>
                <span>
                  Lokasi kejadian digunakan untuk menentukan area
                  dan pengelola yang menangani
                </span>
              </div>
            </div>

            <div className="about-feature">
              <ShieldCheck
                size={25}
                aria-hidden="true"
              />

              <div>
                <b>Menjaga privasi</b>
                <span>
                  Identitas dan kontak pelapor tidak ditampilkan
                  pada laporan publik
                </span>
              </div>
            </div>
          </div>

        </section>
      </main>
    </PublicLayout>
  );
}


function AuthVisualPanel() {
  return (
    <section className="auth-visual">
      <div className="auth-visual-bg">
        <img
          src="/images/bg%20login.png"
          alt="Pemandangan lingkungan LAPORMAS"
        />
      </div>

      <div className="auth-visual-overlay"></div>

      <Link to="/" className="auth-logo">
        <img src="/images/logo.png" alt="LAPORMAS" />
      </Link>

      <div className="auth-visual-copy">
        <h1>
          Lingkungan lebih baik,
          <br />
          dimulai dari laporanmu
        </h1>

        <p>
          Platform pelaporan masalah lingkungan yang memudahkan
          warga dan pengelola bekerja sama menjaga kenyamanan bersama.
        </p>
      </div>
    </section>
  );
}

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requestedRole = new URLSearchParams(location.search).get('role');

  const [role, setRole] = useState(
    requestedRole === 'admin'
      ? 'admin'
      : requestedRole === 'warga'
        ? 'warga'
        : 'pengelola'
  );

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Redirect jika pengguna sudah login
  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  // Ganti role login
  const chooseRole = (nextRole) => {
    setRole(nextRole);
    setError('');
    setPassword('');
  };

  // Proses login tetap menggunakan autentikasi yang sudah ada
  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      const data = await login({
        identifier: identifier.trim(),
        password,
        role,
      });

      const defaultPath = getDashboardPath(data.user.role);
      const requestedPath = location.state?.from;

      navigate(
        requestedPath &&
        data.user.role === 'warga' &&
        requestedPath.startsWith('/laporan')
          ? requestedPath
          : defaultPath,
        { replace: true }
      );
    } catch (err) {
      setError(err.message || 'Email atau kata sandi belum sesuai.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page auth-page-v2">

      {/* PANEL KIRI */}
      <AuthVisualPanel />

      {/* PANEL KANAN */}
      <section className="auth-form-side">

        <div className="auth-form-wrap">

          <h2>selamat datang kembali</h2>

          <p className="auth-welcome-description">
            Laporkan masalah di lingkunganmu dan pantau penyelesaiannya.
          </p>

          {/* PILIH ROLE */}
          {role === 'admin' ? (

            <div className="admin-login-label">
              <ShieldCheck size={17} aria-hidden="true" />

              <span>Masuk sebagai Administrator</span>

              <button
                type="button"
                onClick={() => chooseRole('pengelola')}
              >
                Ganti role
              </button>
            </div>

          ) : (

            <div className="role-switch" aria-label="Pilih jenis akun">

              {[
                { value: 'warga', label: 'Warga' },
                { value: 'pengelola', label: 'Pengelola' },
              ].map(({ value, label }) => (

                <button
                  type="button"
                  key={value}
                  className={role === value ? 'active' : ''}
                  onClick={() => chooseRole(value)}
                  aria-pressed={role === value}
                >
                  {label}
                </button>

              ))}

            </div>

          )}

          {/* FORM LOGIN */}
          <form onSubmit={submit} className="form-stack auth-login-form">

            <label>
              Email / No. telepon

              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  role === 'pengelola'
                    ? 'Contoh: pengelola@lapormas.id / 082345679854'
                    : 'Contoh: warga@lapormas.id / 082345679854'
                }
                autoComplete="username"
                required
              />
            </label>

            <label>
              Kata sandi

              <div className="password-field">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandimu disini"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={
                    show
                      ? 'Sembunyikan kata sandi'
                      : 'Tampilkan kata sandi'
                  }
                >
                  {show
                    ? <EyeOff size={17} />
                    : <Eye size={17} />
                  }
                </button>
              </div>
            </label>

            {/* PESAN ERROR */}
            {error && <Notice type="error">{error}</Notice>}

            {/* TOMBOL MASUK */}
            <button
              type="submit"
              className="btn btn-primary btn-block auth-login-submit"
              disabled={busy}
            >
              {busy ? 'Memproses...' : 'Masuk'}
            </button>

          </form>

          {/* SIGN UP */}
          {role === 'warga' ? (

            <div className="auth-signup">
              Belum punya akun? Silahkan{' '}
              <Link to="/daftar">Sign Up</Link>
            </div>

          ) : role === 'pengelola' ? (

            <div className="auth-signup">
              Belum punya akun? Silahkan{' '}
              <Link to="/daftar-pengelola">Sign Up</Link>
            </div>

          ) : (

            <div className="auth-signup">
              Akun administrator dibuat khusus oleh sistem.
            </div>

          )}

          {/* AKSES ADMIN TETAP TERSEDIA */}
          {role !== 'admin' && (
            <button
              type="button"
              className="admin-entry"
              onClick={() => chooseRole('admin')}
            >
              Masuk sebagai admin
            </button>
          )}

        </div>

      </section>

    </div>
  );
}



function RegisterCitizen() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const [position, setPosition] = useState(null);
  const [gpsBusy, setGpsBusy] = useState(false);

  const [locationResult, setLocationResult] = useState(null);
  const [lookupStatus, setLookupStatus] = useState('idle');
  const [lookupMessage, setLookupMessage] = useState(
    'Tentukan lokasi rumahmu melalui peta atau GPS.'
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const latitude = position?.latitude ?? null;
  const longitude = position?.longitude ?? null;

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // Cari alamat setiap kali titik peta berubah.
  useEffect(() => {
    if (latitude === null || longitude === null) {
      return undefined;
    }

    let active = true;

    setLocationResult(null);
    setLookupStatus('loading');
    setLookupMessage('Sedang mencari alamat dan wilayah...');

    // Debounce agar tidak mengirim permintaan saat pin
    // masih sering dipindahkan.
    const timer = setTimeout(async () => {
      try {
        const data = await api('/auth/reverse-geocode', {
          method: 'POST',
          body: {
            latitude,
            longitude,
          },
        });

        if (!active) return;

        setLocationResult(data);

        // Alamat otomatis mengisi kolom tempat tinggal.
        if (data.displayAddress) {
          setForm((current) => ({
            ...current,
            address: data.displayAddress,
          }));
        }

        if (data.matchedArea) {
          const area = data.matchedArea;

          setLookupStatus('matched');

          setLookupMessage(
            `Wilayah ditemukan: Desa ${area.village_name}, Kec. ${area.district_name}, ${area.regency_name}.`
          );
        } else {
          setLookupStatus('unmatched');

          setLookupMessage(
            'Alamat ditemukan, tetapi wilayah belum cocok dengan data wilayah LAPORMAS. Data akan menunggu verifikasi admin.'
          );
        }

      } catch (err) {
        if (!active) return;

        setLookupStatus('error');
        setLookupMessage(
          `${err.message} Silakan isi alamat secara manual jika diperlukan.`
        );
      }
    }, 1200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [latitude, longitude]);

  // Perubahan lokasi dari GPS atau peta.
  const choosePosition = (point) => {
    setPosition({
      latitude: Number(point.latitude),
      longitude: Number(point.longitude),
      accuracy: point.accuracy ?? null,
    });

    setLocationResult(null);
    setForm((current) => ({
      ...current,
      address: '',
    }));

    setError('');
  };

  // Deteksi GPS perangkat.
  const detect = async () => {
    setGpsBusy(true);
    setError('');

    try {
      const point = await getPosition();

      choosePosition(point);
    } catch (err) {
      setLookupStatus('error');
      setLookupMessage(err.message);
    } finally {
      setGpsBusy(false);
    }
  };

  // Submit pendaftaran.
  const submit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (form.password.length < 8) {
      return setError('Kata sandi minimal 8 karakter.');
    }

    if (form.password !== confirmPassword) {
      return setError('Konfirmasi kata sandi tidak sama.');
    }

    if (!position) {
      return setError('Tentukan lokasi rumahmu terlebih dahulu.');
    }

    if (lookupStatus === 'loading') {
      return setError('Tunggu sampai pencarian alamat selesai.');
    }

    if (!form.address.trim()) {
      return setError('Alamat tempat tinggal wajib diisi.');
    }

    if (!accepted) {
      return setError(
        'Setujui Syarat & Ketentuan dan Kebijakan Privasi terlebih dahulu.'
      );
    }

    setBusy(true);

    try {
      const data = await api('/auth/register/warga', {
        method: 'POST',

        body: {
          ...form,
          latitude: position.latitude,
          longitude: position.longitude,

          area_id:
            locationResult?.matchedArea?.area_id || null,

          village_name:
            locationResult?.matchedArea?.village_name ||
            locationResult?.administrative?.village ||
            '',
        },
      });

      setSuccess(data.message);

      setTimeout(() => {
        navigate('/masuk?role=warga');
      }, 1800);

    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const area = locationResult?.matchedArea;
  const administrative = locationResult?.administrative || {};

  return (
    <div className="auth-page auth-page-v2 auth-register-page">

      <AuthVisualPanel />

      <section className="auth-form-side auth-register-side">

        <div className="auth-register-wrap">

          {/* HEADER PENDAFTARAN */}
          <div className="auth-register-title">
            <h2>Buat akun warga</h2>

            <p>
              Daftar untuk melapor dan memantau penyelesaian
              masalah di wilayahmu.
            </p>
          </div>

          {/* PILIH ROLE */}
          <div className="auth-register-role-switch">
            <Link to="/daftar" className="active">
              Warga
            </Link>

            <Link to="/daftar-pengelola">
              Pengelola
            </Link>
          </div>

          <form
            onSubmit={submit}
            className="form-stack auth-register-form"
          >

            {/* DATA AKUN */}
            <section className="auth-register-section">

              <div className="auth-register-section-heading">
                <h3>Data akun</h3>
              </div>

              <label>
                Nama lengkap

                <input
                  value={form.name}
                  onChange={(event) =>
                    update('name', event.target.value)
                  }
                  placeholder="Masukkan nama lengkapmu"
                  autoComplete="name"
                  required
                />
              </label>

              <div className="auth-register-grid">

                <label>
                  Email

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      update('email', event.target.value)
                    }
                    placeholder="nama@gmail.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label>
                  No. telepon

                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      update('phone', event.target.value)
                    }
                    placeholder="082345679854"
                    autoComplete="tel"
                    required
                  />
                </label>

                <label>
                  Kata sandi

                  <div className="auth-register-password-field">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      minLength="8"
                      value={form.password}
                      onChange={(event) =>
                        update('password', event.target.value)
                      }
                      placeholder="Minimal 8 karakter"
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((current) => !current)}
                      aria-label={showRegisterPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      aria-pressed={showRegisterPassword}
                    >
                      {showRegisterPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </label>

                <label>
                  Konfirmasi kata sandi

                  <div className="auth-register-password-field">
                    <input
                      type={showRegisterConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Ulangi kata sandi"
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowRegisterConfirmPassword((current) => !current)
                      }
                      aria-label={showRegisterConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                      aria-pressed={showRegisterConfirmPassword}
                    >
                      {showRegisterConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </label>

              </div>

            </section>

            {/* LOKASI TEMPAT TINGGAL */}
            <section className="auth-register-section">

              <div className="auth-register-section-heading">
                <h3>Lokasi tempat tinggal</h3>
              </div>

              <p className="auth-register-hint">
                Tandai titik koordinat rumahmu agar laporanmu
                otomatis diarahkan ke wilayah yang tepat
              </p>

              <label>
                Alamat tempat tinggal

                <input
                  value={form.address}
                  onChange={(event) =>
                    update('address', event.target.value)
                  }
                  placeholder="Alamat akan terisi setelah lokasi terdeteksi"
                  autoComplete="street-address"
                  required
                />
              </label>

              <RegistrationLocationPicker
                position={position}
                onChange={choosePosition}
                onUseMyLocation={detect}
                detecting={gpsBusy}
              />

              <div
                className={`auth-location-feedback ${lookupStatus}`}
              >
                {lookupMessage}
              </div>

              {/* SUMBER DATA ALAMAT */}
              <div className="registration-map-attribution">
                Data alamat:
                {' '}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  © OpenStreetMap contributors
                </a>
              </div>

              {/* KOORDINAT */}
              <div className="auth-register-grid auth-coordinate-grid">

                <label>
                  Latitude

                  <input
                    value={
                      position
                        ? position.latitude.toFixed(6)
                        : ''
                    }
                    placeholder="Contoh: -7.257500"
                    readOnly
                  />
                </label>

                <label>
                  Longitude

                  <input
                    value={
                      position
                        ? position.longitude.toFixed(6)
                        : ''
                    }
                    placeholder="Contoh: 112.752100"
                    readOnly
                  />
                </label>

              </div>

              {/* WILAYAH OTOMATIS */}
              <div className="auth-register-section-heading auth-area-heading">
                <h3>Wilayah tempat tinggal</h3>

                <span>
                  {lookupStatus === 'matched'
                    ? 'Berhasil dicocokkan'
                    : lookupStatus === 'loading'
                      ? 'Mendeteksi...'
                      : 'Hasil deteksi lokasi'}
                </span>
              </div>

              <div className="auth-register-grid auth-area-grid">

                <label>
                  Kabupaten/Kota

                  <input
                    value={
                      area?.regency_name ||
                      administrative.regency ||
                      ''
                    }
                    placeholder="Terisi otomatis"
                    readOnly
                  />
                </label>

                <label>
                  Kecamatan

                  <input
                    value={
                      area?.district_name ||
                      administrative.district ||
                      ''
                    }
                    placeholder="Terisi otomatis"
                    readOnly
                  />
                </label>

                <label className="auth-area-village">
                  Desa/Kelurahan

                  <input
                    value={
                      area?.village_name ||
                      administrative.village ||
                      ''
                    }
                    placeholder="Terisi otomatis"
                    readOnly
                  />
                </label>

              </div>

              {lookupStatus === 'unmatched' && (
                <Notice type="info">
                  Nama wilayah berhasil dideteksi, tetapi belum
                  terdaftar di master wilayah LAPORMAS. Akun akan
                  menunggu verifikasi wilayah oleh admin.
                </Notice>
              )}

              <div className="notice info auth-register-privacy">
                <ShieldCheck size={16} aria-hidden="true" />

                <span>
                  Koordinat digunakan untuk membantu menentukan
                  wilayah tempat tinggal dan tidak ditampilkan
                  pada laporan publik.
                </span>
              </div>

            </section>

            {/* PERSETUJUAN */}
            <label className="auth-register-consent">

              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) =>
                  setAccepted(event.target.checked)
                }
                required
              />

              <span>
                Saya menyetujui Syarat &amp; Ketentuan dan
                Kebijakan Privasi LAPORMAS.
              </span>

            </label>

            {error && <Notice type="error">{error}</Notice>}
            {success && <Notice type="success">{success}</Notice>}

            <button
              type="submit"
              className="btn btn-primary btn-block auth-register-submit"
              disabled={busy || gpsBusy || lookupStatus === 'loading'}
            >
              {busy
                ? 'Membuat akun...'
                : lookupStatus === 'loading'
                  ? 'Mendeteksi lokasi...'
                  : 'Daftar'}
            </button>

          </form>

          <div className="auth-register-login">
            Sudah punya akun?
            {' '}
            <Link to="/masuk?role=warga">
              Masuk
            </Link>
          </div>

        </div>

      </section>

    </div>
  );
}


function RegisterStaff() {
  const [areas, setAreas] = useState([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    agency: '',
    unit_name: '',
    office_address: '',
    area_id: '',
    password: '',
  });

  const [proof, setProof] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Ambil daftar wilayah dari database
  useEffect(() => {
    api('/areas')
      .then((data) => setAreas(data.areas || []))
      .catch((err) => {
        setError(err.message || 'Gagal mengambil daftar wilayah.');
      });
  }, []);

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // Upload surat tugas
  const handleProofChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setProof(null);
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Format surat tugas harus PDF, JPG, atau PNG.');
      event.target.value = '';
      setProof(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran surat tugas maksimal 5 MB.');
      event.target.value = '';
      setProof(null);
      return;
    }

    setError('');
    setProof(file);
  };

  // Proses pengajuan akun pengelola
  const submit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (form.password.length < 8) {
      return setError('Kata sandi minimal 8 karakter.');
    }

    if (form.password !== confirmPassword) {
      return setError('Konfirmasi kata sandi tidak sama.');
    }

    if (!form.area_id) {
      return setError('Pilih wilayah tugas terlebih dahulu.');
    }

    if (!proof) {
      return setError('Unggah surat tugas atau SK penugasan terlebih dahulu.');
    }

    if (!accepted) {
      return setError(
        'Setujui Syarat & Ketentuan dan Kebijakan Privasi terlebih dahulu.'
      );
    }

    const body = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      body.append(key, value);
    });

    // Konfirmasi password hanya divalidasi di frontend
    // dan tidak dikirim sebagai field database.
    body.append('proof', proof);

    setBusy(true);

    try {
      const data = await api('/auth/register/petugas', {
        method: 'POST',
        body,
      });

      setSuccess(data.message);

      setForm({
        name: '',
        email: '',
        phone: '',
        agency: '',
        unit_name: '',
        office_address: '',
        area_id: '',
        password: '',
      });

      setConfirmPassword('');
      setProof(null);
      setAccepted(false);
      setShowPassword(false);
      setShowConfirmPassword(false);

      const fileInput = document.getElementById('staff-proof-input');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setError(err.message || 'Gagal mengirim pengajuan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page auth-page-v2 auth-register-page">

      {/* PANEL KIRI */}
      <AuthVisualPanel />

      {/* PANEL KANAN */}
      <section className="auth-form-side auth-register-side">
        <div className="auth-register-wrap">

          {/* HEADER */}
          <div className="auth-register-title">
            <h2>Buat akun pengelola</h2>
            <p>
              Daftar untuk menangani laporan warga di area tugasmu.
            </p>
          </div>

          {/* PILIH ROLE */}
          <div className="auth-register-role-switch">
            <Link to="/daftar">
              Warga
            </Link>

            <Link to="/daftar-pengelola" className="active">
              Pengelola
            </Link>
          </div>

          <form
            onSubmit={submit}
            className="form-stack auth-register-form"
          >

            {/* DATA PENGELOLA */}
            <section className="auth-register-section">

              <div className="auth-register-section-heading">
                <h3>Data pengelola</h3>
              </div>

              <div className="auth-register-grid">

                {/* NAMA */}
                <label className="auth-register-full">
                  Nama lengkap

                  <input
                    value={form.name}
                    onChange={(event) =>
                      update('name', event.target.value)
                    }
                    placeholder="Masukkan nama lengkapmu"
                    autoComplete="name"
                    maxLength={150}
                    required
                  />
                </label>

                {/* EMAIL */}
                <label>
                  Email dinas

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      update('email', event.target.value)
                    }
                    placeholder="nama@instansi.go.id"
                    autoComplete="email"
                    required
                  />
                </label>

                {/* NOMOR TELEPON */}
                <label>
                  No. telepon

                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      update('phone', event.target.value)
                    }
                    placeholder="08xxxxxxxxxx"
                    autoComplete="tel"
                    required
                  />
                </label>

                {/* INSTANSI */}
                <label>
                  Instansi

                  <input
                    value={form.agency}
                    onChange={(event) =>
                      update('agency', event.target.value)
                    }
                    placeholder="Nama instansi"
                    maxLength={150}
                    required
                  />
                </label>

                {/* UNIT KERJA */}
                <label>
                  Unit kerja

                  <input
                    value={form.unit_name}
                    onChange={(event) =>
                      update('unit_name', event.target.value)
                    }
                    placeholder="Nama unit kerja"
                    maxLength={150}
                    required
                  />
                </label>

                {/* ALAMAT KANTOR */}
                <label className="auth-register-full">
                  Alamat kantor

                  <input
                    value={form.office_address}
                    onChange={(event) =>
                      update('office_address', event.target.value)
                    }
                    placeholder="Masukkan alamat lengkap kantor"
                    autoComplete="street-address"
                    required
                  />
                </label>

                {/* PASSWORD */}
                <label>
                  Kata sandi

                  <div className="auth-register-password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      minLength={8}
                      value={form.password}
                      onChange={(event) =>
                        update('password', event.target.value)
                      }
                      placeholder="Minimal 8 karakter"
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      aria-label={
                        showPassword
                          ? 'Sembunyikan kata sandi'
                          : 'Tampilkan kata sandi'
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword
                        ? <Eye size={18} />
                        : <EyeOff size={18} />}
                    </button>
                  </div>
                </label>

                {/* KONFIRMASI PASSWORD */}
                <label>
                  Konfirmasi kata sandi

                  <div className="auth-register-password-field">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Ulangi kata sandi"
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      aria-label={
                        showConfirmPassword
                          ? 'Sembunyikan konfirmasi kata sandi'
                          : 'Tampilkan konfirmasi kata sandi'
                      }
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword
                        ? <Eye size={18} />
                        : <EyeOff size={18} />}
                    </button>
                  </div>
                </label>

              </div>
            </section>

            {/* SURAT TUGAS */}
            <section className="auth-register-section">

              <div className="auth-register-section-heading">
                <h3>Surat tugas / SK penugasan</h3>
              </div>

              <p className="auth-register-hint">
                Unggah dokumen resmi yang membuktikan penugasanmu
                sebagai pengelola wilayah.
              </p>

              <label className="upload-field auth-staff-upload">

                <UploadCloud size={27} aria-hidden="true" />

                <span>
                  <b>
                    {proof
                      ? 'Dokumen berhasil dipilih'
                      : 'Pilih atau seret berkas ke sini'}
                  </b>

                  <small>
                    {proof
                      ? proof.name
                      : 'PDF, JPG, atau PNG · Maksimal 5 MB'}
                  </small>
                </span>

                <input
                  id="staff-proof-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleProofChange}
                  required
                />
              </label>

              {proof && (
                <div className="auth-staff-file-info">
                  <FileCheck2 size={15} />
                  <span>
                    {(proof.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}

            </section>

            {/* AREA TUGAS */}
            <section className="auth-register-section">

              <div className="auth-register-section-heading">
                <h3>Area tugas</h3>
              </div>

              <p className="auth-register-hint">
                Pilih wilayah yang menjadi tanggung jawabmu.
                Laporan pada wilayah tersebut akan ditampilkan
                di dashboard pengelolamu.
              </p>

              <div className="auth-register-grid auth-staff-area-grid">

                <label className="auth-register-full">
                  Wilayah tugas

                  <CustomSelect
                    value={form.area_id}
                    onChange={(event) =>
                      update('area_id', event.target.value)
                    }
                    required
                  >
                    <option value="">Pilih desa/kelurahan</option>

                    {areas.map((area) => (
                      <option
                        key={area.area_id}
                        value={area.area_id}
                      >
                        {area.village_name} · {area.district_name} · {area.regency_name}
                      </option>
                    ))}
                  </CustomSelect>

                  <small>
                    Wilayah dipilih dari daftar area yang tersedia
                    pada LAPORMAS.
                  </small>
                </label>

              </div>

            </section>

            {/* INFORMASI VERIFIKASI */}
            <div className="notice info auth-staff-verification">
              <ShieldCheck size={18} aria-hidden="true" />

              <span>
                Akun pengelola akan aktif setelah pengajuan dan
                surat tugas diverifikasi oleh admin LAPORMAS.
              </span>
            </div>

            {/* PERSETUJUAN */}
            <label className="auth-register-consent">

              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) =>
                  setAccepted(event.target.checked)
                }
                required
              />

              <span>
                Saya menyetujui Syarat &amp; Ketentuan dan
                Kebijakan Privasi LAPORMAS.
              </span>

            </label>

            {/* PESAN */}
            {error && <Notice type="error">{error}</Notice>}
            {success && <Notice type="success">{success}</Notice>}

            {/* TOMBOL AJUKAN */}
            <button
              type="submit"
              className="btn btn-primary btn-block auth-register-submit"
              disabled={busy}
            >
              {busy
                ? 'Mengirim pengajuan...'
                : 'Ajukan Pendaftaran'}
            </button>

          </form>

          {/* LINK LOGIN */}
          <div className="auth-register-login">
            Sudah punya akun?
            {' '}
            <Link to="/masuk?role=pengelola">
              Masuk
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}

function SubmittedPage() {
  const { code } = useParams();
  const loc = useLocation();
  const report = loc.state?.report;
  return <PublicLayout>
    <main className="container submitted-wrap">
      <div className="success-mark"><Check size={38} /></div>
      <span className="eyebrow">LAPORAN BERHASIL DIKIRIM</span>
      <h1>Terima kasih sudah peduli.</h1>
      <p>Laporanmu sudah masuk ke LAPORMAS dan menunggu proses verifikasi.</p>
      <div className="report-code-box">
        <span>Nomor laporan</span>
        <strong>{code}</strong>
        <button className="text-link" onClick={() => navigator.clipboard?.writeText(code)}>Salin nomor</button>
      </div>
      {report?.area && <p className="muted">Lokasi terdeteksi di {report.area.village_name}, {report.area.district_name}.</p>}
      <div className="hero-actions centered">
        <Link to={`/lacak/${code}`} className="btn btn-primary">Lacak laporan <ArrowRight size={16} /></Link>
        <Link to="/warga" className="btn btn-outline">Ke dashboard</Link>
      </div>
    </main>
  </PublicLayout>;
}


function App() {
  return (
    <>
      {IS_DEMO_MODE && (
        <div className="demo-ribbon">
          <span className="demo-ribbon-dot" />
          Mode pratinjau frontend — data yang tampil adalah data contoh dan tersimpan di browser ini.
        </div>
      )}

      <Routes>
        {/* Halaman publik */}
        <Route path="/" element={<HomePage />} />
        <Route path="/laporan" element={<PublicReportsPage />} />
        <Route path="/laporan/:id" element={<PublicReportDetail />} />
        <Route path="/lacak/:code" element={<PublicReportDetail track />} />
        <Route path="/cara-melapor" element={<HowPage />} />
        <Route path="/tentang" element={<AboutPage />} />

        {/* Autentikasi */}
        <Route path="/masuk" element={<LoginPage />} />
        <Route path="/daftar" element={<RegisterCitizen />} />
        <Route path="/daftar-pengelola" element={<RegisterStaff />} />

        {/* Alur warga */}

        <Route
          path="/warga"
          element={
            <Protected roles={['warga']}>
              <CitizenDashboardPage />
            </Protected>
          }
        />

        <Route
          path="/warga/laporan"
          element={
            <Protected roles={['warga']}>
              <CitizenReportsPage />
            </Protected>
          }
        />

        <Route
          path="/laporan/buat"
          element={
            <Protected roles={['warga']}>
              <NewReportPageModule />
            </Protected>
          }
        />

        <Route
          path="/laporan-terkirim/:code"
          element={
            <Protected roles={['warga']}>
              <SubmittedPage />
            </Protected>
          }
        />

        <Route
          path="/warga/laporan/baru"
          element={
            <Protected roles={['warga']}>
              <Navigate to="/laporan/buat" replace />
            </Protected>
          }
        />

        <Route
          path="/warga/laporan/:id"
          element={
            <Protected roles={['warga']}>
              <PublicReportDetail />
            </Protected>
          }
        />

        <Route
          path="/warga/profil"
          element={
            <Protected roles={['warga']}>
              <ProfilePageModule />
            </Protected>
          }
        />

        {/* Alur pengelola */}
        <Route
          path="/pengelola"
          element={
            <Protected roles={['pengelola']}>
              <StaffDashboardPage />
            </Protected>
          }
        />
        <Route
          path="/pengelola/laporan"
          element={
            <Protected roles={['pengelola']}>
              <StaffReportsPage />
            </Protected>
          }
        />
        <Route
          path="/pengelola/laporan/:id"
          element={
            <Protected roles={['pengelola']}>
              <StaffReportDetailPage />
            </Protected>
          }
        />
        <Route
          path="/pengelola/laporan-publik"
          element={
            <Protected roles={['pengelola']}>
              <PengelolaPublicReportsPage />
            </Protected>
          }
        />
        <Route
          path="/pengelola/laporan-publik/:id"
          element={
            <Protected roles={['pengelola']}>
              <PublicReportDetail manager />
            </Protected>
          }
        />

        {/* Alur admin */}
        <Route
          path="/admin"
          element={
            <Protected roles={['admin']}>
              <AdminDashboardPage />
            </Protected>
          }
        />
        <Route
          path="/admin/laporan"
          element={
            <Protected roles={['admin']}>
              <AdminReportsPage />
            </Protected>
          }
        />
        <Route
          path="/admin/laporan/:id"
          element={
            <Protected roles={['admin']}>
              <StaffReportDetailPage admin />
            </Protected>
          }
        />
        <Route
          path="/admin/verifikasi"
          element={
            <Protected roles={['admin']}>
              <AdminStaffRequestsPage />
            </Protected>
          }
        />
        <Route
          path="/admin/pengguna"
          element={
            <Protected roles={['admin']}>
              <AdminUsersPage />
            </Protected>
          }
        />

        {/* Halaman tidak ditemukan */}
        <Route
          path="*"
          element={
            <PublicLayout>
              <main className="container section">
                <div className="empty-state">
                  <CircleHelp />
                  <b>Halaman tidak ditemukan</b>
                  <Link to="/" className="btn btn-primary">
                    Kembali ke beranda
                  </Link>
                </div>
              </main>
            </PublicLayout>
          }
        />
      </Routes>
    </>
  );
}
export default App;
