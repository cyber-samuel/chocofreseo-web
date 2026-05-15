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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="domi-layout">

      {/* Sidebar fijo — igual estructura que admin */}
      <aside className={`domi-sidebar${collapsed ? ' domi-sidebar--collapsed' : ''}`}>

        {/* Logo / header del sidebar — click colapsa */}
        <div
          className="domi-sidebar-logo"
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '20px 0' : '20px' }}
        >
          <img src="https://res.cloudinary.com/dnoxlv5kn/image/upload/v1778822634/logo_chocofreseo_1_zj7exc.png" alt="ChocoFreseo" className="domi-sidebar-logo-icono" style={{ objectFit: 'contain', background: 'none', boxShadow: 'none' }} />
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

      {/* Contenido principal con margin igual al admin */}
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
