import { useState } from 'react';
import Sidebar from '../Sidebar';
import Topbar  from '../Topbar';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return window.innerWidth < 768;
  });

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  return (
    <div className="admin-layout">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main className={`admin-main${collapsed ? ' admin-main--collapsed' : ''}`}>
        <Topbar />
        <div className="admin-contenido">
          {children}
        </div>
      </main>
    </div>
  );
}
