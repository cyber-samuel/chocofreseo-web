import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

const menu = [
  {
    icon: '🏠', label: 'Dashboard', path: '/admin/dashboard', hijos: [],
    permiso: 'ver_dashboard',
  },
  {
    icon: '⚙️', label: 'Configuración', hijos: [
      { label: 'Usuarios', path: '/admin/usuarios', permiso: 'ver_usuarios' },
      { label: 'Roles',    path: '/admin/roles',    permiso: 'ver_roles'    },
    ],
  },
  {
    icon: '👥', label: 'Usuarios', hijos: [
      { label: 'Clientes',  path: '/admin/clientes',  permiso: 'ver_clientes'  },
      { label: 'Empleados', path: '/admin/empleados', permiso: 'ver_empleados' },
    ],
  },
  {
    icon: '🍫', label: 'Productos', hijos: [
      { label: 'Categorías', path: '/admin/categorias', permiso: 'gestionar_categorias' },
      { label: 'Productos',  path: '/admin/productos',  permiso: 'gestionar_productos'  },
      { label: 'Toppings',   path: '/admin/toppings',   permiso: 'gestionar_toppings'   },
      { label: 'Adiciones',  path: '/admin/adiciones',  permiso: 'gestionar_adiciones'  },
    ],
  },
  {
    icon: '🛒', label: 'Ventas', path: '/admin/ventas', hijos: [],
    permiso: 'ver_ventas',
  },
  {
    icon: '🚴', label: 'Confirmar pedidos', path: '/admin/domicilios', hijos: [],
    permiso: 'confirmar_domicilios',
  },
  {
    icon: '👨‍🍳', label: 'Panel Cocina', path: '/cocina', hijos: [],
    permiso: 'gestionar_cocina',
  },
];

const PANEL_LABELS = {
  admin:                  'PANEL ADMIN',
  confirmador_domicilio:  'PANEL PEDIDOS',
  cocinero:               'PANEL COCINA',
  domiciliario:           'PANEL DOMI',
};

export default function Sidebar({ collapsed = false, onToggle }) {
  const location              = useLocation();
  const { tienePermiso, usuario } = useAuth();

  // Filtro correcto: null para items sin permiso, null para grupos con 0 hijos visibles
  const menuFiltrado = menu
    .map((item) => {
      if (item.hijos && item.hijos.length > 0) {
        const hijosFiltrados = item.hijos.filter((h) => !h.permiso || tienePermiso(h.permiso));
        if (hijosFiltrados.length === 0) return null;
        return { ...item, hijos: hijosFiltrados };
      }
      if (item.permiso && !tienePermiso(item.permiso)) return null;
      return item;
    })
    .filter(Boolean);

  const tieneHijoActivo = (hijos) =>
    hijos.some((h) => location.pathname.startsWith(h.path));

  const [abiertos, setAbiertos] = useState(() =>
    menuFiltrado
      .filter((item) => item.hijos?.length && tieneHijoActivo(item.hijos))
      .map((i) => i.label)
  );

  const toggleMenu = (label) => {
    setAbiertos((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const panelLabel = PANEL_LABELS[usuario?.rol] || 'PANEL ADMIN';

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>

      {/* Logo — click para colapsar/expandir */}
      <div
        className="sidebar-logo"
        onClick={onToggle}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '20px 0' : '20px' }}
      >
        <div className="sidebar-logo-icono">CF</div>
        {!collapsed && (
          <div className="sidebar-logo-info">
            <div className="sidebar-logo-texto">ChocoFreseo</div>
            <div className="sidebar-logo-subtexto">{panelLabel}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {menuFiltrado.map((item) => (
          <div key={item.label}>
            {item.hijos.length === 0 ? (
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                title={collapsed ? item.label : undefined}
                style={collapsed ? { justifyContent: 'center' } : {}}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && item.label}
              </NavLink>
            ) : !collapsed ? (
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
            ) : (
              <NavLink
                to={item.hijos[0]?.path || '/admin/dashboard'}
                className={({ isActive }) => `nav-link${tieneHijoActivo(item.hijos) ? ' active' : ''}`}
                title={item.label}
                style={{ justifyContent: 'center' }}
              >
                <span className="nav-icon">{item.icon}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-footer-texto">ChocoFreseo © 2026</div>
          <div className="sidebar-footer-version">v1.0.0</div>
        </div>
      )}
    </aside>
  );
}
