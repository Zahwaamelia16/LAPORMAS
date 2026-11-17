import { Filter, Search } from 'lucide-react';

export default function PublicReportFilters({ areas, categories, statuses, filters, setFilters, onReset }) {
  const regencies = [...new Set(areas.map((area) => area.regency_name))];
  const districts = [...new Set(areas
    .filter((area) => !filters.regency || area.regency_name === filters.regency)
    .map((area) => area.district_name))];
  const villages = areas.filter((area) =>
    (!filters.regency || area.regency_name === filters.regency)
    && (!filters.district || area.district_name === filters.district));

  const update = (key, value) => setFilters((current) => ({
    ...current,
    [key]: value,
    ...(key === 'regency' ? { district: '', village: '' } : {}),
    ...(key === 'district' ? { village: '' } : {}),
  }));

  return (
    <div className="filter-panel">
      <div className="filter-title">
        <Filter size={17} />
        <b>Filter laporan</b>
        <button className="text-link" onClick={onReset}>Reset</button>
      </div>
      <div className="filter-grid">
        <label>Kabupaten / Kota<select value={filters.regency} onChange={(event) => update('regency', event.target.value)}><option value="">Semua wilayah</option>{regencies.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label>Kecamatan<select value={filters.district} onChange={(event) => update('district', event.target.value)} disabled={!filters.regency}><option value="">Semua kecamatan</option>{districts.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label>Desa / Kelurahan<select value={filters.village} onChange={(event) => update('village', event.target.value)} disabled={!filters.district}><option value="">Semua desa/kelurahan</option>{villages.map((area) => <option key={area.area_id} value={area.village_name}>{area.village_name}</option>)}</select></label>
        <label>Kategori<select value={filters.category} onChange={(event) => update('category', event.target.value)}><option value="">Semua kategori</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</select></label>
        <label>Status<select value={filters.status} onChange={(event) => update('status', event.target.value)}><option value="">Semua status</option>{statuses.map((status) => <option key={status.status_id} value={status.status_id}>{status.status_name}</option>)}</select></label>
        <label className="search-field">Cari laporan<div><Search size={16} /><input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Judul atau nomor laporan" /></div></label>
      </div>
    </div>
  );
}