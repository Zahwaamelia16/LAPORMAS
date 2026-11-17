
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import { api, formatDate, imageUrl } from '../../api';
import AdminLayout from '../../layouts/AdminLayout';
import StaffLayout from '../../layouts/StaffLayout';
import { StatusBadge } from './StaffReports';

const STATUS_OPTIONS = ['Diterima', 'Diverifikasi', 'Diproses', 'Selesai', 'Ditolak'];

// Halaman Detail Penanganan.
// Dipakai pengelola (/petugas/laporan/:id) dan admin (/admin/laporan/:id lewat prop `admin`).
export default function StaffReportDetailPage({ admin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const Layout = admin ? AdminLayout : StaffLayout;

  const load = () => api(`/reports/${id}`)
    .then((data) => {
      setReport(data.report);
      setStatus(data.report.status_name);
    })
    .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, [id]);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/reports/${id}/status`, { method: 'PATCH', body: { status_name: status, notes } });
      await load();
      setNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout
      title={admin ? 'Kelola laporan' : 'Detail penanganan'}
      subtitle={admin
        ? 'Tinjau laporan dan perbarui status penanganan lintas wilayah.'
        : 'Periksa informasi laporan dan catat perkembangan penanganan.'}
    >
      <button
        className="text-link back-inline"
        onClick={() => navigate(admin ? '/admin/laporan' : '/petugas/laporan')}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Kembali ke daftar laporan
      </button>

      {error && (
        <div className="notice error" role="status">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!report ? (
        <div className="screen-loading">Memuat laporan...</div>
      ) : (
        <div className="detail-work-grid">
          <section className="panel">
            <div className="detail-status-row">
              <StatusBadge value={report.status_name} />
              <span>{report.report_code} · {formatDate(report.created_at)}</span>
            </div>

            <h2>{report.title}</h2>
            <p>{report.description}</p>

            <div className="detail-info-grid">
              <div>
                <span>Kategori</span>
                <b>{report.category_name}</b>
              </div>
              <div>
                <span>Lokasi</span>
                <b>{report.location}</b>
              </div>
              <div>
                <span>Area kejadian</span>
                <b>{report.village_name}, {report.district_name}</b>
              </div>
            </div>

            {report.images?.length > 0 && (
              <div className="detail-images">
                {report.images.map((img, i) => (
                  <img key={i} src={imageUrl(img.image_url)} alt={`Bukti ${i + 1}`} />
                ))}
              </div>
            )}
          </section>

          <aside className="panel update-panel">
            <h3>Perbarui penanganan</h3>

            <label>
              Status terbaru
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>

            <label>
              Catatan penanganan
              <textarea
                rows="5"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan hasil verifikasi atau perkembangan..."
              />
            </label>

            <button className="btn btn-primary btn-block" disabled={busy} onClick={save}>
              {busy ? 'Menyimpan...' : 'Simpan pembaruan'}
            </button>

            <div className="timeline compact-timeline">
              <b>Riwayat sebelumnya</b>
              {(report.updates || []).map((u, i) => (
                <div className="timeline-item" key={i}>
                  <span className="timeline-dot" />
                  <div>
                    <b>{u.new_status}</b>
                    <small>{formatDate(u.updated_at)}</small>
                    {u.notes && <p>{u.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </Layout>
  );
}
