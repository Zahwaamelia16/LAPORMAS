# LAPORMAS — Panduan Frontend

Tahap ini berfokus pada penyelesaian tampilan dan interaksi frontend. Folder `backend/` dan `database/` tidak perlu dijalankan atau diubah untuk mencoba mode pratinjau.

## 1. Menjalankan frontend saja

Buka terminal di VS Code, lalu jalankan:

```bash
cd lapormas-project/frontend
cp .env.example .env
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

Pastikan `.env` memiliki:

```env
VITE_DEMO_MODE=true
```

Mode ini menggunakan data contoh di browser (localStorage), sehingga belum membutuhkan Express maupun PostgreSQL.

## 2. Akun untuk mencoba tampilan

Gunakan salah satu email berikut. Dalam mode pratinjau, kata sandi dapat diisi bebas.

| Role | Email |
|---|---|
| Warga | `warga@lapormas.id` |
| Pengelola | `pengelola@lapormas.id` |
| Admin | `admin@lapormas.id` |

Akses admin tersedia melalui tautan **Masuk sebagai admin** pada halaman login. Pendaftaran admin publik tidak disediakan.

## 3. Halaman yang dapat dicoba

- Publik: Beranda, Laporan publik, Detail laporan, Pelacakan laporan, Cara melapor, Tentang kami.
- Autentikasi: Login Warga/Pengelola/Admin, Registrasi Warga, Pengajuan Pengelola.
- Warga: Ringkasan, Laporan saya, Buat laporan, Profil.
- Pengelola: Ringkasan, Laporan publik, Laporan area tugas, Detail penanganan.
- Admin: Ringkasan, Semua laporan, Verifikasi pengelola, Data pengguna.

Form yang meminta GPS tetap memerlukan izin lokasi browser. Untuk localhost, browser modern umumnya mengizinkan akses geolocation.

## 4. Mengembalikan koneksi ke backend

Saat Express API siap digunakan, ubah `.env` menjadi:

```env
VITE_DEMO_MODE=false
VITE_API_URL=http://localhost:4000/api
VITE_UPLOAD_URL=http://localhost:4000
```

Setelah mengubah `.env`, jalankan ulang server Vite.

## 5. Mereset data pratinjau

Data laporan dan pengajuan contoh tersimpan di localStorage browser. Untuk mengulang demo dari kondisi awal, hapus key localStorage yang diawali `lapormas_demo_` dan `lapormas_token` melalui Developer Tools browser.

> Catatan: data pada mode pratinjau hanya untuk pengujian tampilan dan alur UI. Data tersebut bukan data layanan nyata dan tidak disimpan ke PostgreSQL.
