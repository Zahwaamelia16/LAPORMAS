
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

import { api, formatDate } from '../../api';
import AdminLayout from '../../layouts/AdminLayout';

// Komponen tabel laporan Admin
function AdminReportsTable({ reports = [] }) {
  if (!reports.length) {
    return (
      <div className="empty-state">
        <ClipboardList />
        <b>Belum ada laporan</b>
        <span>Belum terdapat laporan yang tersedia.</span>
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
          {reports.map((report) => {
            const statusKey = (
              report.status_name || 'Diterima'
            ).toLowerCase().replaceAll(' ', '-');

            return (
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
                  <span className={`status status-${statusKey}`}>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Halaman Semua Laporan Admin
export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/reports')
      .then((data) => {
        setReports(data.reports);
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat laporan.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AdminLayout
      title="Semua laporan"
      subtitle="Pantau laporan publik dan area kejadian secara menyeluruh."
    >
      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      <div className="panel">
        {loading ? (
          <div className="screen-loading">
            Memuat laporan...
          </div>
        ) : (
          <AdminReportsTable reports={reports} />
        )}
      </div>
    </AdminLayout>
  );
}
