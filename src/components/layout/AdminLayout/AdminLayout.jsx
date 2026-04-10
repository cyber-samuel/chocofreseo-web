import Sidebar from '../Sidebar';
import Topbar  from '../Topbar';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <Topbar />
        <div className="admin-contenido">
          {children}
        </div>
      </main>
    </div>
  );
}