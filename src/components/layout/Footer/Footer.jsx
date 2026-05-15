import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-wrap">

        {/* Marca */}
        <div className="footer-marca">
          <div className="footer-logo">
            <img src="https://res.cloudinary.com/dnoxlv5kn/image/upload/v1778822634/logo_chocofreseo_1_zj7exc.png" alt="ChocoFreseo" className="footer-logo-icono" style={{ objectFit: 'contain', background: 'none', boxShadow: 'none' }} />
            <span className="footer-logo-nombre">ChocoFreseo</span>
          </div>
          <p className="footer-desc">
            Helados, waffles y crepes artesanales hechos con amor. Llevamos el mejor sabor directo a tu puerta en Medellín.
          </p>
          <div className="footer-redes">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-red" title="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-red" title="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://wa.me/573159914624" target="_blank" rel="noreferrer" className="footer-red" title="WhatsApp">
              {'💬'}
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="footer-col">
          <h4 className="footer-col-titulo">Navegación</h4>
          <Link to="/landing"   className="footer-link">Inicio</Link>
          <Link to="/catalogo"  className="footer-link">Catálogo</Link>
          <Link to="/login"     className="footer-link">Iniciar sesión</Link>
          <Link to="/registro"  className="footer-link">Registrarse</Link>
        </div>

        {/* Contacto */}
        <div className="footer-col">
          <h4 className="footer-col-titulo">Contacto</h4>
          <div className="footer-contacto-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Medellín, Colombia</span>
          </div>
          <div className="footer-contacto-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>+57 315 991 4624</span>
          </div>
          <div className="footer-contacto-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>hola@chocofreseo.com</span>
          </div>
        </div>

        {/* Horario */}
        <div className="footer-col">
          <h4 className="footer-col-titulo">Horario</h4>
          <div className="footer-horario-item">
            <span className="footer-horario-dia">Lunes — Viernes</span>
            <span className="footer-horario-hora">12:00 pm — 10:00 pm</span>
          </div>
          <div className="footer-horario-item">
            <span className="footer-horario-dia">Sábados</span>
            <span className="footer-horario-hora">11:00 am — 11:00 pm</span>
          </div>
          <div className="footer-horario-item">
            <span className="footer-horario-dia">Domingos</span>
            <span className="footer-horario-hora">12:00 pm — 9:00 pm</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 ChocoFreseo. Todos los derechos reservados.</span>
        <span>Hecho con ❤️ en Medellín</span>
      </div>
    </footer>
  );
}