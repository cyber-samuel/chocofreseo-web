import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Topbar.css';

export default function Topbar() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const handleSalir = () => {
    logout();
    navigate('/login');
  };

  const nombre = usuario?.nombre || 'Administrador';
  const rol    = usuario?.rol    || 'Admin';

  return (
    <div className="topbar">
      <div className="topbar-izquierda">
        <span className="topbar-bienvenida">Bienvenido de nuevo,</span>
        <span className="topbar-nombre-grande">{nombre}</span>
      </div>

      <div className="topbar-derecha">
        {/* Avatar + info */}
        <div className="topbar-usuario">
          <div className="topbar-avatar">{nombre.charAt(0).toUpperCase()}</div>
          <div className="topbar-info">
            <div className="topbar-nombre">{nombre}</div>
            <div className="topbar-rol">{rol}</div>
          </div>
        </div>

        <div className="topbar-divider" />

        {/* Ir a la tienda */}
        <button className="topbar-btn topbar-btn--tienda" title="Ir a la tienda" onClick={() => navigate('/landing')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Tienda</span>
        </button>

        {/* Cerrar sesión */}
        <button className="topbar-btn topbar-btn--salir" title="Cerrar sesión" onClick={handleSalir}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
}