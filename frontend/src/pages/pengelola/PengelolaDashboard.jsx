
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  Settings,
} from 'lucide-react';

import { api } from '../../api';
import { useAuth } from '../../auth';
import StaffLayout from '../../layouts/PengelolaLayout';
import { StaffReportsTable } from './PengelolaReports';

// Kartu statistik ringkasan
function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon"><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

// Halaman Ringkasan Pengelola
export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/reports/assigned')
      .then((data) => setReports(data.reports))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const pending = reports.filter((r) => ['Menunggu', 'Diterima', 'Diverifikasi'].includes(r.status_name)).length;
  const processing = reports.filter((r) => r.status_name === 'Diproses').length;
  const complete = reports.filter((r) => r.status_name === 'Selesai').length;

  return (
    <StaffLayout
      title="Dashboard pengelola"
      subtitle="Kelola laporan yang masuk sesuai wilayah tugasmu."
    >
      <div className="workspace-actions">
        <span className="area-chip">
          <MapPin size={15} />
          {user?.task_village || 'Area tugas'}, {user?.task_district || ''}
        </span>
        <span className="role-pill">Akun terverifikasi</span>
      </div>

      <div className="stat-cards admin-stat-cards">
        <StatCard label="Laporan area" value={reports.length} icon={ClipboardList} />
        <StatCard label="Perlu verifikasi" value={pending} icon={Clock3} />
        <StatCard label="Sedang ditangani" value={processing} icon={Settings} />
        <StatCard label="Selesai" value={complete} icon={CheckCircle2} />
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Laporan wilayah tugas</h2>
            <p>Daftar laporan sesuai area tugas yang terdaftar pada akunmu.</p>
          </div>
          <Link to="/pengelola/laporan" className="text-link">
            Lihat semua <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="screen-loading">Memuat laporan...</div>
        ) : (
          <StaffReportsTable reports={reports.slice(0, 8)} />
        )}
      </div>
    </StaffLayout>
  );
}
