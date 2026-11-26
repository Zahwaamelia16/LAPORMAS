import CustomSelect from '../../components/CustomSelect';

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { api, formatDate, imageUrl } from '../../api';
import AdminLayout from '../../layouts/AdminLayout';
import StaffLayout from '../../layouts/PengelolaLayout';
import { StatusBadge } from './PengelolaReports';

// Cadangan jika daftar status dari server belum termuat (sama dengan tabel report_statuses)
const DEFAULT_STATUS_OPTIONS = ['Menunggu', 'Diverifikasi', 'Diproses', 'Selesai'];

// Halaman Detail Penanganan.
// Dipakai pengelola (/pengelola/laporan/:id) dan admin (/admin/laporan/:id lewat prop `admin`).
export default function StaffReportDetailPage({ admin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [statusOptions, setStatusOptions] = useState(DEFAULT_STATUS_OPTIONS);

  const Layout = admin ? AdminLayout : StaffLayout;

  // Detail laporan + riwayat penanganan (hanya laporan di wilayah tugas)
  const load = () => api(`/reports/assigned/${id}`)
    .then((data) => {
      setReport(data.report);
      setStatus(data.report.status_name);
    })
    .catch((err) => setError(err.message));

  useEffect(() => {
    load();

    // Pilihan status diambil dari database
    api('/statuses')
      .then((data) => {
        const names = (data.statuses || []).map((s) => s.status_name);
        if (names.length) setStatusOptions(names);
      })
      .catch(() => { });
  }, [id]);

  const save = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const data = await api(`/reports/${id}/status`, { method: 'PATCH', body: { status_name: status, notes } });
      if (data?.report) {
        setReport(data.report);
        setStatus(data.report.status_name);
      } else {
        await load();
      }
      setNotes('');
      setSuccess(data?.message || 'Status laporan berhasil diperbarui.');
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
        onClick={() => navigate(admin ? '/admin/laporan' : '/pengelola/laporan')}
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

            {success && (
              <div className="notice success" role="status">
                <CheckCircle2 size={18} />
                <span>{success}</span>
              </div>
            )}

            <label>
              Status terbaru
              <CustomSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map((s) => <option key={s}>{s}</option>)}
              </CustomSelect>
            </label>

            <label>
              Catatan penanganan
              <textarea
                rows="5"
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan hasil verifikasi atau perkembangan..."
              />
            </label>

            <button className="btn btn-primary btn-block" disabled={busy} onClick={save}>
              {busy ? 'Menyimpan...' : 'Simpan pembaruan'}
            </button>

            <div className="timeline compact-timeline">
              <b>Riwayat penanganan</b>
              {!(report.updates || []).length && (
                <small>Belum ada pembaruan. Laporan masih berstatus awal.</small>
              )}
              {(report.updates || []).map((u, i) => (
                <div className="timeline-item" key={i}>
                  <span className="timeline-dot" />
                  <div>
                    <b>{u.new_status}</b>
                    <small>
                      {formatDate(u.updated_at)}
                      {u.updated_by_name ? ` · ${u.updated_by_name}` : ''}
                    </small>
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
