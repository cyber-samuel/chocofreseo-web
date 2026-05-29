import { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import Topbar  from '../Topbar';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  const [collapsed,   setCollapsed]   = useState(() => window.innerWidth < 768);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [isMobile,    setIsMobile]    = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) { setCollapsed(true); setMobileOpen(false); }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="admin-layout">
      {mobileOpen && <div className="admin-overlay" onClick={() => setMobileOpen(false)} />}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((p) => !p)}
        mobileOpen={mobileOpen}
      />
      <main
        className="admin-main"
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 60 : 220),
          transition: 'margin-left 0.2s ease',
        }}
      >
        <Topbar onMenuToggle={() => setMobileOpen((p) => !p)} />
        <div className="admin-contenido">
          {children}
        </div>
      </main>
    </div>
  );
}
