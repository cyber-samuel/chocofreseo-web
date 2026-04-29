import { useState } from 'react';
import Sidebar from '../Sidebar';
import Topbar  from '../Topbar';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} />
      <main
        className="admin-main"
        style={{
          marginLeft:    collapsed ? 60 : 220,
          transition:    'margin-left 0.2s ease',
        }}
      >
        <Topbar />
        <div className="admin-contenido">
          {children}
        </div>
      </main>
    </div>
  );
}
