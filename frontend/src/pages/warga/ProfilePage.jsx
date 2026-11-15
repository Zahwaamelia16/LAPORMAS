
import { MapPin } from 'lucide-react';

import { useAuth } from '../../auth';
import CitizenLayout from '../../layouts/CitizenLayout';

export default function ProfilePageModule() {
  const { user } = useAuth();

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
            <b>{user?.citizen_phone || '-'}</b>
          </div>

          <div>
            <span>Alamat</span>
            <b>{user?.address || '-'}</b>
          </div>

          <div>
            <span>Area profil</span>
            <b>{user?.village_name || '-'}</b>
          </div>

          <div>
            <span>Status lokasi</span>
            <b>
              {user?.citizen_area_id
                ? 'Terverifikasi'
                : 'Belum tersedia'}
            </b>
          </div>
        </div>

        <div className="notice info">
          <MapPin />
          <span>
            Area profil digunakan sebagai informasi tempat tinggal.
            Setiap laporan tetap menggunakan GPS lokasi kejadian
            saat laporan dibuat.
          </span>
        </div>
      </div>
    </CitizenLayout>
  );
}
