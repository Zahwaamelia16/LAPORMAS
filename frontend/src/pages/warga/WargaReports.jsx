import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Plus,
  ClipboardList,
  AlertTriangle,
  FilePlus2,
} from 'lucide-react';

import { api, formatDate } from '../../api';
import CitizenLayout from '../../layouts/WargaLayout';

// Label status laporan
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

// Tabel laporan warga
function MyReportsTable({ reports = [] }) {
  if (!reports.length) {
    return (
      <div className="empty-state">
        <FilePlus2 />
        <b>Belum ada laporan</b>
        <span>
          Kamu belum pernah membuat laporan.
          Mulai laporkan masalah di lingkungan sekitarmu.
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

// Halaman riwayat laporan warga
export default function CitizenReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/reports/mine')
      .then((data) => {
        setReports(data.reports || []);
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat riwayat laporan.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <CitizenLayout
      title="Laporan saya"
      subtitle="Pantau semua laporan yang pernah kamu sampaikan."
    >
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Riwayat laporan</h2>
            <p>
              Lokasi kejadian dapat berbeda dari lokasi profil akunmu.
            </p>
          </div>

          <Link
            to="/laporan/buat"
            className="btn btn-primary btn-small"
          >
            <Plus size={15} />
            Buat laporan
          </Link>
        </div>

        {error && (
          <div className="notice error" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="screen-loading">
            Memuat riwayat laporan...
          </div>
        ) : error ? null : (
          <MyReportsTable reports={reports} />
        )}
      </div>
    </CitizenLayout>
  );
}
