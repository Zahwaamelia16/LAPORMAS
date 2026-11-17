
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListFilter,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth';

const pengelolaLinks = [
  ['/pengelola', 'Ringkasan', LayoutDashboard],
  ['/pengelola/laporan-publik', 'Laporan publik', ListFilter],
  ['/pengelola/laporan', 'Laporan area tugas', ClipboardList],
];

export default function PengelolaLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userInitial =
    user?.name?.trim()?.charAt(0).toUpperCase() || 'P';

  const displayName = user?.name || 'Pengelola LAPORMAS';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="workspace">
      <aside className="workspace-sidebar pengelola-sidebar">
        <Link to="/pengelola" className="brand">
          LAPORMAS
        </Link>

        <div className="workspace-role">RUANG PENGELOLA</div>

        <div className="workspace-user">
          <div className="avatar">{userInitial}</div>

          <div>
            <b>{displayName}</b>
            <span>{user?.email || 'Akun pengelola'}</span>
          </div>
        </div>

        <nav>
          {pengelolaLinks.map(([to, label, Icon]) => (
            <NavLink end to={to} key={to}>
              <Icon size={17} aria-hidden="true" />
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

      <main className="workspace-main">
        <header className="workspace-top pengelola-top">
          <div className="workspace-heading">
            <div className="workspace-breadcrumb">
              <span>LAPORMAS</span>
              <span className="breadcrumb-divider">/</span>
              <span>Pengelola</span>
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-current">{title}</span>
            </div>

            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="workspace-top-account">
            <div className="workspace-top-account-info">
              <b>{displayName}</b>
              <span>Pengelola LAPORMAS</span>
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
