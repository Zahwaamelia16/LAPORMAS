
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  MapPin,
  Pencil,
} from 'lucide-react';

import { api } from '../../api';
import { useAuth } from '../../auth';
import CitizenLayout from '../../layouts/WargaLayout';
import '../../styles/profile.css';

// Ambil nilai form profil dari data user yang sedang login
function profileFormFrom(user) {
  return {
    name: user?.name || '',
    phone: user?.citizen_phone || user?.phone || '',
    address: user?.address || '',
    area_id: user?.citizen_area_id || user?.area_id || '',
  };
}

const emptyPasswordForm = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

// Pesan sukses / gagal di atas form
function Message({ message }) {
  if (!message) return null;

  const Icon = message.type === 'success' ? CheckCircle2 : AlertTriangle;

  return (
    <div className={`notice ${message.type}`} role="status">
      <Icon size={18} />
      <span>{message.text}</span>
    </div>
  );
}

// Halaman Profil Warga: lihat, ubah data profil, dan ganti kata sandi
export default function ProfilePageModule() {
  const { user, setUser } = useAuth();

  const [areas, setAreas] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => profileFormFrom(user));
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Ambil ulang data profil terbaru dari database & daftar area
  useEffect(() => {
    api('/auth/me')
      .then((data) => {
        if (data?.user) setUser({ ...data.user, role: data.user.role === 'petugas' ? 'pengelola' : data.user.role });
      })
      .catch(() => { });

    api('/areas')
      .then((data) => setAreas(data.areas || []))
      .catch(() => setAreas([]));
  }, []);

  // Isi ulang form setiap data user berubah (selama tidak sedang mengedit)
  useEffect(() => {
    if (!editing) setForm(profileFormFrom(user));
  }, [user, editing]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startEdit = () => {
    setForm(profileFormFrom(user));
    setProfileMessage(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(profileFormFrom(user));
    setEditing(false);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileMessage(null);

    if (!form.name.trim()) {
      setProfileMessage({ type: 'error', text: 'Nama lengkap wajib diisi.' });
      return;
    }

    setSaving(true);

    try {
      const data = await api('/auth/me', {
        method: 'PATCH',
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          area_id: form.area_id ? Number(form.area_id) : null,
        },
      });

      setUser({ ...data.user, role: data.user.role === 'petugas' ? 'pengelola' : data.user.role });
      setEditing(false);
      setProfileMessage({ type: 'success', text: data.message || 'Profil berhasil diperbarui.' });
    } catch (error) {
      setProfileMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.new_password.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Kata sandi baru minimal 8 karakter.' });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi kata sandi baru belum sama.' });
      return;
    }

    setChangingPassword(true);

    try {
      const data = await api('/auth/me/password', {
        method: 'PATCH',
        body: {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        },
      });

      setPasswordForm(emptyPasswordForm);
      setPasswordMessage({ type: 'success', text: data.message || 'Kata sandi berhasil diganti.' });
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message });
    } finally {
      setChangingPassword(false);
    }
  };

  const areaLabel = user?.village_name
    ? [user.village_name, user.district_name].filter(Boolean).join(', ')
    : '-';

  return (
    <CitizenLayout
      title="Profil saya"
      subtitle="Informasi akun warga yang tersimpan di LAPORMAS."
    >
      <div className="profile-card">
        <div className="profile-avatar">
          {user?.name?.slice(0, 1) || 'W'}
        </div>

        <h2>{user?.name}</h2>

        <span className="role-pill">
          Warga terdaftar
        </span>

        <Message message={profileMessage} />

        {!editing ? (
          <>
            <div className="profile-grid">
              <div>
                <span>Nama lengkap</span>
                <b>{user?.name || '-'}</b>
              </div>

              <div>
                <span>Email</span>
                <b>{user?.email || '-'}</b>
              </div>

              <div>
                <span>Nomor telepon</span>
                <b>{user?.citizen_phone || user?.phone || '-'}</b>
              </div>

              <div>
                <span>Alamat</span>
                <b>{user?.address || '-'}</b>
              </div>

              <div>
                <span>Area tempat tinggal</span>
                <b>{areaLabel}</b>
              </div>

              <div>
                <span>Status area</span>
                <b>
                  {user?.citizen_area_id || user?.area_id
                    ? 'Sudah dipilih'
                    : 'Belum dipilih'}
                </b>
              </div>
            </div>

            <div className="form-actions profile-actions">
              <button type="button" className="btn btn-primary" onClick={startEdit}>
                <Pencil size={15} aria-hidden="true" /> Ubah profil
              </button>
            </div>
          </>
        ) : (
          <form className="form-stack profile-form" onSubmit={saveProfile}>
            <label>
              Nama lengkap *
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                maxLength={150}
                required
              />
            </label>

            <div className="field-grid">
              <label>
                Email
                <input value={user?.email || ''} disabled />
                <small className="field-note">Email tidak dapat diubah.</small>
              </label>

              <label>
                Nomor telepon
                <input
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="Contoh: 081234567890"
                  inputMode="tel"
                />
              </label>
            </div>

            <label>
              Alamat
              <textarea
                rows="3"
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW"
              />
            </label>

            <label>
              Area tempat tinggal
              <select
                value={form.area_id}
                onChange={(event) => updateField('area_id', event.target.value)}
              >
                <option value="">Pilih desa/kelurahan</option>
                {areas.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.village_name}, {area.district_name} ({area.regency_name})
                  </option>
                ))}
              </select>
            </label>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan perubahan'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
                Batal
              </button>
            </div>
          </form>
        )}

        <div className="notice info">
          <MapPin />
          <span>
            Area profil digunakan sebagai informasi tempat tinggal.
            Setiap laporan tetap menggunakan GPS lokasi kejadian
            saat laporan dibuat.
          </span>
        </div>
      </div>

      <div className="profile-card profile-password">
        <h3>
          <KeyRound size={18} aria-hidden="true" /> Ganti kata sandi
        </h3>

        <Message message={passwordMessage} />

        <form className="form-stack" onSubmit={savePassword}>
          <label>
            Kata sandi lama
            <input
              type="password"
              autoComplete="current-password"
              value={passwordForm.current_password}
              onChange={(event) => setPasswordForm((f) => ({ ...f, current_password: event.target.value }))}
              required
            />
          </label>

          <div className="field-grid">
            <label>
              Kata sandi baru
              <input
                type="password"
                autoComplete="new-password"
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((f) => ({ ...f, new_password: event.target.value }))}
                placeholder="Minimal 8 karakter"
                required
              />
            </label>

            <label>
              Ulangi kata sandi baru
              <input
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((f) => ({ ...f, confirm_password: event.target.value }))}
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={changingPassword}>
              {changingPassword ? 'Menyimpan...' : 'Ganti kata sandi'}
            </button>
          </div>
        </form>
      </div>
    </CitizenLayout>
  );
}
