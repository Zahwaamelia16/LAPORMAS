
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileText,
  MapPin,
  ShieldCheck,
  X,
} from 'lucide-react';

import { api, getPosition } from '../../api';
import { useAuth } from '../../auth';
import CitizenLayout from '../../layouts/WargaLayout';
import CustomSelect from '../../components/CustomSelect';
import ReportLocationPicker from '../../components/ReportLocationPicker';

// Notifikasi error
function Notice({ children }) {
  if (!children) return null;

  return (
    <div className="notice error" role="alert">
      <AlertTriangle size={17} />
      <span>{children}</span>
    </div>
  );
}

// Preview foto lokal
function LocalImagePreview({ file }) {
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
      alt={`Pratinjau ${file.name}`}
    />
  ) : null;
}

export default function NewReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: '',
    category_id: '',
    area_id: '',
    location: '',
    description: '',
  });

  const [position, setPosition] = useState(null);
  const [locBusy, setLocBusy] = useState(false);

  const [areaLookup, setAreaLookup] = useState(null);
  const [areaLookupBusy, setAreaLookupBusy] = useState(false);
  const [areaLookupError, setAreaLookupError] = useState('');

  const [files, setFiles] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Mengambil kategori laporan dari database
  useEffect(() => {
    let active = true;

    api('/categories')
      .then((data) => {
        if (active) setCategories(data.categories || []);
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Gagal memuat kategori laporan.');
        }
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Memperbarui field form
  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // Memperbarui titik lokasi dari peta atau GPS
  const changePosition = (nextPosition) => {
    setPosition(nextPosition);

    // Area lama tidak boleh dipakai setelah pin dipindahkan
    setAreaLookup(null);
    setAreaLookupError('');
    setAreaLookupBusy(true);

    setForm((current) => ({
      ...current,
      area_id: '',
    }));
  };

  // Mencocokkan koordinat dengan wilayah LAPORMAS
  useEffect(() => {
    if (!position) return undefined;

    let active = true;

    const timer = setTimeout(async () => {
      try {
        const result = await api('/auth/reverse-geocode', {
          method: 'POST',
          body: {
            latitude: position.latitude,
            longitude: position.longitude,
          },
        });

        if (!active) return;

        setAreaLookup(result);

        if (result.isAreaMatched && result.matchedArea?.area_id) {
          setForm((current) => ({
            ...current,
            area_id: String(result.matchedArea.area_id),
          }));

          setAreaLookupError('');
        } else {
          setForm((current) => ({
            ...current,
            area_id: '',
          }));

          setAreaLookupError(
            'Titik ini belum cocok dengan wilayah layanan LAPORMAS. Coba pilih titik lain.'
          );
        }
      } catch (err) {
        if (active) {
          setAreaLookup(null);
          setAreaLookupError(
            err.message || 'Gagal mendeteksi wilayah dari titik peta.'
          );

          setForm((current) => ({
            ...current,
            area_id: '',
          }));
        }
      } finally {
        if (active) setAreaLookupBusy(false);
      }
    }, 700);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [position?.latitude, position?.longitude]);

  // Menggunakan GPS sebagai titik awal peta
  const detectMyLocation = async () => {
    setLocBusy(true);
    setError('');

    try {
      const gpsPosition = await getPosition();
      changePosition(gpsPosition);
    } catch (err) {
      setError(err.message || 'Gagal mendapatkan lokasi GPS.');
    } finally {
      setLocBusy(false);
    }
  };

  // Memilih foto pendukung
  const onFiles = (event) => {
    const selected = Array.from(event.target.files || []);

    if (files.length + selected.length > 3) {
      setError('Maksimal 3 foto untuk setiap laporan.');
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
        (file) => !['image/jpeg', 'image/png'].includes(file.type)
      )
    ) {
      setError('Format foto harus JPG atau PNG.');
      event.target.value = '';
      return;
    }

    setFiles((current) => [...current, ...selected]);
    setError('');
    event.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  // Menggunakan alamat hasil peta sebagai referensi alamat
  const useMapAddress = () => {
    if (!areaLookup?.displayAddress) return;

    setForm((current) => ({
      ...current,
      location: areaLookup.displayAddress,
    }));
  };

  // Mengirim laporan
  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Judul laporan wajib diisi.');
      return;
    }

    if (!form.category_id) {
      setError('Pilih kategori masalah terlebih dahulu.');
      return;
    }

    if (!position) {
      setError('Tentukan titik lokasi kejadian pada peta terlebih dahulu.');
      return;
    }

    if (areaLookupBusy) {
      setError('Sedang mendeteksi wilayah. Tunggu sampai proses selesai.');
      return;
    }

    if (!areaLookup?.isAreaMatched || !areaLookup?.matchedArea?.area_id) {
      setError('Titik lokasi belum cocok dengan wilayah layanan LAPORMAS. Pilih titik lain.');
      return;
    }

    if (!form.location.trim()) {
      setError('Alamat atau patokan lokasi kejadian wajib diisi.');
      return;
    }

    if (!form.description.trim()) {
      setError('Deskripsi kejadian wajib diisi.');
      return;
    }

    setBusy(true);

    try {
      const body = new FormData();

      body.append('title', form.title.trim());
      body.append('category_id', form.category_id);
      body.append('area_id', String(areaLookup.matchedArea.area_id));
      body.append('location', form.location.trim());
      body.append('description', form.description.trim());

      body.append('latitude', String(position.latitude));
      body.append('longitude', String(position.longitude));

      files.forEach((file) => {
        body.append('images', file);
      });

      const data = await api('/reports', {
        method: 'POST',
        body,
      });

      const report = data.report || data.data;
      const reportCode = report?.report_code;

      if (!reportCode) {
        throw new Error('Nomor laporan tidak diterima dari server.');
      }

      navigate(`/laporan-terkirim/${reportCode}`, {
        state: { report },
      });
    } catch (err) {
      setError(err.message || 'Gagal mengirim laporan.');
    } finally {
      setBusy(false);
    }
  };

  const reporterName = user?.name || '';
  const reporterContact =
    user?.citizen_phone ||
    user?.phone ||
    user?.email ||
    '';

  const detectedArea = areaLookup?.matchedArea;
  const administrative = detectedArea || areaLookup?.administrative;

  return (
    <CitizenLayout
      title="Form laporan warga"
      subtitle="Berikan informasi selengkap mungkin agar laporan dapat diverifikasi dan diarahkan kepada petugas yang tepat."
      heroVariant="form"
      heroContent={<></>}
    >
      <form
        className="citizen-report-form"
        onSubmit={submit}
      >
        {/* DETAIL LAPORAN */}
        <section className="citizen-form-card">
          <div className="citizen-form-section-heading">
            <span className="citizen-form-section-icon">
              <FileText size={17} />
            </span>

            <div>
              <h2>Detail laporan</h2>
              <p>Ceritakan masalah dan lokasi kejadian dengan jelas.</p>
            </div>
          </div>

          <div className="citizen-form-fields">
            <label>
              Judul laporan
              <input
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="Contoh: Jalan berlubang di dekat Pasar Sukamaju"
                maxLength={150}
                required
              />
            </label>

            <label>
              Kategori masalah
              <CustomSelect
                value={form.category_id}
                onChange={(event) => update('category_id', event.target.value)}
                placeholder="Pilih kategori"
                disabled={loadingCategories}
                required
              >
                <option value="">Pilih kategori</option>

                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={String(category.category_id)}
                  >
                    {category.category_name}
                  </option>
                ))}
              </CustomSelect>
            </label>

            {/* PILIH TITIK KEJADIAN */}
            <div className="citizen-form-field">
              <span className="citizen-form-label">
                Titik lokasi kejadian
              </span>

              <p className="citizen-form-hint">
                Klik peta untuk memasang pin atau geser pin ke titik masalah yang sebenarnya.
              </p>

              <ReportLocationPicker
                position={position}
                onChange={changePosition}
                onUseMyLocation={detectMyLocation}
                detecting={locBusy}
              />

              {/* STATUS DETEKSI WILAYAH */}
              <div className="report-area-result">
                {areaLookupBusy ? (
                  <div className="report-area-loading">
                    <span className="report-area-spinner" />
                    Mendeteksi kelurahan, kecamatan, dan kota...
                  </div>
                ) : detectedArea ? (
                  <div className="report-area-success">
                    <CheckCircle2 size={17} />

                    <div>
                      <b>Wilayah berhasil ditemukan</b>

                      <div className="report-area-grid">
                        <div>
                          <span>Kelurahan</span>
                          <strong>{detectedArea.village_name}</strong>
                        </div>

                        <div>
                          <span>Kecamatan</span>
                          <strong>{detectedArea.district_name}</strong>
                        </div>

                        <div>
                          <span>Kota/Kabupaten</span>
                          <strong>{detectedArea.regency_name}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : position && areaLookupError ? (
                  <div className="report-area-error">
                    <AlertTriangle size={17} />
                    <span>{areaLookupError}</span>
                  </div>
                ) : position && areaLookup?.administrative ? (
                  <div className="report-area-error">
                    <AlertTriangle size={17} />
                    <span>
                      Wilayah terdeteksi:
                      {' '}
                      {[
                        areaLookup.administrative.village,
                        areaLookup.administrative.district,
                        areaLookup.administrative.regency,
                      ].filter(Boolean).join(', ')}
                      . Namun, wilayah tersebut belum terdaftar di layanan LAPORMAS.
                    </span>
                  </div>
                ) : (
                  <div className="report-area-pending">
                    Wilayah kelurahan, kecamatan, dan kota akan muncul setelah titik dipilih.
                  </div>
                )}
              </div>

              {areaLookup?.displayAddress && (
                <div className="report-map-address-suggestion">
                  <div>
                    <b>Alamat perkiraan dari peta</b>
                    <p>{areaLookup.displayAddress}</p>
                  </div>

                  <button
                    type="button"
                    onClick={useMapAddress}
                  >
                    Gunakan alamat
                  </button>
                </div>
              )}
            </div>

            <label>
              Lokasi lengkap
              <input
                value={form.location}
                onChange={(event) => update('location', event.target.value)}
                placeholder="Nama jalan, nomor bangunan, RT/RW, atau patokan terdekat"
                required
              />
              <small className="citizen-form-hint">
                Tambahkan patokan agar petugas lebih mudah menemukan lokasi.
              </small>
            </label>

            <label>
              Deskripsi kejadian
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                placeholder="Jelaskan kondisi, kapan ditemukan, dan dampak yang ditimbulkan..."
                required
              />

              <small className="citizen-form-hint">
                Hindari menyertakan data pribadi orang lain dalam deskripsi.
              </small>
            </label>

            {/* FOTO PENDUKUNG */}
            <div className="citizen-form-field">
              <span className="citizen-form-label">Foto pendukung</span>

              <label className="citizen-form-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={onFiles}
                  disabled={busy}
                />

                <span className="citizen-form-upload-icon">
                  <Camera size={19} />
                </span>

                <b>Pilih atau ambil foto</b>
                <small>JPG atau PNG · Maksimal 5 MB per foto · Maksimal 3 foto</small>
              </label>

              {files.length > 0 && (
                <div className="citizen-selected-files">
                  {files.map((file, index) => (
                    <div
                      className="citizen-selected-file"
                      key={`${file.name}-${index}`}
                    >
                      <LocalImagePreview file={file} />

                      <div>
                        <b>{file.name}</b>
                        <span>
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        aria-label={`Hapus ${file.name}`}
                        disabled={busy}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* KONTAK PELAPOR */}
        <section className="citizen-form-card">
          <div className="citizen-form-section-heading">
            <span className="citizen-form-section-icon">
              <ShieldCheck size={17} />
            </span>

            <div>
              <h2>Kontak pelapor</h2>
              <p>Digunakan petugas jika membutuhkan konfirmasi lebih lanjut.</p>
            </div>
          </div>

          <div className="citizen-form-fields">
            <label>
              Nama lengkap
              <input value={reporterName} readOnly />
            </label>

            <label>
              Nomor telepon atau email
              <input value={reporterContact} readOnly />
            </label>
          </div>

          <div className="citizen-contact-privacy">
            <ShieldCheck size={14} />
            <span>
              Data kontak tidak akan ditampilkan pada halaman Laporan Publik
              dan hanya digunakan untuk keperluan verifikasi laporan.
            </span>
          </div>
        </section>

        {error && <Notice>{error}</Notice>}

        {/* KIRIM LAPORAN */}
        <section className="citizen-form-submit">
          <button
            type="submit"
            disabled={busy || loadingCategories || areaLookupBusy}
          >
            {busy ? 'Mengirim laporan...' : 'Kirim Laporan'}
            {!busy && <span>→</span>}
          </button>

          <small>
            Dengan mengirim laporan, kamu menyatakan informasi yang diberikan
            sesuai dengan kondisi sebenarnya.
          </small>
        </section>
      </form>
    </CitizenLayout>
  );
}
