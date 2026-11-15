
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  FileImage,
  LocateFixed,
  UploadCloud,
  ShieldCheck,
  X,
} from 'lucide-react';

import { api, getPosition } from '../../api';
import CitizenLayout from '../../layouts/CitizenLayout';

// Notifikasi
function Notice({ type = 'info', children }) {
  if (!children) return null;

  return (
    <div className={`notice ${type}`} role="status">
      {type === 'success'
        ? <CheckCircle2 size={18} />
        : <AlertTriangle size={18} />
      }
      <span>{children}</span>
    </div>
  );
}

// Preview foto lokal
function LocalImagePreview({ file, alt }) {
  const [source, setSource] = useState('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setSource(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return source ? (
    <img
      className="local-image-preview"
      src={source}
      alt={alt || file.name}
    />
  ) : null;
}

// Header dan progress form
function ReportPageIntro({ step }) {
  return (
    <section className="page-intro">
      <div className="container">
        <div className="eyebrow">WARGA / BUAT LAPORAN</div>

        <h1>Ceritakan masalah di sekitarmu.</h1>

        <p>
          Laporan yang jelas membantu pihak terkait mengambil
          tindakan yang tepat.
        </p>

        <div className="progress-steps">
          <span className={step === 1 ? 'current' : 'done'}>
            01 Isi laporan
          </span>

          <span className={step === 2 ? 'current' : ''}>
            02 Tinjau laporan
          </span>

          <span>03 Laporan terkirim</span>
        </div>
      </div>
    </section>
  );
}

