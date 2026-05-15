import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Truck, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Topbar from '../Topbar';
import './DomiciliarioLayout.css';

const navItems = [
  { key: 'pedidos', path: '/domiciliario/pedidos', label: 'Pedidos',      icon: <Truck       size={20} /> },
  { key: 'caja',    path: '/domiciliario/caja',    label: 'Total del día', icon: <DollarSign  size={20} /> },
];

export default function DomiciliarioLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="domi-layout">

      {/* Topbar igual al admin */}
      <Topbar />

      <div className="domi-body">

        {/* Sidebar */}
        <nav className={`domi-sidebar ${collapsed ? 'domi-sidebar--collapsed' : ''}`}>

          {/* Toggle collapse */}
          <button className="domi-sidebar-toggle" onClick={() => setCollapsed(v => !v)} title={collapsed ? 'Expandir' : 'Colapsar'}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Info usuario */}
          {!collapsed && usuario?.nombre && (
            <div className="domi-sidebar-user">
              <div className="domi-sidebar-avatar">{usuario.nombre.charAt(0).toUpperCase()}</div>
              <div className="domi-sidebar-user-info">
                <div className="domi-sidebar-user-nombre">{usuario.nombre}</div>
                <div className="domi-sidebar-user-rol">Domiciliario</div>
              </div>
            </div>
          )}
          {collapsed && usuario?.nombre && (
            <div className="domi-sidebar-avatar domi-sidebar-avatar--solo">{usuario.nombre.charAt(0).toUpperCase()}</div>
          )}

          {/* Nav items */}
          {navItems.map((item) => {
            const activo = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.key}
                className={`domi-nav-item ${activo ? 'activo' : ''} ${collapsed ? 'domi-nav-item--collapsed' : ''}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                {item.icon}
                {!collapsed && <span className="domi-nav-label">{item.label}</span>}
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
