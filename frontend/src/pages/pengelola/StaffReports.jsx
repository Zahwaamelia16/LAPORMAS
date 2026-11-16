
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

import { api, formatDate } from '../../api';
import StaffLayout from '../../layouts/StaffLayout';

// Label status laporan
export function StatusBadge({ value }) {
  const key = (value || 'diterima')
    .toLowerCase()
    .replaceAll(' ', '-');

  return (
    <span className={`status status-${key}`}>
      {value || 'Diterima'}
    </span>
  );
}

// Tabel laporan wilayah tugas (dipakai juga di dashboard pengelola)
export function StaffReportsTable({ reports = [] }) {
  if (!reports.length) {
    return (
      <div className="empty-state">
        <ClipboardList />
        <b>Belum ada laporan di wilayah tugas</b>
        <span>Laporan baru akan muncul setelah warga mengirim laporan pada area ini.</span>
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
            <th>Lokasi kejadian</th>
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
              <td>{report.location}</td>
              <td>{formatDate(report.created_at)}</td>
              <td><StatusBadge value={report.status_name} /></td>
              <td>
                <Link
                  to={`/petugas/laporan/${report.report_id}`}
                  className="table-link"
                >
                  Tangani
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Halaman Laporan Area Tugas Pengelola
export default function StaffReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/reports/assigned')
      .then((data) => setReports(data.reports))
      .catch((err) => setError(err.message || 'Gagal memuat laporan.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StaffLayout
      title="Laporan area tugas"
      subtitle="Verifikasi dan perbarui progres laporan pada wilayahmu."
    >
      {error && <div className="notice error">{error}</div>}

      <div className="panel">
        {loading ? (
          <div className="screen-loading">Memuat laporan...</div>
        ) : (
          <StaffReportsTable reports={reports} />
        )}
      </div>
    </StaffLayout>
  );
}