// Halaman pembuatan laporan
export default function NewReportPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: '',
    category_id: '',
    location: '',
    description: '',
  });

  const [position, setPosition] = useState(null);
  const [locBusy, setLocBusy] = useState(false);

  const [locMessage, setLocMessage] = useState(
    'Lokasi kejadian wajib dideteksi menggunakan GPS.'
  );

  const [files, setFiles] = useState([]);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Mengambil kategori laporan dari API
  useEffect(() => {
    api('/categories')
      .then((data) => {
        setCategories(data.categories || []);

        const categoryName = new URLSearchParams(
          location.search
        ).get('category');

        if (categoryName) {
          const match = data.categories.find(
            (category) =>
              category.category_name.toLowerCase() ===
              categoryName.toLowerCase()
          );

          if (match) {
            setForm((old) => ({
              ...old,
              category_id: String(match.category_id),
            }));
          }
        }
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat kategori laporan.');
      });
  }, [location.search]);

  // Memperbarui input form
  const update = (key, value) => {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  };

  // Deteksi lokasi GPS
  const detect = async () => {
    setLocBusy(true);
    setError('');

    try {
      const positionData = await getPosition();

      setPosition(positionData);

      setLocMessage(
        `Koordinat kejadian ditemukan · akurasi ±${Math.round(
          positionData.accuracy
        )} meter.`
      );
    } catch (err) {
      setPosition(null);
      setLocMessage(err.message);
    } finally {
      setLocBusy(false);
    }
  };

  // Validasi foto
  const onFiles = (event) => {
    const selected = Array.from(event.target.files || []);

    if (selected.length > 3) {
      setError('Maksimal 3 foto dalam satu laporan.');
      event.target.value = '';
      return;
    }

    if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
      setError('Ukuran setiap foto maksimal 5 MB.');
      event.target.value = '';
      return;
    }

    if (
      selected.some(
        (file) =>
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      )
    ) {
      setError('Format foto harus JPG, PNG, atau WEBP.');
      event.target.value = '';
      return;
    }

    setFiles(selected);
    setError('');
  };

  // Menghapus foto pilihan
  const removeFile = (index) => {
    setFiles((old) => old.filter((_, i) => i !== index));
  };

  // Mengirim laporan ke backend
  const submit = async () => {
    if (!position) {
      setError('Deteksi GPS lokasi kejadian terlebih dahulu.');
      setStep(1);
      return;
    }

    setBusy(true);
    setError('');

    const body = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      body.append(key, value);
    });

    body.append('latitude', position.latitude);
    body.append('longitude', position.longitude);

    files.forEach((file) => {
      body.append('images', file);
    });

    try {
      const data = await api('/reports', {
        method: 'POST',
        body,
      });

      navigate(
        `/laporan-terkirim/${data.report.report_code}`,
        {
          state: {
            report: data.report,
          },
        }
      );
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CitizenLayout
      title="Buat laporan"
      subtitle="Sampaikan masalah yang kamu temukan di lingkungan sekitar."
    >
      <ReportPageIntro step={step} />

      <main className="container section create-layout">
        <section className="form-card">
          <h2>
            {step === 1 ? 'Detail laporan' : 'Tinjau laporan'}
          </h2>

          <p className="form-hint">
            Kolom bertanda * wajib diisi.
          </p>

          {step === 1 ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setError('');

                if (!position) {
                  setError(
                    'Deteksi GPS lokasi kejadian terlebih dahulu.'
                  );
                  return;
                }

                setStep(2);
              }}
            >
              <label>
                Judul laporan *
                <input
                  value={form.title}
                  onChange={(event) =>
                    update('title', event.target.value)
                  }
                  placeholder="Contoh: Jalan berlubang di depan taman"
                  required
                />
              </label>

              <div className="field-grid">
                <label>
                  Kategori masalah *
                  <select
                    value={form.category_id}
                    onChange={(event) =>
                      update('category_id', event.target.value)
                    }
                    required
                  >
                    <option value="">Pilih kategori</option>

                    {categories.map((category) => (
                      <option
                        key={category.category_id}
                        value={category.category_id}
                      >
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Lokasi kejadian *

                  <button
                    type="button"
                    className={`gps-button ${
                      position ? 'detected' : ''
                    }`}
                    onClick={detect}
                    disabled={locBusy}
                  >
                    <LocateFixed size={16} />

                    {locBusy
                      ? 'Mendeteksi lokasi...'
                      : position
                        ? 'Lokasi berhasil dideteksi'
                        : 'Deteksi lokasi GPS'}
                  </button>

                  <small className="field-note">
                    {locMessage}
                  </small>
                </label>
              </div>

              <label>
                Lokasi lengkap *
                <input
                  value={form.location}
                  onChange={(event) =>
                    update('location', event.target.value)
                  }
                  placeholder="Nama jalan, RT/RW, atau patokan terdekat"
                  required
                />
              </label>

              <label>
                Deskripsi kejadian *
                <textarea
                  rows="5"
                  value={form.description}
                  onChange={(event) =>
                    update('description', event.target.value)
                  }
                  placeholder="Ceritakan masalah yang terjadi, sejak kapan, dan dampaknya bagi warga sekitar."
                  required
                />

                <small className="field-note">
                  Tuliskan informasi yang faktual dan hindari
                  data pribadi orang lain.
                </small>
              </label>

              <label>
                Foto pendukung (opsional)

                <div className="file-drop">
                  <UploadCloud />

                  <b>+ Tambahkan foto</b>
                  <span>Pilih foto atau tarik ke area ini</span>

                  <small>
                    JPG, PNG, WEBP · Maks. 3 foto,
                    masing-masing 5 MB
                  </small>

                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onFiles}
                  />
                </div>

                {files.length > 0 && (
                  <div className="selected-files">
                    {files.map((file, index) => (
                      <span
                        className="selected-file-item"
                        key={`${file.name}-${index}`}
                      >
                        <LocalImagePreview
                          file={file}
                          alt={`Pratinjau ${file.name}`}
                        />

                        <span className="selected-file-name">
                          <FileImage size={13} />
                          {file.name}
                        </span>

                        <button
                          type="button"
                          aria-label={`Hapus ${file.name}`}
                          onClick={() => removeFile(index)}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </label>

              <div className="privacy-note">
                <ShieldCheck />

                <div>
                  <b>Privasi kamu tetap terjaga</b>
                  <span>
                    Nama dan kontak pelapor tidak ditampilkan
                    pada laporan publik.
                  </span>
                </div>
              </div>

              {error && (
                <Notice type="error">{error}</Notice>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Tinjau laporan <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate('/warga')}
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="review-panel">
              <div className="review-row">
                <span>Judul</span>
                <b>{form.title}</b>
              </div>

              <div className="review-row">
                <span>Kategori</span>
                <b>
                  {categories.find(
                    (category) =>
                      String(category.category_id) ===
                      String(form.category_id)
                  )?.category_name}
                </b>
              </div>

              <div className="review-row">
                <span>Alamat kejadian</span>
                <b>{form.location}</b>
              </div>

              <div className="review-row">
                <span>Koordinat GPS</span>
                <b>
                  {position.latitude.toFixed(6)},{' '}
                  {position.longitude.toFixed(6)}
                </b>
              </div>

              <div className="review-row vertical">
                <span>Deskripsi</span>
                <p>{form.description}</p>
              </div>

              <div className="review-row">
                <span>Foto pendukung</span>
                <b>{files.length} foto</b>
              </div>

              <Notice type="info">
                Lokasi kejadian akan dicocokkan dengan batas
                wilayah untuk menentukan area laporan.
              </Notice>

              {error && (
                <Notice type="error">{error}</Notice>
              )}

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={submit}
                >
                  {busy ? 'Mengirim...' : 'Kirim laporan'}
                </button>

                <button
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => setStep(1)}
                >
                  Kembali edit
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="create-aside">
          <div className="aside-guide">
            <h3>Bantu kami memahami masalahnya.</h3>

            <div>
              <b>01 Jelas dan spesifik</b>
              <span>
                Ceritakan satu masalah dalam satu laporan.
              </span>
            </div>

            <div>
              <b>02 Lokasi yang tepat</b>
              <span>
                Tambahkan alamat dan patokan agar mudah ditemukan.
              </span>
            </div>

            <div>
              <b>03 Foto yang relevan</b>
              <span>
                Sertakan foto terbaru yang memperlihatkan
                kondisi sebenarnya.
              </span>
            </div>
          </div>

          <div className="emergency-note">
            <b>Bukan layanan darurat</b>
            <p>
              Untuk kondisi yang mengancam keselamatan,
              segera hubungi layanan darurat atau petugas setempat.
            </p>
          </div>

          <div className="aside-after">
            <h3>Setelah laporan dikirim</h3>
            <p>
              Kamu akan mendapatkan nomor laporan untuk
              memantau proses verifikasi dan penanganannya.
            </p>
          </div>
        </aside>
      </main>
    </CitizenLayout>
  );
}
