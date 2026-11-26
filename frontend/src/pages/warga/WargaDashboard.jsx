
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FilePlus2,
  FileText,
  Image as ImageIcon,
  MapPin,
  Search,
} from 'lucide-react';

import CustomSelect from '../../components/CustomSelect';
import { api, formatDate, imageUrl } from '../../api';
import { useAuth } from '../../auth';
import CitizenLayout from '../../layouts/WargaLayout';

// Urutan status yang ditampilkan pada timeline
const STATUS_ORDER = [
  'Menunggu',
  'Diverifikasi',
  'Diproses',
  'Selesai',
];

const STATUS_TABS = [
  'Semua',
  'Menunggu',
  'Diverifikasi',
  'Diproses',
  'Selesai',
];

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function StatusBadge({ value }) {
  const status = value || 'Menunggu';
  const key = normalizeStatus(status).replaceAll(' ', '-');

  return (
    <span className={`status status-${key} citizen-status`}>
      {status}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="citizen-hero-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getLatestUpdate(report) {
  const updates = report.updates || [];

  if (!updates.length) return null;

  return [...updates].sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  )[0];
}

function getLatestActivityDate(report) {
  const update = getLatestUpdate(report);
  return update?.updated_at || report.created_at;
}


function timeAgo(value) {
  const date = new Date(value);
  const diff = Math.max(0, Date.now() - date.getTime());

  if (Number.isNaN(date.getTime())) return '';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 30) return `${days} hari lalu`;

  return formatDate(value);
}

function getReportNote(report) {
  const latestUpdate = getLatestUpdate(report);

  if (latestUpdate?.notes) {
    return latestUpdate.notes;
  }

  if (report.status_name === 'Menunggu') {
    return 'Laporan diterima dan sedang menunggu verifikasi petugas.';
  }

  return `Laporan saat ini berstatus ${report.status_name || 'Menunggu'}.`;
}

// Timeline perkembangan penanganan laporan
function ReportTimeline({ report }) {
  const updates = [...(report.updates || [])].sort(
    (a, b) => new Date(a.updated_at) - new Date(b.updated_at)
  );

  const currentIndex = STATUS_ORDER.findIndex(
    (status) => normalizeStatus(status) === normalizeStatus(report.status_name)
  );

  const updateDates = {};

  updates.forEach((update) => {
    const key = normalizeStatus(update.new_status);
    updateDates[key] = update.updated_at;
  });

  return (
    <div className="citizen-timeline">
      {STATUS_ORDER.map((status, index) => {
        const reached = currentIndex >= index;
        const date =
          index === 0
            ? report.created_at
            : updateDates[normalizeStatus(status)];

        return (
          <div
            key={status}
            className={`citizen-timeline-step ${
              reached ? 'is-reached' : ''
            } ${currentIndex === index ? 'is-current' : ''}`}
          >
            <div className="citizen-timeline-marker">
              {reached ? <CheckCircle2 size={15} /> : <span />}
            </div>

            <b>{status}</b>
            <span>{date ? formatDate(date) : '—'}</span>
          </div>
        );
      })}
    </div>
  );
}

