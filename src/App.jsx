import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// ── Admin ──────────────────────────────────────────────────────
import DashboardPage  from './pages/admin/dashboard';
import CategoriasPage from './pages/admin/categorias';
import UsuariosPage   from './pages/admin/usuarios';
import ProductosPage  from './pages/admin/productos';
import ToppingsPage   from './pages/admin/toppings';
import AdicionesPage  from './pages/admin/adiciones';
import ClientesPage   from './pages/admin/clientes';
import EmpleadosPage  from './pages/admin/empleados';
import RolesPage      from './pages/admin/roles';
import VentasPage     from './pages/admin/ventas';
import DomiciliosPage from './pages/admin/domicilios';

// ── Domiciliario ───────────────────────────────────────────────
import PedidosDomiciliarioPage from './pages/domiciliario/pedidos';
import CierreCajaPage          from './pages/domiciliario/caja';

// ── Client auth ────────────────────────────────────────────────
import LoginPage     from './pages/client/auth/login';
import RegistroPage  from './pages/client/auth/registro';
import RecuperarPage from './pages/client/auth/recuperar';

// ── Client pages ───────────────────────────────────────────────
import LandingPage  from './pages/client/landing';
import CatalogoPage from './pages/client/catalogo';
import CheckoutPage from './pages/client/checkout';
import PerfilPage   from './pages/client/perfil';

// ── Rutas protegidas ───────────────────────────────────────────
function RutaPrivada({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" />;
}

function RutaAdmin({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" />;
  if (usuario.rol !== 'admin') return <Navigate to="/landing" />;
  return children;
}

function RutaDomiciliario({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" />;
  if (usuario.rol !== 'domiciliario') return <Navigate to="/landing" />;
  return children;
}

// Permite acceso a admin (id_rol=1) Y confirmador (id_rol=3)
function RutaAdminOConfirmador({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" />;
  if (usuario.rol !== 'admin' && usuario.id_rol !== 3) return <Navigate to="/landing" />;
  return children;
}

function RutaPublica({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return children;
  if (usuario.rol === 'admin')         return <Navigate to="/admin/dashboard" />;
  if (usuario.rol === 'domiciliario')  return <Navigate to="/domiciliario/pedidos" />;
  if (usuario.id_rol === 3)            return <Navigate to="/admin/domicilios" />;
  return <Navigate to="/landing" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Raíz */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* ── Auth — solo si NO está logueado ── */}
        <Route path="/login"     element={<RutaPublica><LoginPage /></RutaPublica>} />
        <Route path="/registro"  element={<RutaPublica><RegistroPage /></RutaPublica>} />
        <Route path="/recuperar" element={<RecuperarPage />} />

        {/* ── Cliente — públicas (sin login) ── */}
        <Route path="/landing"  element={<LandingPage />} />
        <Route path="/catalogo" element={<CatalogoPage />} />

        {/* ── Cliente — requiere login ── */}
        <Route path="/checkout" element={<RutaPrivada><CheckoutPage /></RutaPrivada>} />
        <Route path="/perfil"   element={<RutaPrivada><PerfilPage /></RutaPrivada>} />

        {/* ── Admin — requiere rol admin ── */}
        <Route path="/admin/dashboard"  element={<RutaAdmin><DashboardPage /></RutaAdmin>} />
        <Route path="/admin/categorias" element={<RutaAdmin><CategoriasPage /></RutaAdmin>} />
        <Route path="/admin/usuarios"   element={<RutaAdmin><UsuariosPage /></RutaAdmin>} />
        <Route path="/admin/productos"  element={<RutaAdmin><ProductosPage /></RutaAdmin>} />
        <Route path="/admin/toppings"   element={<RutaAdmin><ToppingsPage /></RutaAdmin>} />
        <Route path="/admin/adiciones"  element={<RutaAdmin><AdicionesPage /></RutaAdmin>} />
        <Route path="/admin/clientes"   element={<RutaAdmin><ClientesPage /></RutaAdmin>} />
        <Route path="/admin/empleados"  element={<RutaAdmin><EmpleadosPage /></RutaAdmin>} />
        <Route path="/admin/roles"      element={<RutaAdmin><RolesPage /></RutaAdmin>} />
        <Route path="/admin/ventas"     element={<RutaAdminOConfirmador><VentasPage /></RutaAdminOConfirmador>} />
        <Route path="/admin/domicilios" element={<RutaAdminOConfirmador><DomiciliosPage /></RutaAdminOConfirmador>} />

        {/* ── Domiciliario — requiere rol domiciliario ── */}
        <Route path="/domiciliario/pedidos" element={<RutaDomiciliario><PedidosDomiciliarioPage /></RutaDomiciliario>} />
        <Route path="/domiciliario/caja"    element={<RutaDomiciliario><CierreCajaPage /></RutaDomiciliario>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;