import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const links = [
    { label: 'Inicio',    path: '/landing'   },
    { label: 'Catálogo',  path: '/catalogo'  },
    { label: 'Nosotros',  path: '/landing#conocenos' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuAbierto(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-wrap">
        <Link to="/landing" className="navbar-logo">
          <div className="navbar-logo-icono">CF</div>
          <span className="navbar-logo-nombre">ChocoFreseo</span>
        </Link>

        <div className="navbar-links">
          {links.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`navbar-link ${location.pathname === l.path ? 'activo' : ''}`}
            >
              {l.label}
            </Link>
          ))}

          {/* Panel Admin — solo admins */}
          {usuario?.rol === 'admin' && (
            <Link to="/admin/dashboard" className="navbar-link admin-link">
              Panel Admin
            </Link>
          )}

          {/* Panel Domiciliario — solo domiciliarios */}
          {usuario?.rol === 'domiciliario' && (
            <Link to="/domiciliario/pedidos" className="navbar-link domi-link">
              🛵 Panel Domiciliario
            </Link>
          )}
        </div>

        <div className="navbar-acciones">
          {usuario ? (
            <>
              <Link to="/perfil" className="navbar-perfil">
                <div className="navbar-perfil-avatar">{usuario.nombre.charAt(0)}</div>
                <span className="navbar-perfil-nombre">{usuario.nombre}</span>
              </Link>
              <button className="navbar-btn-login" onClick={handleLogout}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="navbar-btn-login">Iniciar sesión</Link>
              <Link to="/registro" className="navbar-btn-registro">Registrarse</Link>
            </>
          )}
        </div>

        <button className="navbar-hamburguesa" onClick={() => setMenuAbierto(!menuAbierto)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {menuAbierto
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {/* Menú mobile */}
      {menuAbierto && (
        <div className="navbar-mobile">
          {links.map((l) => (
            <Link key={l.path} to={l.path} className="navbar-mobile-link" onClick={() => setMenuAbierto(false)}>
              {l.label}
            </Link>
          ))}

          {/* Panel Admin mobile */}
          {usuario?.rol === 'admin' && (
            <Link to="/admin/dashboard" className="navbar-mobile-link admin-highlight" onClick={() => setMenuAbierto(false)}>
              ⭐ Panel Administrador
            </Link>
          )}

          {/* Panel Domiciliario mobile */}
          {usuario?.rol === 'domiciliario' && (
            <Link to="/domiciliario/pedidos" className="navbar-mobile-link domi-highlight" onClick={() => setMenuAbierto(false)}>
              🛵 Panel Domiciliario
            </Link>
          )}

          <div className="navbar-mobile-acciones">
            {usuario ? (
              <>
                <Link to="/perfil" className="navbar-btn-registro" onClick={() => setMenuAbierto(false)}>Mi perfil</Link>
                <button className="navbar-btn-login" onClick={handleLogout}>Cerrar sesión</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="navbar-btn-login"    onClick={() => setMenuAbierto(false)}>Iniciar sesión</Link>
                <Link to="/registro" className="navbar-btn-registro" onClick={() => setMenuAbierto(false)}>Registrarse</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}