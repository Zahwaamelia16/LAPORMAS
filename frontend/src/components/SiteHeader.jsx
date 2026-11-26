import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ChevronDown,
  UserRound,
  LogOut,
} from 'lucide-react';

import { useAuth } from '../auth';
import { imageUrl } from '../api';

export default function SiteHeader() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isWarga = user?.role === 'warga';
  const firstName = user?.name?.trim()?.split(' ')[0] || 'Akun';
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'W';

  const avatarPath =
    user?.avatar_url ||
    user?.profile_image_url ||
    user?.photo_url;

  const avatarSrc = avatarPath ? imageUrl(avatarPath) : null;

  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const closeMenus = () => {
    setOpen(false);
    setProfileOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link to="/" className="brand brand-mark" onClick={closeMenus}>
          <img src="/images/logo utama.png" alt="LAPORMAS" />
        </Link>

        <button
          className="mobile-menu"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Buka menu navigasi"
          aria-expanded={open}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>

        <nav className={open ? 'nav-links open' : 'nav-links'}>
          <NavLink to="/" end onClick={closeMenus}>
            Beranda
          </NavLink>

          <NavLink to="/tentang" onClick={closeMenus}>
            Tentang Kami
          </NavLink>

          <NavLink to="/laporan" onClick={closeMenus}>
            Laporan Publik
          </NavLink>

          <NavLink to="/cara-melapor" onClick={closeMenus}>
            Cara Melapor
          </NavLink>

          {isWarga && (
            <NavLink to="/warga" onClick={closeMenus}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {!user ? (
            <>
              <Link
                to="/laporan/buat"
                className="btn btn-primary btn-small"
              >
                Buat Laporan
              </Link>

              <Link
                to="/masuk"
                className="btn btn-primary btn-small nav-login-button"
              >
                Login
              </Link>
            </>
          ) : isWarga ? (
            <>
              <Link
                to="/laporan/buat"
                className="btn btn-primary btn-small"
              >
                Buat Laporan
              </Link>

              <div className="nav-profile">
                <button
                  type="button"
                  className="nav-profile-trigger"
                  onClick={() => setProfileOpen((value) => !value)}
                  aria-expanded={profileOpen}
                  aria-label="Menu profil pengguna"
                >
                  <span className="nav-profile-avatar">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Foto profil" />
                    ) : (
                      initial
                    )}
                  </span>

                  <span className="nav-profile-name">{firstName}</span>
                  <ChevronDown size={15} />
                </button>

                {profileOpen && (
                  <div className="nav-profile-menu">
                    <div className="nav-profile-menu-user">
                      <b>{user?.name || 'Warga LAPORMAS'}</b>
                      <span>{user?.email || ''}</span>
                    </div>

                    <Link
                      to="/warga/profil"
                      onClick={closeMenus}
                    >
                      <UserRound size={16} />
                      Profil saya
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link className="nav-user" to={
                user?.role === 'admin'
                  ? '/admin'
                  : user?.role === 'pengelola'
                    ? '/pengelola'
                    : '/'
              }>
                <UserRound size={15} />
                {firstName}
              </Link>

              <button
                className="btn btn-outline btn-small nav-logout"
                type="button"
                onClick={handleLogout}
              >
                Keluar
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}