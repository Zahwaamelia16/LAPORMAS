
import { useEffect, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';

import { api, formatDate } from '../../api';
import AdminLayout from '../../layouts/AdminLayout';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/users')
      .then((data) => {
        setUsers(data.users || []);
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat data pengguna.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AdminLayout
      title="Data pengguna"
      subtitle="Daftar akun warga, petugas terverifikasi, dan admin."
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
            <h2>Daftar pengguna</h2>
            <p>
              Informasi akun pengguna yang terdaftar di LAPORMAS.
            </p>
          </div>

          <span className="area-chip">
            <Users size={15} />
            {users.length} pengguna
          </span>
        </div>

        {loading ? (
          <div className="screen-loading">
            Memuat data pengguna...
          </div>
        ) : users.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Telepon</th>
                  <th>Role</th>
                  <th>Wilayah</th>
                  <th>Terdaftar</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || '-'}</td>

                    <td>
                      <span className="role-pill">
                        {user.role}
                      </span>
                    </td>

                    <td>
                      {user.village_name
                        ? `${user.village_name}, ${user.district_name}`
                        : '-'}
                    </td>

                    <td>{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users />
            <b>Belum ada data pengguna</b>
            <span>
              Data pengguna akan muncul setelah tersedia.
            </span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
