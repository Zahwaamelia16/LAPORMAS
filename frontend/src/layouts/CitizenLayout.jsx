
import { Link, NavLink, useNavigate } from 'react-router-dom';

import {
  LayoutDashboard,
  ClipboardList,
  UserRound,
  Home,
  LogOut,
} from 'lucide-react';

import { useAuth } from '../auth';

const citizenLinks = [
  ['/warga', 'Ringkasan', LayoutDashboard],
  ['/warga/laporan', 'Laporan saya', ClipboardList],
  ['/warga/profil', 'Profil saya', UserRound],
];

export default function CitizenLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="workspace">
      <aside className="workspace-sidebar citizen-sidebar">
        <Link to="/" className="brand">LAPORMAS</Link>

        <div className="workspace-role">RUANG WARGA</div>

        <div className="workspace-user">
          <div className="avatar">
            {user?.name?.slice(0, 1) || 'W'}
          </div>
          <div>
            <b>{user?.name}</b>
            <span>{user?.email}</span>
          </div>
        </div>

        <nav>
          {citizenLinks.map(([to, label, Icon]) => (
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
        <header className="workspace-top">
          <div>
            <span className="eyebrow">LAPORMAS · WARGA</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="top-avatar">
            {user?.name?.slice(0, 1) || 'W'}
          </div>
        </header>

        <div className="workspace-content">
          {children}
        </div>
      </main>
    </div>
  );
}
