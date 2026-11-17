import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

import { formatDate } from '../../api';
import StaffLayout from '../../layouts/PengelolaLayout';
import PublicReportFilters from '../shared/PublicReportFilters';
import { usePublicReports } from '../shared/usePublicReports';
import { StatusBadge } from './PengelolaReports';

export default function PengelolaPublicReportsPage() {
  const {
    reports,
    areas,
    categories,
    statuses,
    filters,
    setFilters,
    resetFilters,
    loading,
  } = usePublicReports();

  return (
    <StaffLayout
      title="Laporan publik"
      subtitle="Lihat laporan yang dipublikasikan di seluruh wilayah."
    >
      <PublicReportFilters
        areas={areas}
        categories={categories}
        statuses={statuses}
        filters={filters}
        setFilters={setFilters}
        onReset={resetFilters}
      />

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Daftar laporan</h2>
            <p>{reports.length} laporan ditemukan</p>
          </div>
        </div>

        {loading ? (
          <div className="screen-loading">Memuat laporan...</div>
        ) : reports.length === 0 ? (
          <div className="empty-state compact">
            <ClipboardList />
            <b>Belum ada laporan yang ditampilkan</b>
            <span>Laporan akan muncul di sini setelah tersedia.</span>
          </div>
        ) : (
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
                        to={`/pengelola/laporan-publik/${report.report_id}`}
                        className="table-link"
                      >
                        Lihat detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}