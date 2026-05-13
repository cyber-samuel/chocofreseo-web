import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, LogOut, Truck, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import './DomiciliarioLayout.css';

const navItems = [
  { key: 'pedidos', path: '/domiciliario/pedidos', label: 'Pedidos', icon: <Truck size={20} /> },
  { key: 'caja',    path: '/domiciliario/caja',    label: 'Total del día', icon: <DollarSign size={20} /> },
];

export default function DomiciliarioLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="domi-layout">

      {/* Topbar */}
      <header className="domi-topbar">
        {/* Marca — click para colapsar/expandir sidebar */}
        <div
          className="domi-topbar-marca"
          onClick={() => setSidebarVisible((v) => !v)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title={sidebarVisible ? 'Ocultar menú' : 'Mostrar menú'}
        >
          <div className="domi-topbar-logo">🍫</div>
          <span className="domi-topbar-nombre">ChocoFreseo</span>
          {sidebarVisible
            ? <ChevronLeft size={14} color="rgba(255,255,255,0.7)" />
            : <ChevronRight size={14} color="rgba(255,255,255,0.7)" />
          }
        </div>

        <span className="domi-topbar-rol">Panel Domiciliario</span>

        <div className="domi-topbar-acciones">
          <button className="domi-topbar-btn" onClick={() => navigate('/landing')} title="Ir a la tienda">
            <Store size={16} color="#fff" />
          </button>
          <button className="domi-topbar-btn" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={16} color="#fff" />
          </button>
        </div>
      </header>

      <div className="domi-body">

        {/* Sidebar colapsable */}
        {sidebarVisible && (
          <nav className="domi-sidebar">
            {/* Avatar usuario */}
            {usuario?.nombre && (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#CA0B0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, marginBottom: 8, flexShrink: 0 }}>
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>
            )}
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
        )}

        {/* Contenido */}
        <main className="domi-main" style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>

      </div>
    </div>
  );
}
