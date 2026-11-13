import { demoApi } from './demoApi';

export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || 'http://localhost:4000';

export async function api(path, options = {}) {
  if (IS_DEMO_MODE) return demoApi(path, options);
  const token = localStorage.getItem('lapormas_token');
  const isForm = options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };
  if (!isForm && options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined && !isForm && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Terjadi kesalahan saat menghubungi server.');
  return data;
}

export function imageUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${UPLOAD_URL}${path}`;
}

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Browser ini tidak mendukung GPS.'));
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
      (error) => {
        const messages = {
          1: 'Izin lokasi ditolak. Aktifkan izin lokasi untuk website ini di pengaturan browser.',
          2: 'Lokasi belum dapat ditemukan. Coba aktifkan GPS dan periksa koneksi.',
          3: 'Waktu pencarian lokasi habis. Coba tekan deteksi lokasi kembali.',
        };
        reject(new Error(messages[error.code] || 'Gagal mendeteksi lokasi.'));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });
}

export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}
