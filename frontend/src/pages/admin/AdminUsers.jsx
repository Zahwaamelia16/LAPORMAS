
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Check,
  Eye,
  Pencil,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react';

import { api, formatDate } from '../../api';
import AdminLayout from '../../layouts/AdminLayout';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    api('/admin/users')
      .then((data) => {
        if (!cancelled) {
          setUsers(Array.isArray(data.users) ? data.users : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Gagal memuat data pengguna.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !keyword ||
        [user.name, user.email, user.phone, user.village_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const role = user.role === 'petugas' ? 'pengelola' : user.role;
      const matchesRole =
        roleFilter === 'semua' || role === roleFilter;

      const isActive = user.is_active !== false;
      const matchesStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'aktif' && isActive) ||
        (statusFilter === 'nonaktif' && !isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  function openDetail(user) {
    setModal({ type: 'detail', user });
  }

  function openEdit(user) {
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
    });

    setModal({ type: 'edit', user });
    setError('');
    setNotice('');
  }

  function closeModal() {
    if (!saving) setModal(null);
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!modal?.user) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const data = await api(`/admin/users/${modal.user.user_id}`, {
        method: 'PATCH',
        body: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        },
      });

      setNotice(data.message || 'Data pengguna berhasil diperbarui.');
      setModal(null);
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(err.message || 'Gagal memperbarui data pengguna.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(user) {
    const isCurrentlyActive = user.is_active !== false;
    const nextStatus = !isCurrentlyActive;

    const confirmation = window.confirm(
      nextStatus
        ? `Aktifkan kembali akun ${user.name}?`
        : `Nonaktifkan akun ${user.name}? Pengguna tidak akan bisa login, tetapi riwayat datanya tetap tersimpan.`
    );

    if (!confirmation) return;

    setBusyUserId(user.user_id);
    setError('');
    setNotice('');

    try {
      const data = await api(
        `/admin/users/${user.user_id}/status`,
        {
          method: 'PATCH',
          body: { is_active: nextStatus },
        }
      );

      setNotice(data.message || 'Status akun berhasil diperbarui.');
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(err.message || 'Gagal mengubah status akun.');
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <AdminLayout
      title="Data pengguna"
      subtitle="Kelola akun warga, pengelola, dan administrator LAPORMAS."
    >
      {error && (
        <div className="notice error" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="admin-user-notice" role="status">
          <Check size={18} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Tutup pemberitahuan"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="panel admin-user-panel">
        <div className="panel-heading admin-user-heading">
          <div>
            <h2>Daftar pengguna</h2>
            <p>
              Informasi dan pengelolaan akun yang terdaftar di LAPORMAS.
            </p>
          </div>

          <span className="area-chip">
            <Users size={15} />
            {users.length} pengguna
          </span>
        </div>

        <div className="admin-user-filters">
          <div className="admin-user-search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, email, telepon..."
              aria-label="Cari pengguna"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter role"
          >
            <option value="semua">Semua role</option>
            <option value="warga">Warga</option>
            <option value="pengelola">Pengelola</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter status akun"
          >
            <option value="semua">Semua status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>

        {loading ? (
          <div className="screen-loading">
            Memuat data pengguna...
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="table-wrap">
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Telepon</th>
                  <th>Role</th>
                  <th>Wilayah</th>
                  <th>Status</th>
                  <th>Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const isActive = user.is_active !== false;
                  const role =
                    user.role === 'petugas' ? 'pengelola' : user.role;

                  return (
                    <tr key={user.user_id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>

                      <td>
                        <span className="role-pill">{role}</span>
                      </td>

                      <td>
                        {user.village_name
                          ? `${user.village_name}, ${user.district_name || ''}`
                          : '-'}
                      </td>

                      <td>
                        <span
                          className={`admin-user-status ${
                            isActive ? 'is-active' : 'is-inactive'
                          }`}
                        >
                          {isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      <td>{formatDate(user.created_at)}</td>

                      <td>
                        <div className="admin-user-actions">
                          <button
                            type="button"
                            className="admin-user-action view"
                            onClick={() => openDetail(user)}
                            title="Lihat detail"
                            aria-label={`Lihat detail ${user.name}`}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            className="admin-user-action edit"
                            onClick={() => openEdit(user)}
                            title="Edit pengguna"
                            aria-label={`Edit ${user.name}`}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className={`admin-user-action ${
                              isActive ? 'deactivate' : 'activate'
                            }`}
                            onClick={() => handleToggleStatus(user)}
                            disabled={busyUserId === user.user_id}
                            title={isActive ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                            aria-label={
                              isActive
                                ? `Nonaktifkan ${user.name}`
                                : `Aktifkan ${user.name}`
                            }
                          >
                            {isActive ? (
                              <Ban size={16} />
                            ) : (
                              <RotateCcw size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users />
            <b>
              {users.length === 0
                ? 'Belum ada data pengguna'
                : 'Pengguna tidak ditemukan'}
            </b>
            <span>
              {users.length === 0
                ? 'Data pengguna akan muncul setelah tersedia.'
                : 'Coba ubah kata kunci atau filter pencarian.'}
            </span>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="admin-user-footer">
            Menampilkan {filteredUsers.length} dari {users.length} pengguna
          </div>
        )}
      </div>

      {modal && (
        <div
          className="admin-user-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="admin-user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-modal-title"
          >
            <div className="admin-user-modal-header">
              <div>
                <h2 id="admin-user-modal-title">
                  {modal.type === 'edit'
                    ? 'Edit pengguna'
                    : 'Detail pengguna'}
                </h2>
                <p>
                  {modal.type === 'edit'
                    ? 'Perbarui informasi akun pengguna.'
                    : 'Informasi akun yang terdaftar di LAPORMAS.'}
                </p>
              </div>

              <button
                type="button"
                className="admin-user-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {modal.type === 'detail' ? (
              <div className="admin-user-detail">
                <div>
                  <span>Nama lengkap</span>
                  <b>{modal.user.name || '-'}</b>
                </div>
                <div>
                  <span>Email</span>
                  <b>{modal.user.email || '-'}</b>
                </div>
                <div>
                  <span>Nomor telepon</span>
                  <b>{modal.user.phone || '-'}</b>
                </div>
                <div>
                  <span>Role</span>
                  <b>
                    {modal.user.role === 'petugas'
                      ? 'Pengelola'
                      : modal.user.role}
                  </b>
                </div>
                <div>
                  <span>Alamat</span>
                  <b>{modal.user.address || '-'}</b>
                </div>
                <div>
                  <span>Wilayah</span>
                  <b>
                    {[
                      modal.user.village_name,
                      modal.user.district_name,
                      modal.user.regency_name,
                    ]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </b>
                </div>
                <div>
                  <span>Status akun</span>
                  <b>
                    {modal.user.is_active === false ? 'Nonaktif' : 'Aktif'}
                  </b>
                </div>
                <div>
                  <span>Tanggal terdaftar</span>
                  <b>{formatDate(modal.user.created_at)}</b>
                </div>

                <div className="admin-user-modal-footer">
                  <button
                    type="button"
                    className="admin-user-secondary-btn"
                    onClick={closeModal}
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    className="admin-user-primary-btn"
                    onClick={() => openEdit(modal.user)}
                  >
                    <Pencil size={16} />
                    Edit data
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave}>
                <div className="admin-user-form">
                  <label>
                    Nama lengkap
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                      required
                      maxLength={150}
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      required
                      maxLength={255}
                    />
                  </label>

                  <label>
                    Nomor telepon
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm({ ...form, phone: event.target.value })
                      }
                      maxLength={30}
                    />
                  </label>

                  <label>
                    Alamat
                    <textarea
                      rows={3}
                      value={form.address}
                      onChange={(event) =>
                        setForm({ ...form, address: event.target.value })
                      }
                      maxLength={1000}
                    />
                  </label>

                  <div className="admin-user-readonly">
                    Role akun: <b>
                      {modal.user.role === 'petugas'
                        ? 'Pengelola'
                        : modal.user.role}
                    </b>
                    <span>
                      Role tidak dapat diubah melalui formulir ini.
                    </span>
                  </div>
                </div>

                <div className="admin-user-modal-footer">
                  <button
                    type="button"
                    className="admin-user-secondary-btn"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="admin-user-primary-btn"
                    disabled={saving}
                  >
                    <Check size={16} />
                    {saving ? 'Menyimpan...' : 'Simpan perubahan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
