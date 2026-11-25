
import { Filter, Search, RotateCcw } from 'lucide-react';

export default function PublicReportFilters({
  areas,
  categories,
  statuses,
  filters,
  setFilters,
}) {
  const safeAreas = areas || [];
  const safeCategories = categories || [];
  const safeStatuses = statuses || [];

  const regencies = [
    ...new Set(safeAreas.map((area) => area.regency_name).filter(Boolean)),
  ];

  const districts = [
    ...new Set(
      safeAreas
        .filter(
          (area) =>
            !filters.regency ||
            area.regency_name === filters.regency
        )
        .map((area) => area.district_name)
        .filter(Boolean)
    ),
  ];

  const villages = safeAreas.filter(
    (area) =>
      (!filters.regency ||
        area.regency_name === filters.regency) &&
      (!filters.district ||
        area.district_name === filters.district)
  );

  const update = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'regency'
        ? { district: '', village: '' }
        : {}),
      ...(key === 'district'
        ? { village: '' }
        : {}),
    }));
  };

  const resetArea = () => {
    setFilters((current) => ({
      ...current,
      regency: '',
      district: '',
      village: '',
    }));
  };

  return (
    <div className="public-report-filters">

      {/* PENCARIAN DAN FILTER UTAMA */}
      <div className="public-filter-toolbar">

        <div className="public-search-control">
          <Search size={17} aria-hidden="true" />

          <input
            type="text"
            aria-label="Cari laporan"
            placeholder="Cari judul, lokasi, atau nomor laporan"
            value={filters.search}
            onChange={(event) =>
              update('search', event.target.value)
            }
          />
        </div>

        <select
          aria-label="Filter kategori"
          value={filters.category}
          onChange={(event) =>
            update('category', event.target.value)
          }
        >
          <option value="">Semua kategori</option>

          {safeCategories.map((category) => (
            <option
              key={category.category_id}
              value={category.category_id}
            >
              {category.category_name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter status"
          value={filters.status}
          onChange={(event) =>
            update('status', event.target.value)
          }
        >
          <option value="">Semua status</option>

          {safeStatuses.map((status) => (
            <option
              key={status.status_id}
              value={status.status_id}
            >
              {status.status_name}
            </option>
          ))}
        </select>

      </div>

      {/* FILTER WILAYAH */}
      <section className="public-area-filter">

        <div className="public-area-filter-heading">
          <div>
            <Filter size={17} aria-hidden="true" />
            <b>Filter wilayah</b>
          </div>

          <button
            type="button"
            onClick={resetArea}
          >
            <RotateCcw size={13} />
            Reset Wilayah
          </button>
        </div>

        <div className="public-area-selects">

          <select
            aria-label="Kabupaten atau kota"
            value={filters.regency}
            onChange={(event) =>
              update('regency', event.target.value)
            }
          >
            <option value="">Semua kabupaten/kota</option>

            {regencies.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            aria-label="Kecamatan"
            value={filters.district}
            onChange={(event) =>
              update('district', event.target.value)
            }
            disabled={!filters.regency}
          >
            <option value="">Semua kecamatan</option>

            {districts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            aria-label="Desa atau kelurahan"
            value={filters.village}
            onChange={(event) =>
              update('village', event.target.value)
            }
            disabled={!filters.district}
          >
            <option value="">Semua desa/kelurahan</option>

            {villages.map((area) => (
              <option
                key={area.area_id}
                value={area.village_name}
              >
                {area.village_name}
              </option>
            ))}
          </select>

        </div>
      </section>

    </div>
  );
}
