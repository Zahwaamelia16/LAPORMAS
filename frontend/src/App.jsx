import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboard';
import AdminReportsPage from './pages/admin/AdminReports';
import AdminStaffRequestsPage from './pages/admin/AdminStaffRequests';
import AdminUsersPage from './pages/admin/AdminUsers';

import CitizenDashboardPage from './pages/warga/WargaDashboard';
import CitizenReportsPage from './pages/warga/WargaReports';
import NewReportPageModule from './pages/warga/NewReportPage';
import ProfilePageModule from './pages/warga/ProfilePage';

import StaffDashboardPage from './pages/pengelola/PengelolaDashboard';
import StaffReportsPage from './pages/pengelola/PengelolaReports';
import StaffReportDetailPage from './pages/pengelola/PengelolaReportDetail';
import PengelolaPublicReportsPage from './pages/pengelola/PengelolaPublicReports';
import StaffLayout from './layouts/PengelolaLayout';
import PublicReportFilters from './pages/shared/PublicReportFilters';
import { usePublicReports } from './pages/shared/usePublicReports';
import ReportLocationMap from './components/ReportLocationMap';

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
  Lightbulb,
  LocateFixed,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Trees,
  UploadCloud,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { api, formatDate, getPosition, imageUrl, IS_DEMO_MODE } from './api';
import { useAuth } from './auth';

