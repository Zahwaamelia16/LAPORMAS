
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListFilter,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth';

const staffLinks = [
  ['/pengelola', 'Ringkasan', LayoutDashboard],
  ['/pengelola/laporan-publik', 'Laporan publik', ListFilter],
  ['/pengelola/laporan', 'Laporan area tugas', ClipboardList],
];

export default function StaffLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <Link to="/" className="brand">LAPORMAS</Link>

        <div className="workspace-role">PENGELOLA</div>

        <div className="workspace-user">
          <div className="avatar">
            {user?.name?.slice(0, 1) || 'L'}
          </div>
          <div>
            <b>{user?.name}</b>
            <span>{user?.email}</span>
          </div>
        </div>

        <nav>
          {staffLinks.map(([to, label, Icon]) => (
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
        <header className="workspace-top">
          <div>
            <span className="eyebrow">
              LAPORMAS · PENGELOLA
            </span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="top-avatar">
            {user?.name?.slice(0, 1) || 'L'}
          </div>
        </header>

        <div className="workspace-content">
          {children}
        </div>
      </main>
    </div>
  );
}
