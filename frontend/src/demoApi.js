const STORAGE = {
  reports: 'lapormas_demo_reports',
  requests: 'lapormas_demo_requests',
  users: 'lapormas_demo_users',
  currentUser: 'lapormas_demo_user',
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : clone(fallback);
  } catch {
    return clone(fallback);
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const categories = [
  { category_id: 1, category_name: 'Infrastruktur', description: 'Jalan, trotoar, dan fasilitas umum.' },
  { category_id: 2, category_name: 'Kebersihan', description: 'Sampah dan kebersihan area.' },
  { category_id: 3, category_name: 'Penerangan', description: 'Lampu jalan dan area publik.' },
  { category_id: 4, category_name: 'Drainase', description: 'Saluran air dan genangan.' },
  { category_id: 5, category_name: 'Pohon tumbang', description: 'Pohon tumbang atau ranting berbahaya.' },
];

const statuses = [
  { status_id: 1, status_name: 'Diterima', description: 'Laporan telah diterima sistem.' },
  { status_id: 2, status_name: 'Diverifikasi', description: 'Laporan sedang diperiksa.' },
  { status_id: 3, status_name: 'Diproses', description: 'Laporan sedang ditangani.' },
  { status_id: 4, status_name: 'Selesai', description: 'Penanganan laporan telah selesai.' },
  { status_id: 5, status_name: 'Ditolak', description: 'Laporan tidak dapat ditindaklanjuti.' },
];

const areas = [
  { area_id: 1, village_name: 'Ketintang', district_name: 'Gayungan', regency_name: 'Surabaya' },
  { area_id: 2, village_name: 'Jambangan', district_name: 'Jambangan', regency_name: 'Surabaya' },
  { area_id: 3, village_name: 'Sidosermo', district_name: 'Wonocolo', regency_name: 'Surabaya' },
  { area_id: 4, village_name: 'Sidoharjo', district_name: 'Gedangan', regency_name: 'Sidoarjo' },
  { area_id: 5, village_name: 'Waru', district_name: 'Waru', regency_name: 'Sidoarjo' },
  { area_id: 6, village_name: 'Keputih', district_name: 'Sukolilo', regency_name: 'Surabaya' },
];

const seedReports = [
  {
    report_id: 1,
    report_code: 'LPM-2026-001248',
    user_id: 1,
    category_id: 1,
    category_name: 'Infrastruktur',
    status_id: 3,
    status_name: 'Diproses',
    area_id: 1,
    village_name: 'Ketintang',
    district_name: 'Gayungan',
    regency_name: 'Surabaya',
    title: 'Jalan berlubang di dekat taman warga',
    description: 'Terdapat beberapa lubang pada badan jalan yang cukup dalam. Kondisi ini menyulitkan pengendara, terutama saat malam hari dan setelah hujan.',
    location: 'Jl. Melati, dekat taman RW 04',
    latitude: -7.3152,
    longitude: 112.7348,
    created_at: '2026-11-12T08:30:00.000Z',
    images: [{ image_id: 1, image_url: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80' }],
    updates: [
      { new_status: 'Diverifikasi', notes: 'Lokasi dan kondisi jalan telah diperiksa.', updated_at: '2026-11-12T10:00:00.000Z' },
      { new_status: 'Diproses', notes: 'Diteruskan kepada unit pemeliharaan jalan.', updated_at: '2026-11-13T03:00:00.000Z' },
    ],
  },
  {
    report_id: 2,
    report_code: 'LPM-2026-001247',
    user_id: 2,
    category_id: 2,
    category_name: 'Kebersihan',
    status_id: 1,
    status_name: 'Diterima',
    area_id: 1,
    village_name: 'Ketintang',
    district_name: 'Gayungan',
    regency_name: 'Surabaya',
    title: 'Sampah menumpuk di pinggir jalan',
    description: 'Tumpukan sampah belum diangkut selama beberapa hari dan mulai menimbulkan bau tidak sedap bagi warga sekitar.',
    location: 'Jl. Kenanga, dekat pos RT 02',
    latitude: -7.3161,
    longitude: 112.7332,
    created_at: '2026-11-12T06:45:00.000Z',
    images: [{ image_id: 2, image_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d9a?auto=format&fit=crop&w=1000&q=80' }],
    updates: [],
  },
  {
    report_id: 3,
    report_code: 'LPM-2026-001246',
    user_id: 3,
    category_id: 3,
    category_name: 'Penerangan',
    status_id: 4,
    status_name: 'Selesai',
    area_id: 2,
    village_name: 'Jambangan',
    district_name: 'Jambangan',
    regency_name: 'Surabaya',
    title: 'Lampu jalan kembali menyala',
    description: 'Lampu penerangan jalan sebelumnya mati. Petugas telah melakukan pemeriksaan dan mengganti komponen yang rusak.',
    location: 'Jl. Anggrek, sisi lapangan warga',
    latitude: -7.329,
    longitude: 112.724,
    created_at: '2026-11-11T12:15:00.000Z',
    images: [{ image_id: 3, image_url: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80' }],
    updates: [
      { new_status: 'Diverifikasi', notes: 'Petugas memastikan lampu tidak berfungsi.', updated_at: '2026-11-11T14:00:00.000Z' },
      { new_status: 'Diproses', notes: 'Penggantian komponen penerangan dilakukan.', updated_at: '2026-11-12T02:00:00.000Z' },
      { new_status: 'Selesai', notes: 'Lampu jalan sudah kembali menyala.', updated_at: '2026-11-12T08:00:00.000Z' },
    ],
  },
  {
    report_id: 4,
    report_code: 'LPM-2026-001245',
    user_id: 1,
    category_id: 4,
    category_name: 'Drainase',
    status_id: 2,
    status_name: 'Diverifikasi',
    area_id: 4,
    village_name: 'Sidoharjo',
    district_name: 'Gedangan',
    regency_name: 'Sidoarjo',
    title: 'Saluran air tersumbat setelah hujan',
    description: 'Air menggenang di depan rumah warga karena saluran air tertutup endapan dan sampah.',
    location: 'Jl. Pahlawan, dekat balai RW',
    latitude: -7.389,
    longitude: 112.725,
    created_at: '2026-11-10T09:20:00.000Z',
    images: [],
    updates: [{ new_status: 'Diverifikasi', notes: 'Petugas sedang memastikan kondisi saluran di lokasi.', updated_at: '2026-11-11T01:30:00.000Z' }],
  },
];

const demoUsers = [
  {
    user_id: 1,
    name: 'Zahwa Putri',
    email: 'warga@lapormas.id',
    role: 'warga',
    citizen_phone: '081234567890',
    address: 'Jl. Ketintang, Surabaya',
    village_name: 'Ketintang',
    district_name: 'Gayungan',
    regency_name: 'Surabaya',
    citizen_area_id: 1,
  },
  {
    user_id: 2,
    name: 'Amel Pratama',
    email: 'pengelola@lapormas.id',
    role: 'petugas',
    task_village: 'Ketintang',
    task_district: 'Gayungan',
    task_area_id: 1,
  },
  { user_id: 3, name: 'Admin LAPORMAS', email: 'admin@lapormas.id', role: 'admin' },
];

const defaultRequests = [
  {
    request_id: 1,
    name: 'Dimas Prakoso',
    email: 'dimas@dinas.go.id',
    phone: '081298765432',
    agency: 'Dinas Lingkungan Hidup',
    unit_name: 'UPT Kebersihan Wilayah Selatan',
    office_address: 'Jl. Raya Jemursari, Surabaya',
    village_name: 'Jambangan',
    district_name: 'Jambangan',
    regency_name: 'Surabaya',
    proof_url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1000&q=80',
    status: 'pending',
  },
];

function getReports() {
  return read(STORAGE.reports, seedReports);
}
function getRequests() {
  return read(STORAGE.requests, defaultRequests);
}
function getUsers() {
  return read(STORAGE.users, demoUsers);
}
function currentUser() {
  return read(STORAGE.currentUser, null);
}
function categoryName(id) {
  return categories.find((item) => String(item.category_id) === String(id))?.category_name || 'Lainnya';
}
function statusId(name) {
  return statuses.find((item) => item.status_name === name)?.status_id || 1;
}
function createResponse(data) {
  return Promise.resolve(clone(data));
}
function formValue(body, key) {
  return body instanceof FormData ? body.get(key) : body?.[key];
}

export async function demoApi(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(path, 'http://lapormas.local');
  const pathname = decodeURIComponent(url.pathname.replace(/\/$/, '') || '/');
  const query = url.searchParams;

  if (pathname === '/auth/login' && method === 'POST') {
    const identifier = String(options.body?.identifier || '').trim();
    const role = options.body?.role || 'warga';
    const password = String(options.body?.password || '');
    if (!identifier || !password) throw new Error('Masukkan email/nomor telepon dan kata sandi.');
    const users = getUsers();
    const normalizedIdentifier = identifier.toLowerCase();
    const user = users.find((item) => item.role === role && (String(item.email || '').toLowerCase() === normalizedIdentifier || String(item.citizen_phone || item.phone || '').replaceAll(' ', '') === identifier.replaceAll(' ', ''))) || users.find((item) => item.role === role) || demoUsers.find((item) => item.role === role);
    if (!user) throw new Error('Role akun tidak tersedia pada mode pratinjau.');
    localStorage.setItem('lapormas_demo_user', JSON.stringify(user));
    localStorage.setItem('lapormas_token', `demo-${role}-token`);
    return createResponse({ token: `demo-${role}-token`, user });
  }

  if (pathname === '/auth/me') {
    const user = currentUser();
    if (!user) throw new Error('Sesi pratinjau tidak ditemukan. Silakan masuk kembali.');
    return createResponse({ user });
  }

  if (pathname === '/auth/register/warga' && method === 'POST') {
    const body = options.body || {};
    const users = getUsers();
    const user = {
      user_id: Math.max(0, ...users.map((item) => Number(item.user_id) || 0)) + 1,
      name: body.name,
      email: body.email,
      role: 'warga',
      citizen_phone: body.phone,
      address: body.address,
      village_name: 'Lokasi terdeteksi GPS',
      citizen_area_id: null,
      latitude: body.latitude,
      longitude: body.longitude,
    };
    users.push(user);
    write(STORAGE.users, users);
    return createResponse({ message: 'Pendaftaran demo berhasil. Silakan masuk menggunakan akun warga.' });
  }

  if (pathname === '/auth/register/petugas' && method === 'POST') {
    const body = options.body;
    const requests = getRequests();
    const request = {
      request_id: Math.max(0, ...requests.map((item) => Number(item.request_id) || 0)) + 1,
      name: formValue(body, 'name'),
      email: formValue(body, 'email'),
      phone: formValue(body, 'phone'),
      agency: formValue(body, 'agency'),
      unit_name: formValue(body, 'unit_name'),
      office_address: formValue(body, 'office_address'),
      area_id: formValue(body, 'area_id'),
      proof_url: '',
      status: 'pending',
    };
    requests.unshift(request);
    write(STORAGE.requests, requests);
    return createResponse({ message: 'Pengajuan demo berhasil dikirim dan menunggu verifikasi admin.' });
  }

  if (pathname === '/stats') {
    const reports = getReports();
    const complete = reports.filter((item) => item.status_name === 'Selesai').length;
    return createResponse({ stats: { total: 1248 + reports.length - seedReports.length, completed: 936 + complete - 1, rate: 75, areas: 24 } });
  }

  if (pathname === '/areas') return createResponse({ areas });
  if (pathname === '/categories') return createResponse({ categories });
  if (pathname === '/statuses') return createResponse({ statuses });

  if (pathname === '/reports' && method === 'GET') {
    let reports = getReports();
    const filters = {
      regency: 'regency_name',
      district: 'district_name',
      village: 'village_name',
      category: 'category_id',
      status: 'status_id',
    };
    Object.entries(filters).forEach(([filterKey, field]) => {
      const value = query.get(filterKey);
      if (value) reports = reports.filter((item) => String(item[field]) === String(value));
    });
    const search = (query.get('search') || '').trim().toLowerCase();
    if (search) reports = reports.filter((item) => `${item.report_code} ${item.title} ${item.description}`.toLowerCase().includes(search));
    return createResponse({ reports });
  }

  if (pathname === '/reports/mine' && method === 'GET') {
    const user = currentUser();
    return createResponse({ reports: getReports().filter((item) => item.user_id === user?.user_id) });
  }

  if (pathname === '/reports/assigned' && method === 'GET') {
    const user = currentUser();
    return createResponse({ reports: getReports().filter((item) => !user?.task_area_id || item.area_id === user.task_area_id) });
  }

  if (pathname.startsWith('/reports/track/')) {
    const code = pathname.split('/').pop();
    const report = getReports().find((item) => item.report_code.toLowerCase() === code.toLowerCase());
    if (!report) throw new Error('Nomor laporan tidak ditemukan. Periksa kembali nomor yang kamu masukkan.');
    return createResponse({ report });
  }

  if (pathname === '/reports' && method === 'POST') {
    const body = options.body;
    const reports = getReports();
    const user = currentUser();
    const categoryId = Number(formValue(body, 'category_id')) || 1;
    const reportId = Math.max(0, ...reports.map((item) => Number(item.report_id) || 0)) + 1;
    const lastCodeNumber = Math.max(1248, ...reports.map((item) => Number(String(item.report_code || '').split('-').pop()) || 0));
    const code = `LPM-2026-${String(lastCodeNumber + 1).padStart(6, '0')}`;
    const report = {
      report_id: reportId,
      report_code: code,
      user_id: user?.user_id || 1,
      category_id: categoryId,
      category_name: categoryName(categoryId),
      status_id: 1,
      status_name: 'Diterima',
      area_id: 1,
      village_name: 'Area menunggu pencocokan',
      district_name: '-',
      regency_name: '-',
      title: String(formValue(body, 'title') || 'Laporan baru'),
      description: String(formValue(body, 'description') || ''),
      location: String(formValue(body, 'location') || ''),
      latitude: Number(formValue(body, 'latitude')) || null,
      longitude: Number(formValue(body, 'longitude')) || null,
      created_at: new Date().toISOString(),
      images: [],
      updates: [],
    };
    reports.unshift(report);
    write(STORAGE.reports, reports);
    return createResponse({ report });
  }

  const detailMatch = pathname.match(/^\/reports\/(\d+)$/);
  if (detailMatch && method === 'GET') {
    const report = getReports().find((item) => item.report_id === Number(detailMatch[1]));
    if (!report) throw new Error('Laporan tidak ditemukan.');
    return createResponse({ report });
  }

  const statusMatch = pathname.match(/^\/reports\/(\d+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const reports = getReports();
    const report = reports.find((item) => item.report_id === Number(statusMatch[1]));
    if (!report) throw new Error('Laporan tidak ditemukan.');
    const nextStatus = options.body?.status_name || report.status_name;
    report.status_name = nextStatus;
    report.status_id = statusId(nextStatus);
    report.updates = [...(report.updates || []), {
      new_status: nextStatus,
      notes: options.body?.notes || 'Status diperbarui.',
      updated_at: new Date().toISOString(),
    }];
    write(STORAGE.reports, reports);
    return createResponse({ message: 'Pembaruan berhasil disimpan.', report });
  }

  if (pathname === '/admin/summary') {
    const reports = getReports();
    return createResponse({ summary: {
      total: reports.length,
      received: reports.filter((item) => item.status_name === 'Diterima').length,
      processing: reports.filter((item) => ['Diverifikasi', 'Diproses'].includes(item.status_name)).length,
      completed: reports.filter((item) => item.status_name === 'Selesai').length,
      pending_staff: getRequests().filter((item) => item.status === 'pending').length,
      citizens: getUsers().filter((item) => item.role === 'warga').length,
    } });
  }

  if (pathname === '/admin/staff-requests' && method === 'GET') {
    const filter = query.get('status') || 'pending';
    let requests = getRequests();
    if (filter !== 'semua') requests = requests.filter((item) => item.status === filter);
    return createResponse({ requests });
  }

  const requestMatch = pathname.match(/^\/admin\/staff-requests\/(\d+)$/);
  if (requestMatch && method === 'PATCH') {
    const requests = getRequests();
    const request = requests.find((item) => item.request_id === Number(requestMatch[1]));
    if (!request) throw new Error('Pengajuan tidak ditemukan.');
    request.status = options.body?.decision === 'approved' ? 'approved' : 'rejected';
    request.admin_note = options.body?.admin_note || '';
    write(STORAGE.requests, requests);
    if (request.status === 'approved') {
      const users = getUsers();
      users.push({
        user_id: Math.max(0, ...users.map((item) => Number(item.user_id) || 0)) + 1,
        name: request.name,
        email: request.email,
        role: 'petugas',
        task_village: request.village_name || 'Wilayah tugas',
        task_district: request.district_name || '',
        task_area_id: Number(request.area_id) || 1,
      });
      write(STORAGE.users, users);
    }
    return createResponse({ message: 'Status pengajuan berhasil diperbarui.' });
  }

  if (pathname === '/admin/users') return createResponse({ users: getUsers() });

  throw new Error(`Endpoint ${method} ${pathname} belum tersedia di mode pratinjau.`);
}

export function resetDemoData() {
  Object.values(STORAGE).forEach((key) => localStorage.removeItem(key));
}
