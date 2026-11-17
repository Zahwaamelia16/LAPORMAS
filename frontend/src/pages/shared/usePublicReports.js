import { useEffect, useState } from 'react';
import { api } from '../../api';

const EMPTY_FILTERS = {
  regency: '',
  district: '',
  village: '',
  category: '',
  status: '',
  search: '',
};

export function usePublicReports() {
  const [reports, setReports] = useState([]);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api('/areas'), api('/categories'), api('/statuses')])
      .then(([areaData, categoryData, statusData]) => {
        if (!active) return;
        setAreas(areaData.areas);
        setCategories(categoryData.categories);
        setStatuses(statusData.statuses);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    api(`/reports?${params}`)
      .then((data) => {
        if (active) setReports(data.reports || []);
      })
      .catch(() => {
        if (active) setReports([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  const resetFilters = () => setFilters({ ...EMPTY_FILTERS });

  return {
    reports,
    areas,
    categories,
    statuses,
    filters,
    setFilters,
    resetFilters,
    loading,
  };
}