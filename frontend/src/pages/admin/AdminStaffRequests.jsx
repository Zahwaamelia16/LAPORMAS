import CustomSelect from '../../components/CustomSelect';
import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

import { api, imageUrl } from '../../api';
import AdminLayout from '../../layouts/AdminLayout';

export default function AdminStaffRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Mengambil data pengajuan
  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api(
        `/admin/staff-requests?status=${status}`
      );

      setRequests(data.requests || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  // Memuat ulang data saat filter berubah
  useEffect(() => {
    load();
  }, [status]);

  // Menyetujui atau menolak pengajuan
  const decide = async (id, decision) => {
    const note = window.prompt(
      decision === 'rejected'
        ? 'Alasan penolakan:'
        : 'Catatan verifikasi:',
      decision === 'approved'
        ? 'Bukti penugasan telah diverifikasi.'
        : ''
    ) || '';

    try {
      await api(`/admin/staff-requests/${id}`, {
        method: 'PATCH',
        body: {
          decision,
          admin_note: note,
        },
      });

      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  // Label status pengajuan
  const getStatusLabel = (value) => {
    if (value === 'pending') return 'Menunggu verifikasi';
    if (value === 'approved') return 'Disetujui';
    if (value === 'rejected') return 'Ditolak';

    return value;
  };

  const getStatusClass = (value) => {
    if (value === 'rejected') return 'ditolak';
    if (value === 'pending') return 'menunggu-verifikasi';

    return 'disetujui';
  };

  return (
    <AdminLayout
      title="Verifikasi pengelola"
      subtitle="Setujui atau tolak pengajuan berdasarkan bukti penugasan."
    >
      {error && (
        <div className="notice error" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Daftar pengajuan</h2>
            <p>
              Pengguna baru memperoleh role pengelola setelah disetujui.
            </p>
          </div>

          <CustomSelect
            className="select-compact"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
            <option value="semua">Semua</option>
          </CustomSelect>
        </div>

        {loading ? (
          <div className="screen-loading">
            Memuat pengajuan...
          </div>
        ) : requests.length > 0 ? (
          <div className="request-list">
            {requests.map((request) => (
              <div
                className="request-item full"
                key={request.request_id}
              >
                <div className="request-avatar">
                  {(request.name || '?').slice(0, 1)}
                </div>

                <div className="request-info">
                  <b>{request.name}</b>

                  <span>
                    {request.email} · {request.phone}
                  </span>

                  <small>
                    {request.agency} / {request.unit_name}
                  </small>

                  <small>
                    {request.village_name}, {request.district_name},{' '}
                    {request.regency_name}
                  </small>

                  <small>
                    Alamat kantor: {request.office_address}
                  </small>

                  <span
                    className={`status status-${getStatusClass(request.status)}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <div className="request-actions">
                  <a
                    href={imageUrl(request.proof_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-small"
                  >
                    Lihat bukti
                  </a>

                  {request.status === 'pending' && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <ShieldCheck />
            <b>Tidak ada data pengajuan</b>
            <span>
              Belum ada pengajuan pada kategori status ini.
            </span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
