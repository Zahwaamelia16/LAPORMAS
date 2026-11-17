import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  MapPin,
  Plus,
  ClipboardList,
  Clock3,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  FilePlus2,
} from 'lucide-react';

import { api, formatDate } from '../../api';
import { useAuth } from '../../auth';
import CitizenLayout from '../../layouts/WargaLayout';

// Komponen status laporan
function StatusBadge({ value }) {
  const key = (value || 'diterima')
    .toLowerCase()
    .replaceAll(' ', '-');

  return (
    <span className={`status status-${key}`}>
      {value || 'Diterima'}
    </span>
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

// Tabel laporan warga
function MyReportsTable({ reports = [] }) {
  if (!reports.length) {
    return (
      <div className="empty-state">
        <FilePlus2 />
        <b>Belum ada laporan</b>
        <span>
          Mulai sampaikan masalah yang kamu temukan
          di lingkungan sekitar.
        </span>
        <Link
          to="/laporan/buat"
          className="btn btn-primary btn-small"
        >
          Buat laporan pertama
        </Link>
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
            <th>Wilayah kejadian</th>
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
                <StatusBadge value={report.status_name} />
              </td>

              <td>
                <Link
                  to={`/warga/laporan/${report.report_id}`}
                  className="table-link"
                >
                  Detail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Dashboard utama Warga
export default function CitizenDashboardPage() {
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    api('/reports/mine')
      .then((data) => {
        setReports(data.reports || []);
      })
      .catch(() => {})
      .finally(() => {
        setBusy(false);
      });
  }, []);

  const completed = reports.filter(
    (report) => report.status_name === 'Selesai'
  ).length;

  const process = reports.filter(
    (report) =>
      ['Diproses', 'Diverifikasi'].includes(report.status_name)
  ).length;

  return (
    <CitizenLayout
      title={`Halo, ${user?.name?.split(' ')[0] || 'Warga'}!`}
      subtitle="Pantau laporan dan perkembangan penanganannya di sini."
    >
      <div className="workspace-actions">
        <span className="area-chip">
          <MapPin size={15} />
          {user?.village_name || 'Area profil'},
          {' '}
          {user?.district_name || ''}
        </span>

        <Link
          to="/laporan/buat"
          className="btn btn-primary"
        >
          <Plus size={17} />
          Buat laporan
        </Link>
      </div>

      {/* Statistik laporan */}
      <div className="stat-cards">
        <StatCard
          label="Total laporan"
          value={reports.length}
          icon={ClipboardList}
        />

        <StatCard
          label="Sedang diproses"
          value={process}
          icon={Clock3}
        />

        <StatCard
          label="Selesai"
          value={completed}
          icon={CheckCircle2}
        />
      </div>

      {/* Daftar laporan warga */}
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Laporan saya</h2>
            <p>Daftar laporan yang pernah kamu kirim.</p>
          </div>

          <Link
            to="/warga/laporan"
            className="text-link"
          >
            Lihat semua <ArrowRight size={15} />
          </Link>
        </div>

        {busy ? (
          <div className="screen-loading">
            Memuat laporan...
          </div>
        ) : (
          <MyReportsTable reports={reports.slice(0, 6)} />
        )}
      </div>

      {/* Informasi privasi */}
      <div className="privacy-banner">
        <ShieldCheck />

        <div>
          <b>Privasi pelapor tetap terjaga</b>
          <span>
            Identitas dan kontakmu tidak ditampilkan
            pada halaman laporan publik.
          </span>
        </div>
      </div>
    </CitizenLayout>
  );
}
