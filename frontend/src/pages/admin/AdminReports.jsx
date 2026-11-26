
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Search } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';

import { api, formatDate } from '../../api';
import AdminLayout from '../../layouts/AdminLayout';

// Komponen tabel laporan Admin
function AdminReportsTable({ reports = [], emptyMessage = 'Belum terdapat laporan yang tersedia.' }) {
  if (!reports.length) {
    return (
      <div className="empty-state">
        <ClipboardList />
        <b>Belum ada laporan</b>
        <span>{emptyMessage}</span>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [categoryFilter, setCategoryFilter] = useState('semua');

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

  const statusOptions = [
    ...new Set(
      reports
        .map((report) => String(report.status_name || 'Diterima').trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, 'id'));

  const categoryOptions = [
    ...new Set(
      reports
        .map((report) => String(report.category_name || '').trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, 'id'));

  const filteredReports = reports.filter((report) => {
    const query = searchTerm.trim().toLocaleLowerCase('id-ID');

    const status = String(report.status_name || 'Diterima').trim();
    const category = String(report.category_name || '').trim();

    const searchableText = [
      report.report_code,
      report.title,
      report.category_name,
      report.village_name,
      report.district_name,
      report.status_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('id-ID');

    const matchesSearch = !query || searchableText.includes(query);

    const matchesStatus =
      statusFilter === 'semua' ||
      status.toLocaleLowerCase('id-ID') ===
        statusFilter.toLocaleLowerCase('id-ID');

    const matchesCategory =
      categoryFilter === 'semua' ||
      category.toLocaleLowerCase('id-ID') ===
        categoryFilter.toLocaleLowerCase('id-ID');

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <AdminLayout
      title="Semua laporan" 
      subtitle="Pantau laporan publik dan area kejadian secara menyeluruh"
    >
      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      <div className="panel admin-panel admin-reports-panel admin-filter-panel">

        {/* JUDUL DAN DESKRIPSI */}
        <div className="panel-heading admin-reports-heading">
          <div>
            <h2>Daftar laporan</h2>
            <p>
              Telusuri dan pantau laporan publik dari seluruh wilayah LAPORMAS
            </p>
          </div>
        </div>

        {/* PENCARIAN DAN FILTER */}
        <div className="admin-reports-filters">

          <label className="admin-reports-filter-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label="Cari laporan"
              placeholder="Cari nomor laporan, judul, atau area..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <CustomSelect
            className="admin-filter-select admin-reports-filter-select"
            aria-label="Filter status laporan"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="semua">Semua status</option>
            {statusOptions.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </CustomSelect>

          <CustomSelect
            className="admin-filter-select admin-reports-filter-select"
            aria-label="Filter kategori laporan"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="semua">Semua kategori</option>
            {categoryOptions.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </CustomSelect>

        </div>

        {loading ? (
          <div className="screen-loading">
            Memuat laporan...
          </div>
        ) : (
          <>
            <div className="admin-reports-result-count">
              Menampilkan {filteredReports.length} dari {reports.length} laporan
            </div>

            <AdminReportsTable
              reports={filteredReports}
              emptyMessage={
                reports.length > 0
                  ? 'Tidak ada laporan yang sesuai dengan pencarian atau filter.'
                  : 'Belum terdapat laporan yang tersedia.'
              }
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
