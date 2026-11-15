
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
    <div className="stat-card">
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
    <div className="table-wrap">
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

// Dashboard Admin
export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = () => {
    return Promise.all([
      api('/admin/summary'),
      api('/admin/staff-requests?status=pending'),
      api('/reports'),
    ])
      .then(([summaryData, requestData, reportData]) => {
        setSummary(summaryData.summary);
        setRequests(requestData.requests);
        setReports(reportData.reports);
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
          <div className="stat-cards">
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
              label="Pengajuan petugas"
              value={summary?.pending_staff || 0}
              icon={ShieldCheck}
            />

            <StatCard
              label="Warga terdaftar"
              value={summary?.citizens || 0}
              icon={Users}
            />
          </div>

          {/* Pengajuan pengelola */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Pengajuan pengelola</h2>
                <p>
                  Periksa bukti penugasan sebelum memberikan akses petugas.
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
                      {request.name.slice(0, 1)}
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
          <div className="panel">
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