const DEMO_PHOTOS = {
  hero: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=85',
  road: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80',
  trash: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d9a?auto=format&fit=crop&w=900&q=80',
  light: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80',
  login: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1600&q=85',
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
        <p className="muted-light">Dari kepedulian warga, untuk area yang lebih baik.</p>
        <small>© 2026 LAPORMAS · Konsep final project · Bukan layanan darurat</small>
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
        <Link to="/" className="brand">
          LAPORMAS
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
          <NavLink to="/laporan" onClick={() => setOpen(false)}>
            Laporan publik
          </NavLink>
          <NavLink to="/cara-melapor" onClick={() => setOpen(false)}>
            Cara melapor
          </NavLink>
          <NavLink to="/tentang" onClick={() => setOpen(false)}>
            Tentang kami
          </NavLink>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <Link className="nav-user" to={dashboardPath}>
                <UserRound size={16} aria-hidden="true" />
                {user.name?.split(' ')[0] || 'Akun'}
              </Link>

              {user.role === 'warga' && (
                <Link to="/laporan/buat" className="btn btn-primary btn-small">
                  Buat laporan
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
              <Link to="/masuk" className="nav-login">
                Masuk
              </Link>
              <Link to="/laporan/buat" className="btn btn-primary btn-small">
                Buat laporan
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
function PublicLayout({ children }) {
  return <><PublicNav />{children}<Footer /></>;
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
  const [stats, setStats] = useState({ total: 0, completed: 0, rate: 0, areas: 0 });
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('Semua laporan');
  const [code, setCode] = useState('');
  const [tracked, setTracked] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [faq, setFaq] = useState(0);
  useEffect(() => {
    api('/stats').then((d) => setStats(d.stats)).catch(() => { });
    api('/reports').then((d) => setReports(d.reports)).catch(() => { });
  }, []);
  const displayed = (status === 'Semua laporan' ? reports : reports.filter((r) => r.status_name === status)).slice(0, 3);
  const track = async (e) => {
    e.preventDefault();
    setTrackError('');
    setTracked(null);
    if (!code.trim()) return setTrackError('Masukkan nomor laporan terlebih dahulu.');
    try {
      const d = await api(`/reports/track/${encodeURIComponent(code.trim())}`);
      setTracked(d.report);
    }
    catch (err) {
      setTrackError(err.message);
    }
  };
  const faqs = [
    ['Masalah apa saja yang bisa dilaporkan?', 'Kamu bisa melaporkan masalah infrastruktur, kebersihan, penerangan, drainase, pohon tumbang, dan kerusakan fasilitas umum di wilayah yang terdaftar.'],
    ['Apakah identitas pelapor ditampilkan ke publik?', 'Tidak. Nama, nomor telepon, dan email pelapor tidak ditampilkan pada halaman laporan publik.'],
    ['Bagaimana cara memantau laporan saya?', 'Gunakan nomor laporan yang diterima setelah pengiriman. Kamu juga dapat melihat riwayat penanganan melalui dashboard akun.'],
    ['Apakah LAPORMAS untuk keadaan darurat?', 'Bukan. Untuk kondisi yang mengancam keselamatan, segera hubungi layanan darurat atau instansi setempat.'],
  ];
  return <PublicLayout>
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">RUANG WARGA, PERUBAHAN NYATA</span>
            <h1>Lingkungan lebih baik, dimulai dari laporanmu.</h1>
            <p>Sampaikan masalah di sekitarmu. LAPORMAS membantu meneruskan laporan ke pihak terkait dan memantau penyelesaiannya secara terbuka.</p>
            <div className="hero-actions">
              <Link to="/laporan/buat" className="btn btn-primary">Buat laporan <ArrowRight size={17} /></Link>
              <a href="#lacak" className="btn btn-outline">Lacak laporan</a>
            </div>
            <small>Mudah dilaporkan. Transparan dipantau.</small>
          </div>
          <div className="hero-visual"><img src={DEMO_PHOTOS.hero} alt="Lingkungan permukiman hijau" /><div className="hero-caption"><span className="tiny-label">SELESAI</span><b>Perubahan kecil. Dampak bersama.</b><small>Lingkungan yang nyaman adalah hak setiap warga.</small></div></div>
        </div>
      </section>
      <section className="stats-band">
        <div className="container">
          <div className="eyebrow light-eyebrow">BERSAMA WARGA, UNTUK LINGKUNGAN · DATA TERKINI</div>
          <div className="stats-grid">
            <div>
              <strong>{stats.total.toLocaleString('id-ID')}</strong>
              <span>Laporan diterima</span>
            </div>
            <div>
              <strong>{stats.completed.toLocaleString('id-ID')}</strong>
              <span>Laporan diselesaikan</span>
            </div>
            <div>
              <strong>{stats.rate}%</strong>
              <span>Tingkat penyelesaian</span>
            </div>
            <div>
              <strong>{stats.areas}</strong>
              <span>Area terjangkau</span>
            </div>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">KENALI KATEGORINYA</span>
            <h2>Apa yang ingin kamu laporkan?</h2>
            <p>Pilih kategori yang paling sesuai dengan masalah di sekitarmu.</p>
          </div>
        </div>
        <div className="category-grid">{[
          {
            number: '01 /',
            title: 'Infrastruktur',
            description: 'Jalan, trotoar, dan fasilitas umum',
            Icon: Building2,
          },
          {
            number: '02 /',
            title: 'Kebersihan',
            description: 'Sampah dan kebersihan area',
            Icon: Trash2,
          },
          {
            number: '03 /',
            title: 'Penerangan',
            description: 'Lampu jalan dan area publik',
            Icon: Lightbulb,
          },
          {
            number: '04 /',
            title: 'Drainase',
            description: 'Saluran air dan genangan',
            Icon: Droplets,
          },
        ].map(({ number, title, description, Icon }) => (
          <Link
            to={`/laporan/buat?category=${encodeURIComponent(title)}`}
            className="category-card"
            key={title}
          >
            <span>{number}</span>
            <div className="category-icon">
              <Icon size={25} strokeWidth={1.9} aria-hidden="true" />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
            <b>
              Laporkan <ArrowUpRight size={14} aria-hidden="true" />
            </b>
          </Link>
        ))}</div>
      </section>
      <section className="steps-section">
        <div className="container">
          <span className="eyebrow">PROSES YANG TRANSPARAN</span>
          <h2>Dari laporan menjadi tindakan nyata</h2>
          <p>Tiga langkah sederhana untuk ikut merawat lingkungan.</p>
          <div className="steps-grid">
            <div>
              <strong>01</strong>
              <h3>Ceritakan masalahnya</h3>
              <p>Isi detail kejadian, deteksi lokasi, dan sertakan foto pendukung.</p>
            </div>
            <div>
              <strong>02</strong>
              <h3>Kami teruskan laporannya</h3>
              <p>Laporan diverifikasi dan diteruskan ke pihak yang menangani.</p>
            </div>
            <div>
              <strong>03</strong>
              <h3>Pantau sampai selesai</h3>
              <p>Lihat perkembangan dan tanggapi hasil penanganan laporanmu.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="section container"><div className="section-heading split"><div><span className="eyebrow">SUARA DARI LINGKUNGAN</span><h2>Laporan terbaru dari warga</h2><p>Setiap laporan adalah langkah menuju lingkungan yang lebih nyaman.</p></div><Link to="/laporan" className="text-link">Lihat semua <ArrowRight size={15} /></Link></div><div className="filter-pills">{['Semua laporan', 'Diterima', 'Diproses', 'Selesai'].map((s) => <button key={s} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>{s}</button>)}</div><ReportCards reports={displayed} /><p className="caption-note">Contoh laporan dan data akan mengikuti laporan yang tersimpan di database.</p></section>
      <section className="track-section" id="lacak">
        <div className="container track-grid">
          <div>
            <span className="eyebrow">PANTAU PERKEMBANGAN</span>
            <h2>Sudah membuat laporan?</h2>
            <p>Masukkan nomor laporan untuk melihat status dan riwayat penanganannya.</p>
          </div>
          <div>
            <form className="track-form" onSubmit={track}>
              <label htmlFor="track-code">Nomor laporan</label>
              <div><input id="track-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: LPM-2026-001248" /><button className="btn btn-primary" type="submit">Lacak</button></div>
            </form>
            {trackError && <p className="form-error">{trackError}</p>}
            {tracked && <TrackSummary report={tracked} />}
          </div>
        </div>
      </section>
      <section className="section container faq-section">
        <div>
          <span className="eyebrow">PUSAT BANTUAN</span>
          <h2>Ada yang ingin kamu tanyakan?</h2>
          <p>Temukan jawaban sebelum membuat laporan pertamamu.</p>
          <a href="mailto:bantuan@lapormas.id" className="text-link">Hubungi bantuan <ArrowRight size={15} /></a>
        </div>
        <div className="faq-list">{faqs.map((f, i) => <button key={f[0]} className={faq === i ? 'faq-item open' : 'faq-item'} onClick={() => setFaq(faq === i ? -1 : i)}><span><b>{f[0]}</b>{faq === i && <p>{f[1]}</p>}</span>{faq === i ? <X size={17} /> : <Plus size={17} />}</button>)}</div>
      </section>
      <section className="cta-strip">
        <div className="container">
          <div>
            <h2>Jangan biarkan masalah terlewat.</h2>
            <p>Satu laporanmu bisa membawa perubahan untuk banyak orang.</p>
          </div>
          <Link to="/laporan/buat" className="btn btn-primary">Mulai laporkan <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  </PublicLayout>;
}

function ReportCards({ reports = [] }) {
  if (!reports.length) {
    return (
      <div className="empty-state compact">
        <FileCheck2 size={28} />
        <b>Belum ada laporan yang ditampilkan</b>
        <span>Laporan akan muncul di sini setelah tersedia.</span>
      </div>
    );
  }

  return (
    <div className="report-grid">
      {reports.map((report, index) => {
        const reportImage = report.image_url || report.images?.[0]?.image_url;
        const fallbackImages = [DEMO_PHOTOS.road, DEMO_PHOTOS.trash, DEMO_PHOTOS.light];
        const imageSource = reportImage
          ? imageUrl(reportImage)
          : fallbackImages[index % fallbackImages.length];

        return (
          <article className="report-card" key={report.report_id}>
            <div className="report-thumb">
              <img
                src={imageSource}
                alt={reportImage ? 'Foto laporan' : 'Ilustrasi laporan'}
              />
              <Status value={report.status_name} />
            </div>

            <div className="report-card-body">
              <div className="report-location">
                <MapPin size={13} aria-hidden="true" />
                {[report.village_name, report.district_name].filter(Boolean).join(', ')}
              </div>
              <h3>{report.title}</h3>
              <p>{report.category_name} · {formatDate(report.created_at)}</p>
              <Link
                to={`/laporan/${report.report_id}`}
                className="btn btn-outline btn-small"
              >
                Lihat detail <ArrowRight size={14} aria-hidden="true" />
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
  const { reports, areas, categories, statuses, filters, setFilters, resetFilters, loading } = usePublicReports();
  return <PublicLayout>
    <PageIntro eyebrow="TRANSPARANSI LAPORAN" title="Laporan publik" subtitle="Pantau masalah dan proses penanganannya di berbagai wilayah.">
      <div className="intro-meta">
        <span><ShieldCheck size={15} /> Identitas pelapor dirahasiakan</span>
        <span><GlobeIcon /> Semua wilayah</span>
      </div>
    </PageIntro>
    <main className="container section public-listing">
      <PublicReportFilters areas={areas} categories={categories} statuses={statuses} filters={filters} setFilters={setFilters} onReset={resetFilters} />
      <div className="listing-heading">
        <div>
          <h2>Daftar laporan</h2>
          <p>{reports.length} laporan ditemukan</p>
        </div>
        <Link to="/laporan/buat" className="btn btn-primary">Buat laporan <Plus size={16} /></Link>
      </div>
      {loading ? <div className="screen-loading">Memuat laporan...</div> : <ReportCards reports={reports} />}
    </main>
  </PublicLayout>;
}
function GlobeIcon() {
  return <MapPin size={15} />;
}

function PublicReportDetail({ track = false, manager = false }) {
  const { id, code } = useParams();
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
        <PageIntro
          eyebrow="DETAIL LAPORAN"
          title={report?.title || 'Detail laporan'}
          subtitle={subtitle}
        />
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
  return (
    <PublicLayout>
      <PageIntro
        eyebrow="PANDUAN LAPORAN"
        title="Cara melapor"
        subtitle="Ikuti tiga langkah sederhana untuk menyampaikan masalah di lingkunganmu."
      />

      <main className="container section">
        <div className="how-cards">
          <div>
            <span>01</span>
            <FilePlus2 />
            <h2>Buat laporan</h2>
            <p>
              Masuk sebagai warga, isi judul, kategori, deskripsi, dan alamat kejadian.
              Lokasi kejadian akan dideteksi melalui GPS perangkat.
            </p>
          </div>
          <div>
            <span>02</span>
            <ShieldCheck />
            <h2>Verifikasi laporan</h2>
            <p>
              Laporan masuk ke sistem untuk diverifikasi. Pengelola sesuai area kejadian
              dapat melihat dan menindaklanjutinya.
            </p>
          </div>
          <div>
            <span>03</span>
            <Clock3 />
            <h2>Pantau perkembangan</h2>
            <p>
              Gunakan nomor laporan atau dashboard akun untuk mengikuti perubahan
              status sampai penanganan selesai.
            </p>
          </div>
        </div>

        <div className="notice info">
          <AlertTriangle aria-hidden="true" />
          <span>
            LAPORMAS bukan layanan darurat. Untuk kondisi yang mengancam keselamatan,
            hubungi layanan darurat atau instansi setempat.
          </span>
        </div>

        <Link className="btn btn-primary" to="/laporan/buat">
          Mulai buat laporan <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </main>
    </PublicLayout>
  );
}
function AboutPage() {
  return (
    <PublicLayout>
      <PageIntro
        eyebrow="TENTANG KAMI"
        title="Ruang warga, perubahan nyata"
        subtitle="LAPORMAS adalah konsep layanan digital untuk membantu warga menyampaikan masalah lingkungan dan membantu pengelola menanganinya berdasarkan wilayah."
      />

      <main className="container section about-grid">
        <div className="about-visual">
          <Trees size={76} />
          <span>LAPORMAS</span>
          <small>Layanan Pelaporan & Resolusi Masalah Area</small>
        </div>

        <div>
          <span className="eyebrow">TUJUAN KAMI</span>
          <h2>Lingkungan yang nyaman dimulai dari kepedulian bersama.</h2>
          <p>
            Warga dapat melaporkan masalah di berbagai wilayah, memantau progres
            penanganan, dan melihat laporan publik. Pengelola menangani laporan
            sesuai area tugasnya, sedangkan admin memantau keseluruhan sistem.
          </p>

          <div className="value-row">
            <HeartHandshake />
            <div>
              <b>Terbuka dan kolaboratif</b>
              <span>Informasi laporan dapat dipantau tanpa membuka data pribadi pelapor.</span>
            </div>
          </div>

          <div className="value-row">
            <MapPin />
            <div>
              <b>Berbasis wilayah</b>
              <span>Lokasi kejadian digunakan untuk menentukan area dan pengelola yang menangani.</span>
            </div>
          </div>

          <div className="value-row">
            <ShieldCheck />
            <div>
              <b>Menjaga privasi</b>
              <span>Identitas dan kontak pelapor tidak ditampilkan pada laporan publik.</span>
            </div>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}
function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedRole = new URLSearchParams(location.search).get('role');
  const [role, setRole] = useState(requestedRole === 'admin' ? 'admin' : requestedRole === 'pengelola' ? 'pengelola' : 'warga');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (user) navigate(getDashboardPath(user.role), { replace: true });
  }, [user, navigate]);
  const chooseRole = (nextRole) => {
    setRole(nextRole);
    setError('');
    setPassword('');
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await login({ identifier: identifier.trim(), password, role });
      const defaultPath = getDashboardPath(data.user.role);
      const requestedPath = location.state?.from;
      navigate(requestedPath && data.user.role === 'warga' && requestedPath.startsWith('/laporan') ? requestedPath : defaultPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Email atau kata sandi belum sesuai.');
    }
    finally {
      setBusy(false);
    }
  };
  return <div className="auth-page">
    <section className="auth-visual" style={{ backgroundImage: `linear-gradient(0deg,rgba(10,65,38,.88),rgba(11,88,44,.74)),url(${DEMO_PHOTOS.login})` }}>
      <Link to="/" className="brand brand-light">LAPORMAS</Link>
      <div className="auth-visual-copy">
        <span className="auth-kicker">RUANG WARGA, PERUBAHAN NYATA</span>
        <h1>Lingkungan sehat dimulai dari sini</h1>
        <p>Platform pelaporan masalah lingkungan yang memudahkan warga dan pengelola bekerja sama menjaga kenyamanan bersama.</p>
      </div>
      <div className="auth-stats">
        <div>
          <b>124</b>
          <span>Laporan masuk</span>
        </div>
        <div>
          <b>98</b>
          <span>Terselesaikan</span>
        </div>
        <div>
          <b>2.400</b>
          <span>Warga terbantu</span>
        </div>
      </div>
    </section>
    <section className="auth-form-side">
      <div className="auth-form-wrap">
        <Link to="/" className="back-link"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke beranda</Link>
        <span className="eyebrow">AKSES LAPORMAS</span>
        <h2>Selamat Datang</h2>
        <p>Laporkan masalah di lingkunganmu dan pantau penyelesaiannya.</p>
        {role === 'admin' ? (
          <div className="admin-login-label">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>Masuk sebagai Administrator</span>
            <button type="button" onClick={() => chooseRole('warga')}>
              Ganti role
            </button>
          </div>
        ) : (
          <div className="role-switch" aria-label="Pilih jenis akun">
            {[
              { value: 'warga', label: 'Warga', Icon: UserRound },
              { value: 'pengelola', label: 'Pengelola', Icon: Users },
            ].map(({ value, label, Icon }) => (
              <button
                type="button"
                key={value}
                className={role === value ? 'active' : ''}
                onClick={() => chooseRole(value)}
                aria-pressed={role === value}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="form-stack">
          <label>Email / No. Telepon<input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder={role === 'pengelola' ? 'pengelola@lapormas.id' : 'nama@email.com'} autoComplete="username" required /></label>
          <label>Kata Sandi<div className="password-field"><input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan kata sandi" autoComplete="current-password" required /><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <div className="form-between">
            <span></span>
            <button type="button" className="plain-link" onClick={() => setError('Fitur pemulihan kata sandi belum dihubungkan. Silakan hubungi administrator LAPORMAS untuk bantuan akun.')}>Lupa kata sandi?</button>
          </div>
          {error && <Notice type="error">{error}</Notice>}
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Memproses...' : 'Masuk'}</button>
        </form>
        {role === 'warga' ? <div className="auth-signup">Belum punya akun? <Link to="/daftar">Daftar sebagai warga</Link></div> : role === 'pengelola' ? <div className="auth-signup">Belum punya akun pengelola? <Link to="/daftar-pengelola">Ajukan pendaftaran</Link></div> : <div className="auth-signup">Akun admin dibuat khusus dan tidak tersedia melalui pendaftaran publik.</div>}
        {IS_DEMO_MODE && <div className="demo-credentials">
          <b>Akun pratinjau</b>
          <span>Warga: warga@lapormas.id</span>
          <span>Pengelola: pengelola@lapormas.id</span>
          <span>Admin: admin@lapormas.id</span>
          <small>Gunakan kata sandi apa saja untuk mencoba tampilan demo.</small>
        </div>}
        {role !== 'admin' && <button type="button" className="admin-entry" onClick={() => chooseRole('admin')}>Masuk sebagai admin</button>}
        <div className="auth-footnote">Dengan masuk, kamu menyetujui kebijakan privasi LAPORMAS.</div>
      </div>
    </section>
  </div>;
}

function RegisterCitizen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [position, setPosition] = useState(null);
  const [locState, setLocState] = useState('idle');
  const [locMessage, setLocMessage] = useState('Lokasi wajib dideteksi melalui GPS perangkat.');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const update = (k, v) => setForm(o => ({ ...o, [k]: v }));
  const detect = async () => {
    setLocState('loading');
    setLocMessage('Sedang mendeteksi lokasi GPS...');
    setError('');
    try {
      const p = await getPosition();
      setPosition(p);
      setLocState('done');
      setLocMessage(`Lokasi berhasil dideteksi (akurasi ±${Math.round(p.accuracy)} meter).`);
    } catch (e) {
      setPosition(null);
      setLocState('error');
      setLocMessage(e.message);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!position) return setError('Deteksi lokasi GPS terlebih dahulu sebelum mendaftar.');
    setBusy(true);
    try {
      const d = await api('/auth/register/warga', { method: 'POST', body: { ...form, ...position } });
      setSuccess(d.message);
      setTimeout(() => navigate('/masuk'), 1800);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return <div className="auth-simple">
    <Link to="/" className="brand">LAPORMAS</Link>
    <div className="auth-card register-card">
      <Link to="/masuk" className="back-link"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke masuk</Link>
      <span className="eyebrow">AKUN WARGA</span>
      <h1>Buat akun warga</h1>
      <p>Daftarkan dirimu agar bisa melaporkan masalah lingkungan di berbagai wilayah.</p>
      <form onSubmit={submit} className="form-stack">
        <div className="field-grid">
          <label>Nama lengkap<input value={form.name} onChange={e => update('name', e.target.value)} required /></label>
          <label>Email<input type="email" value={form.email} onChange={e => update('email', e.target.value)} required /></label>
          <label>Nomor telepon<input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} required /></label>
          <label>Alamat tempat tinggal<input value={form.address} onChange={e => update('address', e.target.value)} required /></label>
        </div>
        <div className={`location-box ${locState}`}>
          <div><LocateFixed /><div><b>Lokasi pendaftaran</b><span>{locMessage}</span>{position && <small>Lat {position.latitude.toFixed(6)} · Long {position.longitude.toFixed(6)}</small>}</div></div>
          <button type="button" className="btn btn-outline btn-small" onClick={detect} disabled={locState === 'loading'}>{locState === 'loading' ? 'Mendeteksi...' : 'Deteksi lokasi'}</button>
        </div>
        <label>Kata sandi<input type="password" minLength="8" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Minimal 8 karakter" required /></label>
        {error && <Notice type="error">{error}</Notice>}
        {success && <Notice type="success">{success}</Notice>}
        <button className="btn btn-primary btn-block" disabled={busy || !position}>{busy ? 'Membuat akun...' : 'Daftar sebagai warga'}</button>
      </form>
      <div className="auth-signup">Sudah punya akun? <Link to="/masuk">Masuk</Link></div>
    </div>
  </div>;
}

function RegisterStaff() {
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', agency: '', unit_name: '', office_address: '', area_id: '', password: '' });
  const [proof, setProof] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    api('/areas').then(d => setAreas(d.areas)).catch(() => { });
  }, []);
  const update = (k, v) => setForm(o => ({ ...o, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!proof) return setError('Unggah bukti penugasan terlebih dahulu.');
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    body.append('proof', proof);
    setBusy(true);
    try {
      const d = await api('/auth/register/petugas', { method: 'POST', body });
      setSuccess(d.message);
      setForm({ name: '', email: '', phone: '', agency: '', unit_name: '', office_address: '', area_id: '', password: '' });
      setProof(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return <div className="auth-simple">
    <Link to="/" className="brand">LAPORMAS</Link>
    <div className="auth-card register-card wide">
      <Link to="/masuk?role=pengelola" className="back-link"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke masuk</Link>
      <span className="eyebrow">PENGAJUAN AKUN</span>
      <h1>Daftar sebagai pengelola</h1>
      <p>Pengajuan akan diperiksa admin. Akses pengelola diberikan setelah penugasan disetujui.</p>
      <form onSubmit={submit} className="form-stack">
        <div className="field-grid">
          <label>Nama lengkap<input value={form.name} onChange={e => update('name', e.target.value)} required /></label>
          <label>Email dinas<input type="email" value={form.email} onChange={e => update('email', e.target.value)} required /></label>
          <label>Nomor telepon<input value={form.phone} onChange={e => update('phone', e.target.value)} required /></label>
          <label>Instansi<input value={form.agency} onChange={e => update('agency', e.target.value)} required /></label>
          <label>Unit kerja<input value={form.unit_name} onChange={e => update('unit_name', e.target.value)} required /></label>
          <label>Wilayah tugas<select value={form.area_id} onChange={e => update('area_id', e.target.value)} required><option value="">Pilih desa/kelurahan</option>{areas.map(a => <option key={a.area_id} value={a.area_id}>{a.village_name} · {a.district_name} · {a.regency_name}</option>)}</select></label>
          <label className="span-two">Alamat kantor<input value={form.office_address} onChange={e => update('office_address', e.target.value)} required /></label>
          <label className="span-two">Kata sandi<input type="password" minLength="8" value={form.password} onChange={e => update('password', e.target.value)} required /></label>
        </div>
        <label className="upload-field"><UploadCloud /><span><b>Bukti penugasan</b><small>{proof ? proof.name : 'Unggah surat tugas atau dokumen resmi (JPG/PNG/WEBP, maks. 5 MB)'}</small></span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {
          const file = e.target.files?.[0] || null;
          if (file && file.size > 5 * 1024 * 1024) {
            setError('Ukuran bukti penugasan maksimal 5 MB.');
            e.target.value = '';
            setProof(null);
            return;
          }
          setError('');
          setProof(file);
        }} required /></label>
        {error && <Notice type="error">{error}</Notice>}
        {success && <Notice type="success">{success}</Notice>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Mengirim pengajuan...' : 'Kirim pengajuan'}</button>
      </form>
      <div className="auth-signup">Sudah disetujui? <Link to="/masuk?role=pengelola">Masuk sebagai pengelola</Link></div>
    </div>
  </div>;
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