// Kartu setiap laporan warga
function CitizenReportCard({ report }) {
  const images = Array.isArray(report.images) ? report.images : [];
  const firstImage = images[0]?.image_url;

  const location = [
    report.village_name,
    report.district_name,
  ].filter(Boolean).join(', ');

  return (
    <article className="citizen-report-card">
      <div className="citizen-report-media">
        {firstImage ? (
          <img
            src={imageUrl(firstImage)}
            alt={`Foto laporan ${report.title}`}
          />
        ) : (
          <div className="citizen-report-placeholder">
            <ImageIcon size={31} />
            <b>Foto belum tersedia</b>
            <span>{report.category_name || 'Laporan warga'}</span>
          </div>
        )}

        {images.length > 0 && (
          <span className="citizen-image-count">
            <ImageIcon size={13} />
            {images.length} foto
          </span>
        )}
      </div>

      <div className="citizen-report-content">
        <div className="citizen-report-topline">
          <div className="citizen-report-identity">
            <span className="citizen-report-category-icon">
              <FileText size={16} />
            </span>

            <div>
              <span className="citizen-report-category">
                {report.category_name || 'Umum'}
              </span>
              <span className="citizen-report-code">
                {report.report_code || `LPM-${report.report_id}`}
              </span>
            </div>
          </div>

          <StatusBadge value={report.status_name} />
        </div>

        <h3>
          <Link to={`/warga/laporan/${report.report_id}`}>
            {report.title}
          </Link>
        </h3>

        <p className="citizen-report-description">
          {report.description || 'Tidak ada deskripsi laporan.'}
        </p>

        <div className="citizen-report-note">
          <b>Catatan petugas</b>
          <p>{getReportNote(report)}</p>
        </div>

        <ReportTimeline report={report} />

        <div className="citizen-report-footer">
          <div className="citizen-report-meta">
            <span>
              <MapPin size={14} />
              {location || report.location || 'Lokasi tidak tersedia'}
            </span>

            <span>
              Dilaporkan {formatDate(report.created_at)}
            </span>
          </div>

          <Link
            to={`/warga/laporan/${report.report_id}`}
            className="citizen-detail-link"
          >
            Lihat detail <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

// Dashboard utama warga
export default function CitizenDashboardPage() {
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const [activeStatus, setActiveStatus] = useState('Semua');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(4);

  // Mengambil laporan milik warga yang sedang login
  useEffect(() => {
    let active = true;

    api('/reports/mine')
      .then((data) => {
        if (active) {
          setReports(data.reports || []);
          setError('');
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Gagal memuat laporan.');
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Menghitung jumlah laporan berdasarkan status
  const counts = useMemo(() => {
    const result = {
      total: reports.length,
      Menunggu: 0,
      Diverifikasi: 0,
      Diproses: 0,
      Selesai: 0,
    };

    reports.forEach((report) => {
      const status = STATUS_ORDER.find(
        (item) =>
          normalizeStatus(item) === normalizeStatus(report.status_name)
      );

      if (status) result[status] += 1;
    });

    return result;
  }, [reports]);

  // Daftar kategori yang tersedia berdasarkan laporan warga
  const categories = useMemo(() => {
    return [
      ...new Set(
        reports.map((report) => report.category_name).filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, 'id'));
  }, [reports]);

  // Laporan dengan aktivitas paling baru
  const latestReport = useMemo(() => {
    if (!reports.length) return null;

    return [...reports].sort(
      (a, b) =>
        new Date(getLatestActivityDate(b)) -
        new Date(getLatestActivityDate(a))
    )[0];
  }, [reports]);

  const latestUpdate = latestReport
    ? getLatestUpdate(latestReport)
    : null;

  // Filter laporan berdasarkan status, kategori, dan pencarian
  const filteredReports = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesStatus =
        activeStatus === 'Semua' ||
        normalizeStatus(report.status_name) === normalizeStatus(activeStatus);

      const matchesCategory =
        !categoryFilter || report.category_name === categoryFilter;

      const matchesSearch =
        !keyword ||
        [
          report.title,
          report.report_code,
          report.description,
          report.category_name,
        ].some((value) =>
          String(value || '').toLowerCase().includes(keyword)
        );

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [reports, activeStatus, categoryFilter, searchQuery]);

  const visibleReports = filteredReports.slice(0, visibleCount);

  const changeStatus = (status) => {
    setActiveStatus(status);
    setVisibleCount(4);
  };

  const changeCategory = (event) => {
    setCategoryFilter(event.target.value);
    setVisibleCount(4);
  };

  const changeSearch = (event) => {
    setSearchQuery(event.target.value);
    setVisibleCount(4);
  };

  return (
    <CitizenLayout
      title="Dashboard saya"
      subtitle={`Halo ${user?.name?.split(' ')[0] || 'Warga'}! Pantau laporan yang pernah kamu kirim dan ikuti perkembangan penanganannya`}
      heroContent={
        <div className="citizen-hero-stats">
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Menunggu" value={counts.Menunggu} />
          <StatCard label="Diverifikasi" value={counts.Diverifikasi} />
          <StatCard label="Diproses" value={counts.Diproses} />
          <StatCard label="Selesai" value={counts.Selesai} />
        </div>
      }
    >
      {/* Perkembangan laporan terbaru */}
      {latestReport && (
        <section className="citizen-latest-update">
          <div className="citizen-update-icon">
            <Bell size={19} />
          </div>

          <div className="citizen-update-content">
            <b>
              Laporan {latestReport.report_code || `LPM-${latestReport.report_id}`}
              {' '}
              {latestReport.status_name === 'Diproses'
                ? 'sedang diproses'
                : `berstatus ${(latestReport.status_name || 'Menunggu').toLowerCase()}`}
            </b>

            <p>
              {latestUpdate?.notes ||
                `Laporan saat ini berstatus ${latestReport.status_name || 'Menunggu'}`}
            </p>

            <small>
              {timeAgo(getLatestActivityDate(latestReport))}
            </small>
          </div>

          <Link
            to={`/warga/laporan/${latestReport.report_id}`}
            className="citizen-update-link"
          >
            Lihat detail <ArrowRight size={14} />
          </Link>
        </section>
      )}

      {/* Riwayat laporan */}
      <section className="citizen-history">
        <div className="citizen-history-heading">
          <div>
            <h2>Riwayat laporanku</h2>
            <p>
              Menampilkan {visibleReports.length} dari {filteredReports.length} laporan
            </p>
          </div>

          <div className="citizen-history-search">
            <Search size={16} />
            <input
              type="search"
              value={searchQuery}
              onChange={changeSearch}
              placeholder="Cari judul atau nomor laporan"
              aria-label="Cari laporan"
            />
          </div>
        </div>

        <div className="citizen-history-filters">
          <div className="citizen-status-tabs">
            {STATUS_TABS.map((status) => {
              const count =
                status === 'Semua'
                  ? reports.length
                  : counts[status] || 0;

              return (
                <button
                  type="button"
                  key={status}
                  className={activeStatus === status ? 'active' : ''}
                  onClick={() => changeStatus(status)}
                >
                  {status} <span>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="citizen-category-filter">
            <CustomSelect
              value={categoryFilter}
              onChange={changeCategory}
              placeholder="Semua kategori"
            >
              <option value="">Semua kategori</option>

              {categories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </CustomSelect>
          </div>
        </div>

        {busy ? (
          <div className="citizen-loading">
            Memuat riwayat laporan...
          </div>
        ) : error ? (
          <div className="citizen-empty-state">
            <FilePlus2 size={30} />
            <b>Gagal memuat laporan</b>
            <span>{error}</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="citizen-empty-state">
            <FilePlus2 size={31} />

            <b>
              {reports.length === 0
                ? 'Belum ada laporan'
                : 'Laporan tidak ditemukan'}
            </b>

            <span>
              {reports.length === 0
                ? 'Mulai sampaikan masalah yang kamu temukan di lingkungan sekitar.'
                : 'Coba ubah kata kunci pencarian atau filter laporan.'}
            </span>

            {reports.length === 0 && (
              <Link
                to="/laporan/buat"
                className="btn btn-primary btn-small"
              >
                Buat laporan pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="citizen-report-list">
            {visibleReports.map((report) => (
              <CitizenReportCard
                report={report}
                key={report.report_id}
              />
            ))}
          </div>
        )}

        {!busy && !error && visibleCount < filteredReports.length && (
          <div className="citizen-load-more">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 4)}
            >
              Muat lebih banyak
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>
    </CitizenLayout>
  );
}