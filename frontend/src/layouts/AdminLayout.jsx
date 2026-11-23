
import '../styles/admin.css';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  Users,
  LogOut,
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

  const userInitial =
    user?.name?.trim()?.charAt(0).toUpperCase() || 'A';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="workspace admin-workspace">

      {/* SIDEBAR ADMIN */}
      <aside className="workspace-sidebar admin-sidebar">

        <Link to="/admin" className="brand">
          LAPORMAS
        </Link>

        <div className="workspace-role">
          PANEL ADMINISTRATOR
        </div>

        <div className="workspace-user">
          <div className="avatar">{userInitial}</div>

          <div>
            <b>{user?.name || 'Admin LAPORMAS'}</b>
            <span>{user?.email || 'Administrator'}</span>
          </div>
        </div>

        <div className="admin-nav-label">
          MENU UTAMA
        </div>

        <nav aria-label="Navigasi administrator">
          {adminLinks.map(([to, label, Icon]) => (
            <NavLink end to={to} key={to}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button type="button" onClick={handleLogout}>
            <LogOut size={17} aria-hidden="true" />
            Keluar
          </button>
        </div>

      </aside>

      {/* AREA UTAMA ADMIN */}
      <main className="workspace-main admin-main">

        <header className="workspace-top admin-top">

          <div className="workspace-heading">

            <div className="workspace-breadcrumb">
              <span>LAPORMAS</span>
              <span className="breadcrumb-divider">/</span>
              <span>Administrator</span>
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-current">
                {title}
              </span>
            </div>

            <h1>{title}</h1>
            <p>{subtitle}</p>

          </div>

          <div className="workspace-top-account admin-account">

            <div className="workspace-top-account-info">
              <b>{user?.name || 'Admin LAPORMAS'}</b>
              <span>Administrator</span>
            </div>

            <div className="top-avatar">
              {userInitial}
            </div>

          </div>

        </header>

        <div className="workspace-content admin-content">
          {children}
        </div>

      </main>

    </div>
  );
}
