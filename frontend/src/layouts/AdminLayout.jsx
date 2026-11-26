import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  Users,
  UserRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../auth';

const adminLinks = [
  ['/admin', 'Dashboard', LayoutDashboard],
  ['/admin/laporan', 'Manajemen laporan', ClipboardList],
  ['/admin/verifikasi', 'Verifikasi pengelola', ShieldCheck],
  ['/admin/pengguna', 'Manajemen pengguna', Users],
];

export default function AdminLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('lapormas-admin-sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;

      try {
        localStorage.setItem(
          'lapormas-admin-sidebar',
          next ? 'collapsed' : 'expanded'
        );
      } catch {
        // Sidebar tetap dapat digunakan meskipun storage tidak tersedia.
      }

      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div
      className={`workspace admin-workspace ${
        collapsed ? 'admin-sidebar-collapsed' : ''
      }`}
    >
      {/* SIDEBAR ADMIN */}
      <aside className="workspace-sidebar admin-sidebar">

        {/* LOGO DAN TOMBOL SIDEBAR */}
        <div className="admin-sidebar-header">
          <Link to="/admin" className="brand admin-brand">
            <img
              src="/images/logo.png"
              alt="LAPORMAS"
            />
          </Link>

          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          >
            {collapsed
              ? <ChevronRight size={19} />
              : <ChevronLeft size={19} />
            }
          </button>
        </div>

        {/* PROFIL ADMIN DI SIDEBAR */}
        <div className="workspace-user admin-sidebar-profile">
          <div className="avatar admin-profile-avatar">
            <UserRound size={21} aria-hidden="true" />
          </div>

          <div>
            <b>{user?.name || 'Admin LAPORMAS'}</b>
            <span>{user?.email || 'Administrator'}</span>
          </div>
        </div>

        <div className="admin-nav-label">
          MENU UTAMA
        </div>

        <nav
          id="admin-navigation"
          aria-label="Navigasi administrator"
        >
          {adminLinks.map(([to, label, Icon]) => (
            <NavLink
              end
              to={to}
              key={to}
              title={collapsed ? label : undefined}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* KELUAR */}
        <div className="sidebar-bottom">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Keluar' : undefined}
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Keluar</span>
          </button>
        </div>

      </aside>

      {/* AREA UTAMA ADMIN */}
      <main className="workspace-main admin-main">

        {/* HEADER DENGAN FOTO BACKGROUND */}
        <header className="admin-hero">
          <div className="admin-hero-inner">

            <h1>{title}</h1>
            <p>{subtitle}</p>

          </div>
        </header>

        {/* KONTEN DASHBOARD */}
        <div className="workspace-content admin-content">
          {children}
        </div>

      </main>
    </div>
  );
}
