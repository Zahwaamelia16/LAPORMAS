
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  Clock3,
  Settings,
  CheckCircle2,
  ShieldCheck,
  Users,
  BarChart3,
} from 'lucide-react';

import { api, formatDate, imageUrl } from '../../api';
import AdminLayout from '../../layouts/AdminLayout';

// Notifikasi
function Notice({ children }) {
  if (!children) return null;

  return (
    <div className="notice error" role="status">
      <AlertTriangle size={18} />
      <span>{children}</span>
    </div>
  );
}

// Kartu statistik
function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="stat-card admin-stat-card">
      <div className="stat-card-icon">
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// Tabel laporan terbaru
function AdminRecentReports({ reports = [] }) {
  if (!reports.length) {
    return (
      <div className="empty-state compact">
        <ClipboardList />
        <b>Belum ada laporan</b>
        <span>Laporan akan muncul setelah tersedia.</span>
      </div>
    );
  }

  return (
    <div className="table-wrap admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nomor / Judul</th>
            <th>Kategori</th>
            <th>Area</th>
            <th>Tanggal</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {reports.map((report) => (
            <tr key={report.report_id}>
              <td>
                <b>{report.report_code}</b>
                <span>{report.title}</span>
              </td>
              <td>{report.category_name}</td>
              <td>
                {report.village_name}, {report.district_name}
              </td>
              <td>{formatDate(report.created_at)}</td>
              <td>
                <span className={`status status-${(report.status_name || 'diterima').toLowerCase().replaceAll(' ', '-')}`}>
                  {report.status_name || 'Diterima'}
                </span>
              </td>
              <td>
                <Link
                  to={`/admin/laporan/${report.report_id}`}
                  className="table-link"
                >
                  Kelola
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function AdminReportTrendChart({ data = [] }) {
  const width = 900;
  const height = 290;

  const left = 50;
  const right = 25;
  const top = 25;
  const bottom = 52;

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const plotBottom = height - bottom;

  const values = data.map((item) => Number(item.total) || 0);

  const total = values.reduce((sum, value) => sum + value, 0);
  const peak = Math.max(0, ...values);
  const average = data.length
    ? (total / data.length).toFixed(1)
    : '0';

  const maxY = Math.max(4, Math.ceil(peak / 4) * 4);

  const points = data.map((item, index) => {
    const x = data.length <= 1
      ? left + plotWidth / 2
      : left + (index / (data.length - 1)) * plotWidth;

    const y = plotBottom - (
      (Number(item.total) || 0) / maxY
    ) * plotHeight;

    return { x, y, item };
  });

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(' ');

  const areaPath = points.length
    ? `M ${points[0].x} ${plotBottom}
       L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}
       L ${points[points.length - 1].x} ${plotBottom} Z`
    : '';

  const labelCount = Math.min(7, data.length);

  const labelIndexes = Array.from(
    { length: labelCount },
    (_, index) => Math.round(
      index * (data.length - 1) /
      Math.max(labelCount - 1, 1)
    )
  );

  return (
    <div className="admin-chart-content">

      {/* Ringkasan grafik */}
      <div className="admin-chart-metrics">

        <div>
          <span>Total laporan</span>
          <strong>{total.toLocaleString('id-ID')}</strong>
        </div>

        <div>
          <span>Rata-rata per periode</span>
          <strong>{average}</strong>
        </div>

        <div>
          <span>Laporan tertinggi</span>
          <strong>{peak}</strong>
        </div>

      </div>

      {data.length === 0 ? (
        <div className="empty-state compact">
          <BarChart3 />
          <b>Belum ada data grafik</b>
          <span>Data akan muncul setelah tersedia.</span>
        </div>
      ) : (
        <div className="admin-chart-svg-wrap">

          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Grafik jumlah laporan berdasarkan periode"
            className="admin-chart-svg"
          >

            <defs>
              <linearGradient
                id="admin-chart-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#23834D" stopOpacity=".23" />
                <stop offset="100%" stopColor="#23834D" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Garis grid dan label sumbu Y */}
            {Array.from({ length: 5 }, (_, index) => {
              const y = top + (index / 4) * plotHeight;
              const value = Math.round(maxY * (1 - index / 4));

              return (
                <g key={index}>
                  <line
                    x1={left}
                    y1={y}
                    x2={width - right}
                    y2={y}
                    stroke="#E6EEE8"
                    strokeDasharray="4 5"
                  />

                  <text
                    x={left - 12}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#829487"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* Area di bawah garis */}
            <path
              d={areaPath}
              fill="url(#admin-chart-gradient)"
            />

            {/* Garis utama */}
            <polyline
              points={linePoints}
              fill="none"
              stroke="#23834D"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Titik data */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#FFFFFF"
                stroke="#23834D"
                strokeWidth="2.5"
              >
                <title>
                  {point.item.label}: {point.item.total} laporan
                </title>
              </circle>
            ))}

            {/* Label sumbu X */}
            {labelIndexes.map((index) => {
              const point = points[index];

              return (
                <text
                  key={index}
                  x={point.x}
                  y={height - 15}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#829487"
                >
                  {point.item.label}
                </text>
              );
            })}

          </svg>
        </div>
      )}

    </div>
  );
}

// Dashboard Admin
export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState('month');
  const [trend, setTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState('');

  const reload = () => {
    return Promise.all([
      api('/admin/summary'),
      api('/admin/staff-requests?status=pending'),
      api('/admin/reports'),
    ])
    .then(([summaryData, requestData, reportData]) => {
      setSummary(summaryData.summary || {});
      setRequests(requestData.requests || []);
      setReports(reportData.reports || []);
      setError('');
    })
      .catch((requestError) => {
        setError(requestError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    reload();
  }, []);

useEffect(() => {
  let active = true;

  setTrendLoading(true);
  setTrendError('');

  api(`/admin/report-trends?period=${trendPeriod}`)
    .then((data) => {
      if (active) {
        setTrend(data.trend || []);
      }
    })
    .catch((err) => {
      if (active) {
        setTrendError(err.message);
      }
    })
    .finally(() => {
      if (active) {
        setTrendLoading(false);
      }
    });

  return () => {
    active = false;
  };
}, [trendPeriod]);

  const decide = async (id, decision) => {
    const note =
      decision === 'rejected'
        ? window.prompt('Alasan penolakan (opsional):') ||
          'Pengajuan belum memenuhi persyaratan.'
        : 'Pengajuan telah diverifikasi.';

    try {
      await api(`/admin/staff-requests/${id}`, {
        method: 'PATCH',
        body: {
          decision,
          admin_note: note,
        },
      });

      reload();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <AdminLayout
      title="Dashboard admin"
      subtitle="Pantau keseluruhan laporan dan verifikasi akun pengelola."
    >
      {error && <Notice>{error}</Notice>}

      {loading ? (
        <div className="screen-loading">
          Memuat data...
        </div>
      ) : (
        <>
          {/* Statistik */}
          <div className="stat-cards admin-stat-cards">
            <StatCard
              label="Total laporan"
              value={summary?.total || 0}
              icon={ClipboardList}
            />

            <StatCard
              label="Laporan diterima"
              value={summary?.received || 0}
              icon={Clock3}
            />

            <StatCard
              label="Sedang diproses"
              value={summary?.processing || 0}
              icon={Settings}
            />

            <StatCard
              label="Selesai"
              value={summary?.completed || 0}
              icon={CheckCircle2}
            />

            <StatCard
              label="Pengajuan pengelola"
              value={summary?.pending_staff || 0}
              icon={ShieldCheck}
            />

            <StatCard
              label="Warga terdaftar"
              value={summary?.citizens || 0}
              icon={Users}
            />
          </div>

          {/* GRAFIK TREN LAPORAN */}
          <div className="panel admin-panel admin-trend-panel">

            <div className="panel-heading admin-trend-heading">
              <div>
                <h2>
                  <BarChart3 size={19} />
                  Tren laporan
                </h2>

                <p>
                  Perkembangan jumlah laporan yang masuk ke LAPORMAS.
                </p>
              </div>

              <div className="admin-chart-filters">
                {[
                  { value: 'week', label: '7 Hari' },
                  { value: 'month', label: '30 Hari' },
                  { value: 'year', label: '12 Bulan' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    className={
                      trendPeriod === item.value ? 'active' : ''
                    }
                    onClick={() => setTrendPeriod(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {trend.length > 0 ? (
              <div
                className="admin-chart-stage"
                aria-busy={trendLoading}
              >
                {/* Indikator update tanpa menghilangkan grafik */}
                <div className="admin-chart-status" aria-live="polite">
                  {trendLoading && (
                    <span className="admin-chart-updating">
                      <span className="admin-chart-spinner" />
                      Memperbarui grafik...
                    </span>
                  )}

                  {!trendLoading && trendError && (
                    <span className="admin-chart-error">
                      Gagal memperbarui grafik. Data sebelumnya tetap ditampilkan.
                    </span>
                  )}
                </div>

                {/* Grafik lama tetap terlihat sampai data baru tersedia */}
                <div
                  className="admin-chart-transition"
                  key={JSON.stringify(trend)}
                >
                  <AdminReportTrendChart data={trend} />
                </div>
              </div>
            ) : trendError ? (
              <div className="notice error">
                <AlertTriangle size={18} />
                <span>{trendError}</span>
              </div>
            ) : (
              <div className="admin-chart-initial-loading">
                <span className="admin-chart-spinner" />
                Memuat grafik laporan...
              </div>
            )}

          </div>

          {/* Pengajuan pengelola */}
          <div className="panel admin-panel">
            <div className="panel-heading">
              <div>
                <h2>Pengajuan pengelola</h2>
                <p>
                  Periksa bukti penugasan sebelum memberikan akses pengelola.
                </p>
              </div>

              <Link
                to="/admin/verifikasi"
                className="text-link"
              >
                Lihat semua <ArrowRight size={15} />
              </Link>
            </div>

            {requests.length > 0 ? (
              <div className="request-list">
                {requests.slice(0, 4).map((request) => (
                  <div
                    className="request-item"
                    key={request.request_id}
                  >
                    <div className="request-avatar">
                      {request.name?.trim()?.charAt(0).toUpperCase() || 'P'}
                    </div>

                    <div className="request-info">
                      <b>{request.name}</b>

                      <span>
                        {request.agency} · {request.unit_name}
                      </span>

                      <small>
                        {request.village_name}, {request.district_name},{' '}
                        {request.regency_name}
                      </small>
                    </div>

                    <div className="request-actions">
                      <a
                        href={imageUrl(request.proof_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-small"
                      >
                        Bukti tugas
                      </a>

                      <button
                        className="btn btn-primary btn-small"
                        onClick={() =>
                          decide(request.request_id, 'approved')
                        }
                      >
                        Setujui
                      </button>

                      <button
                        className="btn btn-danger btn-small"
                        onClick={() =>
                          decide(request.request_id, 'rejected')
                        }
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                <BadgeCheck />
                <b>Tidak ada pengajuan menunggu</b>
                <span>
                  Semua pengajuan pengelola sudah diproses.
                </span>
              </div>
            )}
          </div>

          {/* Laporan terbaru */}
          <div className="panel admin-panel">
            <div className="panel-heading">
              <div>
                <h2>Laporan terbaru seluruh wilayah</h2>
                <p>
                  Admin dapat memantau dan meninjau laporan dari semua area.
                </p>
              </div>

              <Link
                to="/admin/laporan"
                className="text-link"
              >
                Kelola laporan <ArrowRight size={15} />
              </Link>
            </div>

            <AdminRecentReports reports={reports.slice(0, 5)} />
          </div>
        </>
      )}
    </AdminLayout>
  );
}
