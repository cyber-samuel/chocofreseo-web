import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

const menu = [
  { icon: '🏠', label: 'Dashboard',         path: '/admin/dashboard',  hijos: [], permiso: 'ver_dashboard' },
  {
    icon: '⚙️', label: 'Configuración', hijos: [
      { label: 'Usuarios', path: '/admin/usuarios' },
      { label: 'Roles',    path: '/admin/roles'    },
    ], permiso: 'ver_roles',
  },
  {
    icon: '👥', label: 'Usuarios', hijos: [
      { label: 'Clientes',  path: '/admin/clientes'  },
      { label: 'Empleados', path: '/admin/empleados' },
    ], permiso: 'ver_clientes',
  },
  {
    icon: '🍫', label: 'Productos', hijos: [
      { label: 'Categorías', path: '/admin/categorias' },
      { label: 'Productos',  path: '/admin/productos'  },
      { label: 'Toppings',   path: '/admin/toppings'   },
      { label: 'Adiciones',  path: '/admin/adiciones'  },
    ], permiso: 'gestionar_productos',
  },
  { icon: '🛒', label: 'Ventas',            path: '/admin/ventas',     hijos: [], permiso: 'ver_ventas' },
  { icon: '🚴', label: 'Confirmar pedidos', path: '/admin/domicilios', hijos: [], permiso: 'confirmar_domicilios' },
  { icon: '👨‍🍳', label: 'Panel Cocina',     path: '/cocina',           hijos: [], permiso: 'gestionar_cocina' },
];

// Permisos alternativos por sección (cualquiera activa la sección)
const permisosAlternativos = {
  'Configuración': ['ver_roles', 'gestionar_roles', 'ver_usuarios', 'gestionar_usuarios'],
  'Usuarios':      ['ver_clientes', 'gestionar_clientes', 'ver_empleados', 'gestionar_empleados'],
  'Productos':     ['gestionar_productos', 'gestionar_categorias', 'gestionar_toppings', 'gestionar_adiciones'],
};

export default function Sidebar() {
  const location              = useLocation();
  const { tienePermiso }      = useAuth();

  const menuFiltrado = menu.filter((item) => {
    const alts = permisosAlternativos[item.label];
    if (alts) return alts.some((p) => tienePermiso(p));
    return tienePermiso(item.permiso);
  });

  const tieneHijoActivo = (hijos) =>
    hijos.some((h) => location.pathname.startsWith(h.path));

  const [abiertos, setAbiertos] = useState(() =>
    menuFiltrado.filter((item) => item.hijos?.length && tieneHijoActivo(item.hijos)).map((i) => i.label)
  );

  const toggleMenu = (label) => {
    setAbiertos((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icono">CF</div>
        <div>
          <div className="sidebar-logo-texto">ChocoFreseo</div>
          <div className="sidebar-logo-subtexto">Panel Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {menuFiltrado.map((item) => (
          <div key={item.label}>
            {item.hijos.length === 0 ? (
              <NavLink
                to={item.path}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ) : (
              <>
                <div
                  className={`nav-link nav-padre ${tieneHijoActivo(item.hijos) ? 'padre-activo' : ''}`}
                  onClick={() => toggleMenu(item.label)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span className={`nav-flecha ${abiertos.includes(item.label) ? 'abierto' : ''}`}>›</span>
                </div>

                {abiertos.includes(item.label) && (
                  <div className="nav-hijos">
                    {item.hijos.map((hijo) => (
                      <NavLink
                        key={hijo.path}
                        to={hijo.path}
                        className={({ isActive }) => isActive ? 'nav-hijo active' : 'nav-hijo'}
                      >
                        <span className="nav-hijo-punto" />
                        {hijo.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-texto">ChocoFreseo © 2025</div>
        <div className="sidebar-footer-version">v1.0.0</div>
      </div>
    </aside>
  );
}
