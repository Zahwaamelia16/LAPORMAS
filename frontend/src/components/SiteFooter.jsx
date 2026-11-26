import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link to="/" className="brand brand-light">
            LAPORMAS
          </Link>

          <p>Layanan Pelaporan & Resolusi Masalah Area</p>
          <p className="muted-light">
            Dari kepedulian warga, untuk area yang lebih baik.
          </p>

          <small>© 2026 LAPORMAS</small>
        </div>

        <div>
          <b>Jelajahi</b>
          <Link to="/laporan">Laporan publik</Link>
          <Link to="/cara-melapor">Cara melapor</Link>
          <Link to="/tentang">Tentang LAPORMAS</Link>
        </div>

        <div>
          <b>Informasi</b>
          <a href="mailto:bantuan@lapormas.id">Pusat bantuan</a>
          <Link to="/tentang#privasi">Kebijakan privasi</Link>
          <Link to="/tentang#ketentuan">Syarat & ketentuan</Link>
        </div>
      </div>
    </footer>
  );
}