import axios from 'axios';

const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + '/api';

const http = axios.create({ baseURL: BASE });

http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const unwrap  = (r) => r.data.data;
const handleErr = (e) => { console.error('[API Error]', e?.response?.status, e?.response?.data?.message || e?.message); throw e; };
const get     = (url, params) => http.get(url, { params }).then(unwrap).catch(handleErr);
const post    = (url, data)   => http.post(url, data).then(unwrap).catch(handleErr);
const put     = (url, data)   => http.put(url, data).then(unwrap).catch(handleErr);
const patch   = (url, data)   => http.patch(url, data).then(unwrap).catch(handleErr);
const del     = (url)         => http.delete(url).then(unwrap).catch(handleErr);

// ── Auth ──────────────────────────────────────────────────────
export const login               = (d)    => post('/auth/login', d);
export const register            = (d)    => post('/auth/register', d);
export const logout              = ()     => post('/auth/logout');
export const recuperarContrasena = (d)    => post('/auth/recuperar', d);
export const cambiarContrasena   = (d)    => patch('/auth/cambiar-contrasena', d);
export const solicitarReset      = (d)    => post('/auth/solicitar-reset', d);
export const verificarReset      = (d)    => post('/auth/verificar-reset', d);
export const getPerfil           = ()     => get('/auth/perfil');
export const editarPerfil        = (d)    => patch('/auth/perfil', d);
export const desactivarCuenta    = ()     => patch('/auth/desactivar-cuenta');
export const misDirecciones        = ()    => get('/auth/mis-direcciones');
export const crearMiDireccion      = (d)   => post('/auth/mis-direcciones', d);
export const eliminarMiDireccion   = (id)  => del(`/auth/mis-direcciones/${id}`);
export const cambiarContrasenaAuth = (d)   => patch('/auth/cambiar-contrasena-auth', d);

// ── Catálogo (público, sin token) ─────────────────────────────
export const catalogoProductos   = ()     => get('/catalogo/productos');
export const catalogoCategorias  = ()     => get('/catalogo/categorias');
export const catalogoToppings    = ()     => get('/catalogo/toppings');
export const catalogoAdiciones   = ()     => get('/catalogo/adiciones');
export const catalogoBuscar      = (q)    => get('/catalogo/buscar', { q });
export const catalogoPromociones = ()     => get('/catalogo/promociones');

// ── Ventas ────────────────────────────────────────────────────
export const listarVentas        = (est, fecha) => get('/ventas', { ...(est ? { estado: est } : {}), ...(fecha ? { fecha } : {}) });
export const obtenerVenta        = (id)   => get(`/ventas/${id}`);
export const crearVenta          = (d)    => post('/ventas', d);
export const cambiarEstadoVenta  = (id,d) => patch(`/ventas/${id}/estado`, d);
export const anularVenta         = (id,d) => patch(`/ventas/${id}/anular`, d);
export const misVentas           = ()     => get('/ventas/mis-pedidos');
export const crearMiPedido       = (d)    => post('/ventas/mi-pedido', d);

// ── Dashboard ─────────────────────────────────────────────────
export const dashTotalDia           = (fecha) => get('/dashboard/total-dia', fecha ? { fecha } : undefined);
export const dashTotalidadClientes  = ()       => get('/dashboard/totalidad-clientes');
export const dashVentasPorSemana    = ()       => get('/dashboard/ventas-por-semana');
export const dashVentasPorMes       = ()       => get('/dashboard/ventas-por-mes');
export const dashProductosMasVendidos= ()      => get('/dashboard/productos-mas-vendidos');
export const dashRecaudoPedidos     = ()       => get('/dashboard/recaudo-pedidos');
export const pedidosRecientes       = (n, fecha) => get('/dashboard/pedidos-recientes', { ...(n ? { limite: n } : {}), ...(fecha ? { fecha } : {}) });
export const getDomiciliariosDia    = (fecha) => get('/dashboard/domiciliarios-dia', fecha ? { fecha } : undefined);
// Calls all dashboard endpoints in parallel
export const getDashboard = async (fecha) => {
  const params = fecha ? { fecha } : undefined;
  const [totalDia, clientes, prods, semana, porMes, porDia] = await Promise.all([
    get('/dashboard/total-dia',            params).catch(() => ({})),
    get('/dashboard/totalidad-clientes',   params).catch(() => ({})),
    get('/dashboard/productos-mas-vendidos').catch(() => []),
    get('/dashboard/ventas-por-semana').catch(() => []),
    get('/dashboard/ventas-por-mes').catch(() => []),
    get('/dashboard/ventas-por-dia',       params).catch(() => []),
  ]);
  return {
    ventas_hoy:          totalDia.total_ventas       || 0,
    ingresos_hoy:        totalDia.monto_total        || 0,
    clientes_hoy:        clientes.nuevosHoy          || 0,
    domicilios_activos:  0,
    total_efectivo:      totalDia.total_efectivo     || 0,
    total_transferencia: totalDia.total_transferencia || 0,
    total_domicilios:    totalDia.total_domicilios   || 0,
    top_productos:     (prods || []).map(p => ({
      nombre:   p.producto?.nombre || '—',
      cantidad: p.total_vendido    || 0,
    })),
    ventas_semana: Array.isArray(semana)
      ? semana.map(d => ({ label: `S${d.semana || ''}`, total: Number(d.monto_total || 0) }))
      : [],
    ventas_mes: Array.isArray(porMes)
      ? porMes.map(d => ({ label: `${d.mes}/${String(d.año || '').slice(-2)}`, total: Number(d.monto_total || 0) }))
      : [],
    ventas_dia: Array.isArray(porDia)
      ? porDia.map(d => ({ label: d.label || '', total: Number(d.total || 0) }))
      : [],
  };
};

