import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Truck, DollarSign } from 'lucide-react';
import Topbar from '../Topbar';
import './DomiciliarioLayout.css';

const navItems = [
  { key: 'pedidos', path: '/domiciliario/pedidos', label: 'Pedidos',      icon: <Truck      size={18} /> },
  { key: 'caja',    path: '/domiciliario/caja',    label: 'Total del día', icon: <DollarSign size={18} /> },
];

export default function DomiciliarioLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('domi_sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return window.innerWidth < 768;
  });

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('domi_sidebar_collapsed', String(next));
  };

  return (
    <div className="domi-layout">

      {/* Sidebar fijo */}
      <aside className={`domi-sidebar${collapsed ? ' domi-sidebar--collapsed' : ''}`}>

        {/* Logo */}
        <div
          className="domi-sidebar-logo"
          onClick={toggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '16px 12px', cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <img
            src="https://res.cloudinary.com/dnoxlv5kn/image/upload/v1778822634/logo_sin_fondo_remove_uuu8tt.png"
            alt="ChocoFreseo"
            style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
          />
          {!collapsed && (
            <div className="domi-sidebar-logo-info">
              <div className="domi-sidebar-logo-texto">ChocoFreseo</div>
              <div className="domi-sidebar-logo-subtexto">PANEL DOMICILIARIO</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="domi-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) => `domi-nav-link${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
              style={collapsed ? { justifyContent: 'center' } : {}}
            >
              <span className="domi-nav-icon">{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="domi-sidebar-footer">
            <div className="domi-sidebar-footer-texto">ChocoFreseo © 2026</div>
          </div>
        )}
      </aside>

      {/* Contenido principal */}
      <main
        className="domi-main"
        style={{ marginLeft: collapsed ? 60 : 220, transition: 'margin-left 0.2s ease' }}
      >
        <Topbar />
        <div className="domi-contenido">
          {children}
        </div>
      </main>

    </div>
  );
}
