import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  UserRound,
  Home,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth';

const wargaLinks = [
  ['/warga', 'Ringkasan', LayoutDashboard],
  ['/warga/laporan', 'Laporan saya', ClipboardList],
  ['/warga/profil', 'Profil saya', UserRound],
];

export default function WargaLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userInitial = user?.name?.trim()?.charAt(0).toUpperCase() || 'W';
  const displayName = user?.name || 'Warga LAPORMAS';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="workspace">
      <aside className="workspace-sidebar citizen-sidebar">
        <Link to="/" className="brand">
          LAPORMAS
        </Link>

        <div className="workspace-role">RUANG WARGA</div>

        <div className="workspace-user">
          <div className="avatar">{userInitial}</div>
          <div>
            <b>{displayName}</b>
            <span>{user?.email || 'Akun warga'}</span>
          </div>
        </div>

        <nav>
          {wargaLinks.map(([to, label, Icon]) => (
            <NavLink end to={to} key={to}>
              <Icon size={17} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/">
            <Home size={17} aria-hidden="true" />
            Kembali ke website
          </Link>

          <button type="button" onClick={handleLogout}>
            <LogOut size={17} aria-hidden="true" />
            Keluar
          </button>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-top citizen-top">
          <div className="workspace-heading">
            <div className="workspace-breadcrumb">
              <span>LAPORMAS</span>
              <span className="breadcrumb-divider">/</span>
              <span>Warga</span>
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-current">{title}</span>
            </div>

            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="workspace-top-account">
            <div className="workspace-top-account-info">
              <b>{displayName}</b>
              <span>Warga LAPORMAS</span>
            </div>
            <div className="top-avatar">{userInitial}</div>
          </div>
        </header>

        <div className="workspace-content">
          {children}
        </div>
      </main>
    </div>
  );
}