// ── Categorías ────────────────────────────────────────────────
export const listarCategorias    = ()     => get('/categorias');
export const crearCategoria      = (d)    => post('/categorias', d);
export const actualizarCategoria = (id,d) => put(`/categorias/${id}`, d);
export const eliminarCategoria   = (id)   => del(`/categorias/${id}`);
export const estadoCategoria     = (id,d) => patch(`/categorias/${id}/estado`, d);

// ── Productos ─────────────────────────────────────────────────
export const listarProductos     = ()     => get('/productos');
export const obtenerProducto     = (id)   => get(`/productos/${id}`);
export const crearProducto       = (d)    => post('/productos', d);
export const actualizarProducto  = (id,d) => put(`/productos/${id}`, d);
export const eliminarProducto    = (id)   => del(`/productos/${id}`);
export const estadoProducto      = (id,d) => patch(`/productos/${id}/estado`, d);

// ── Toppings ──────────────────────────────────────────────────
export const listarToppings      = ()     => get('/toppings');
export const crearTopping        = (d)    => post('/toppings', d);
export const actualizarTopping   = (id,d) => put(`/toppings/${id}`, d);
export const eliminarTopping     = (id)   => del(`/toppings/${id}`);
export const estadoTopping       = (id,d) => patch(`/toppings/${id}/estado`, d);

// ── Adiciones ─────────────────────────────────────────────────
export const listarAdiciones     = ()     => get('/adiciones');
export const crearAdicion        = (d)    => post('/adiciones', d);
export const actualizarAdicion   = (id,d) => put(`/adiciones/${id}`, d);
export const eliminarAdicion     = (id)   => del(`/adiciones/${id}`);
export const estadoAdicion       = (id,d) => patch(`/adiciones/${id}/estado`, d);

// ── Clientes ──────────────────────────────────────────────────
export const listarClientes             = ()     => get('/clientes');
export const obtenerCliente             = (id)   => get(`/clientes/${id}`);
export const crearCliente               = (d)    => post('/clientes', d);
export const actualizarCliente          = (id,d) => put(`/clientes/${id}`, d);
export const eliminarCliente            = (id)   => del(`/clientes/${id}`);
export const estadoCliente              = (id,d) => patch(`/clientes/${id}/estado`, d);
export const listarDireccionesCliente   = (id)   => get(`/clientes/${id}/direcciones`);

// ── Empleados ─────────────────────────────────────────────────
export const listarEmpleados     = ()     => get('/empleados');
export const obtenerEmpleado     = (id)   => get(`/empleados/${id}`);
export const crearEmpleado       = (d)    => post('/empleados', d);
export const actualizarEmpleado  = (id,d) => put(`/empleados/${id}`, d);
export const eliminarEmpleado    = (id)   => del(`/empleados/${id}`);
export const estadoEmpleado      = (id,d) => patch(`/empleados/${id}/estado`, d);

// ── Usuarios ──────────────────────────────────────────────────
export const listarUsuarios      = ()     => get('/usuarios');
export const crearUsuario        = (d)    => post('/usuarios', d);
export const actualizarUsuario   = (id,d) => put(`/usuarios/${id}`, d);
export const eliminarUsuario     = (id)   => del(`/usuarios/${id}`);
export const estadoUsuario       = (id,d) => patch(`/usuarios/${id}/activar-desactivar`, d);

// ── Roles ─────────────────────────────────────────────────────
export const listarRoles         = ()        => get('/roles');
export const obtenerRol          = (id)      => get(`/roles/${id}`);
export const listarPermisos      = ()        => get('/roles/permisos');
export const crearRol            = (d)       => post('/roles', d);
export const actualizarRol       = (id,d)    => put(`/roles/${id}`, d);
export const eliminarRol         = (id)      => del(`/roles/${id}`);
export const asignarRolPermisos  = (id, permisos) => patch(`/roles/${id}/permisos`, { permisos });

// ── Domicilios ────────────────────────────────────────────────
export const listarDomicilios    = (est)  => get('/domicilios', est ? { estado: est } : undefined);
export const asignarDomicilio    = (d)    => post('/domicilios/asignar', d);
export const cambiarEstadoDomi   = (id,d) => patch(`/domicilios/${id}/estado`, d);
export const misPedidosDomi      = ()     => get('/domicilios/mis-pedidos');
export const cogerPedido         = (id)   => patch(`/domicilios/${id}/coger`);
export const despacharPedido     = (id,d) => patch(`/domicilios/${id}/despachar`, d);
export const entregarPedido      = (id,d) => patch(`/domicilios/${id}/entregar`, d);

export default http;
