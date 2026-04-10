import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './DomiciliarioLayout.css';

const navItems = [
  {
    key: 'pedidos',
    path: '/domiciliario/pedidos',
    label: 'Pedidos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    ),
  },
  {
    key: 'caja',
    path: '/domiciliario/caja',
    label: 'Cierre de caja',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
];

export default function DomiciliarioLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="domi-layout">

      {/* Topbar roja */}
      <header className="domi-topbar">
        <div className="domi-topbar-marca">
          <div className="domi-topbar-logo">🍫</div>
          <span className="domi-topbar-nombre">ChocoFreseo</span>
        </div>

        <span className="domi-topbar-rol">Panel Domiciliario</span>

        <div className="domi-topbar-acciones">
          {/* Ir a la tienda */}
          <button className="domi-topbar-btn" onClick={() => navigate('/landing')} title="Ir a la tienda">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>

          {/* Cerrar sesión */}
          <button className="domi-topbar-btn" onClick={handleLogout} title="Cerrar sesión">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="domi-body">

        {/* Sidebar compacto */}
        <nav className="domi-sidebar">
          {navItems.map((item) => {
            const activo = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.key}
                className={`domi-nav-item ${activo ? 'activo' : ''}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                {item.icon}
                <span className="domi-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Contenido */}
        <main className="domi-main">
          {children}
        </main>

      </div>
    </div>
  );
}