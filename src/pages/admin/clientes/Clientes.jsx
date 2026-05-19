import { Search } from 'lucide-react';
import { toast } from '../../../utils/toast';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import './Clientes.css';
import * as api from '../../../services/api';
import FormDireccion from '../../../components/common/FormDireccion';

const POR_PAGINA = 5;

function Toggle({ activo, onChange }) {
  return (
    <div
      className="toggle-wrap"
      style={{ background: activo ? '#22c55e' : '#9ca3af' }}
      onClick={onChange}
      title={activo ? 'Activo' : 'Inactivo'}
    >
      <div className="toggle-circulo" style={{ left: activo ? 23 : 3 }}></div>
    </div>
  );
}

function ModalFormulario({ open, onClose, onGuardar, clienteEditar }) {
  const [nombre,       setNombre]       = useState(clienteEditar?.nombre        || '');
  const [email,        setEmail]        = useState(clienteEditar?.email         || '');
  const [contrasena,   setContrasena]   = useState('');
  const [confirmarPass,setConfirmarPass]= useState('');
  const [telefono,     setTelefono]     = useState(clienteEditar?.telefono      || '');
  const [direccion, setDireccion] = useState({
    direccion_linea: clienteEditar?.direccion_linea || '',
    barrio:          clienteEditar?.barrio          || '',
    ciudad:          clienteEditar?.ciudad          || '',
    departamento:    clienteEditar?.departamento    || '',
    referencia:      clienteEditar?.referencia      || '',
  });
  const [errDir, setErrDir] = useState({});
  const [errores, setErrores] = useState({});

  if (!open) return null;

  const validar = () => {
    const e = {};
    if (!nombre.trim())  e.nombre  = 'El nombre es requerido';
    if (!email.trim())   e.email   = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email no válido';
    if (!clienteEditar) {
      if (!contrasena)                  e.contrasena    = 'La contraseña es requerida';
      else if (contrasena.length < 6)   e.contrasena    = 'Mínimo 6 caracteres';
      if (contrasena !== confirmarPass) e.confirmarPass = 'Las contraseñas no coinciden';
    }
    if (!telefono.trim()) e.telefono = 'El teléfono es requerido';
    if (!direccion.direccion_linea.trim()) e['dir.direccion_linea'] = 'La dirección es requerida';
    if (!direccion.ciudad.trim())          e['dir.ciudad']          = 'La ciudad es requerida';
    return e;
  };

  const guardar = () => {
    const e = validar();
    const dirErrs = {};
    if (!direccion.direccion_linea.trim()) dirErrs.direccion_linea = 'La dirección es requerida';
    if (!direccion.barrio.trim())          dirErrs.barrio          = 'El barrio es requerido';
    if (!direccion.ciudad.trim())          dirErrs.ciudad          = 'La ciudad es requerida';
    if (Object.keys(e).length > 0 || Object.keys(dirErrs).length > 0) {
      setErrores(e); setErrDir(dirErrs); return;
    }
    onGuardar({
      nombre: nombre.trim(), email: email.trim(), contrasena,
      telefono: telefono.trim(),
      ...direccion,
    });
  };

  const campo = (placeholder, value, onChange, errorKey, type = 'text') => (
    <div className="form-grupo">
      <input
        className={`form-input${errores[errorKey] ? ' input-error' : ''}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setErrores((p) => ({ ...p, [errorKey]: '' })); }}
      />
      {errores[errorKey] && <span className="form-error">{errores[errorKey]}</span>}
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-caja" style={{ width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-encabezado">
          <span className="modal-titulo">{clienteEditar ? 'Editar cliente' : 'Nuevo cliente'}</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>

        <span className="form-seccion-titulo">Cuenta</span>
        <div className="form-fila">
          {campo('Nombre completo',     nombre,    setNombre,    'nombre')}
          {campo('Correo electrónico',  email,     setEmail,     'email', 'email')}
        </div>

        {!clienteEditar && (
          <div className="form-fila">
            {campo('Contraseña (mín. 6 caracteres)', contrasena,    setContrasena,    'contrasena',    'password')}
            {campo('Confirmar contraseña',           confirmarPass, setConfirmarPass, 'confirmarPass', 'password')}
          </div>
        )}

        {campo('Teléfono', telefono, setTelefono, 'telefono', 'tel')}

        <span className="form-seccion-titulo">Dirección</span>
        <FormDireccion
          value={direccion}
          onChange={(f, v) => { setDireccion((p) => ({ ...p, [f]: v })); setErrDir((p) => ({ ...p, [f]: '' })); }}
          errors={errDir}
          layout="admin"
        />

        <div className="modal-pie">
          <button className="btn-secundario" onClick={onClose}>Cancelar</button>
          {clienteEditar
            ? <button className="btn-editar-modal" onClick={guardar}>Guardar cambios</button>
            : <button className="btn-primario"     onClick={guardar}>Crear cliente</button>
          }
        </div>
      </div>
    </div>
  );
}

function ModalEliminar({ open, onClose, onConfirmar, nombre }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-caja modal-pequeno">
        <div className="modal-icono-grande">🗑️</div>
        <p className="modal-texto-confirmar">
          ¿Eliminar al cliente <strong>"{nombre}"</strong>?<br />Esta acción no se puede deshacer.
        </p>
        <div className="modal-pie centrado" style={{ marginTop: 24 }}>
          <button className="btn-secundario" onClick={onClose}>Cancelar</button>
          <button className="btn-peligro"    onClick={onConfirmar}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

function ModalDetalle({ open, onClose, cliente }) {
  const [puntosCliente, setPuntosCliente] = useState(null);

  useEffect(() => {
    if (open && cliente?.id_cliente) {
      api.getPuntosCliente(cliente.id_cliente).then(setPuntosCliente).catch(() => {});
    }
  }, [open, cliente?.id_cliente]);

  if (!open || !cliente) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-caja" style={{ width: 520 }}>
        <div className="modal-encabezado">
          <span className="modal-titulo">Detalle de cliente</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>
        <div className="detalle-grid">
          <div className="detalle-item detalle-full">
            <span className="detalle-label">Nombre</span>
            <span className="detalle-valor">{cliente.nombre}</span>
          </div>
          <div className="detalle-item detalle-full">
            <span className="detalle-label">Email</span>
            <span className="detalle-valor">{cliente.email || cliente.usuario?.email || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Teléfono</span>
            <span className="detalle-valor">{cliente.telefono || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Registro</span>
            <span className="detalle-valor">{cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString('es-CO') : '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Estado</span>
            <span className="detalle-badge" style={{
              background: cliente.usuario?.estado ? '#f0fdf4' : '#fff5f5',
              color:      cliente.usuario?.estado ? '#22c55e' : '#CA0B0B',
            }}>
              {cliente.usuario?.estado ? '● Activo' : '● Inactivo'}
            </span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Ciudad</span>
            <span className="detalle-valor">{cliente.ciudad || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Barrio</span>
            <span className="detalle-valor">{cliente.barrio || '—'}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Departamento</span>
            <span className="detalle-valor">{cliente.departamento || '—'}</span>
          </div>
          <div className="detalle-item detalle-full">
            <span className="detalle-label">Dirección</span>
            <span className="detalle-valor">{cliente.direccion_linea || '—'}</span>
          </div>
          <div className="detalle-item detalle-full">
            <span className="detalle-label">Referencia</span>
            <span className="detalle-valor">{cliente.referencia || '—'}</span>
          </div>
        </div>
        {/* Puntos fidelidad */}
        <div style={{ background: '#fff5f5', borderRadius: 10, padding: '12px 16px', marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#888', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>PUNTOS CHOCOFRESEO</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#CA0B0B' }}>{puntosCliente?.puntos ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#888' }}>puntos</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>
                ${((puntosCliente?.puntos ?? 0) * 12.5).toLocaleString('es-CO')}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>saldo disponible</div>
            </div>
          </div>
        </div>

        <div className="modal-pie">
          <button className="btn-detalle" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function Clientes() {
  const [lista,        setLista]        = useState([]);
  const [busqueda,     setBusqueda]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pagina,       setPagina]       = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [eliminando,   setEliminando]   = useState(null);
  const [detalle,      setDetalle]      = useState(null);

  useEffect(() => {
    api.listarClientes()
      .then((data) => setLista(data.map((c) => ({ ...c, nombre: c.usuario?.nombre || c.nombre }))))
      .catch((err) => console.error('Error cargando clientes:', err));
  }, []);

  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado]);

  const filtrados = lista.filter((c) => {
    const q = busqueda.toLowerCase();
    const coincideBusqueda =
      (c.usuario?.nombre || c.nombre || '').toLowerCase().includes(q) ||
      (c.usuario?.email  || '').toLowerCase().includes(q) ||
      (c.telefono || '').includes(busqueda);
    const estado = c.usuario?.estado;
    const coincideEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos'   && estado === 1) ||
      (filtroEstado === 'inactivos' && estado !== 1);
    return coincideBusqueda && coincideEstado;
  });

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados    = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const toggle = async (c) => {
    const nuevoEstado = c.usuario?.estado ? 0 : 1;
    try {
      await api.estadoCliente(c.id_cliente, { estado: nuevoEstado });
      setLista((p) => p.map((x) =>
        x.id_cliente === c.id_cliente
          ? { ...x, usuario: { ...x.usuario, estado: nuevoEstado } }
          : x
      ));
    } catch (err) { console.error('Error cambiando estado cliente:', err); }
  };

  const crear = async (f) => {
    try {
      const nuevo = await api.crearCliente({ nombre: f.nombre, email: f.email, contrasena: f.contrasena, telefono: f.telefono, direccion_linea: f.direccion_linea, barrio: f.barrio, ciudad: f.ciudad, departamento: f.departamento, referencia: f.referencia });
      setLista((p) => [...p, { ...nuevo, nombre: nuevo.usuario?.nombre || nuevo.nombre || f.nombre }]);
      setModalAbierto(false);
    } catch (err) { console.error('Error creando cliente:', err); }
  };

  const editar = async (f) => {
    try {
      const actualizado = await api.actualizarCliente(editando.id_cliente, { telefono: f.telefono, barrio: f.barrio, ciudad: f.ciudad, departamento: f.departamento, referencia: f.referencia });
      setLista((p) => p.map((c) => c.id_cliente === editando.id_cliente ? { ...c, ...actualizado, nombre: actualizado.usuario?.nombre || actualizado.nombre || c.nombre } : c));
      setEditando(null);
    } catch (err) { console.error('Error editando cliente:', err); }
  };

  const eliminar = async () => {
    try {
      await api.eliminarCliente(eliminando.id_cliente);
      setLista((p) => p.filter((c) => c.id_cliente !== eliminando.id_cliente));
      setEliminando(null);
    } catch (err) {
      setEliminando(null);
      toast.error(err?.response?.data?.message || 'No se pudo eliminar el cliente');
    }
  };

  const chipEstado = [
    { key: 'todos',     label: 'Todos' },
    { key: 'activos',   label: 'Activos' },
    { key: 'inactivos', label: 'Inactivos' },
  ];

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-titulo">Clientes</h1>
          <p className="page-subtitulo">{lista.length} clientes registrados</p>
        </div>
        <button className="btn-primario" onClick={() => setModalAbierto(true)}>+ Añadir cliente</button>
      </div>

      <div className="buscador">
        <Search size={14} color="#aaa" />
        <input
          placeholder="Buscar por nombre, email o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {chipEstado.map((c) => (
          <button
            key={c.key}
            onClick={() => setFiltroEstado(c.key)}
            style={{
              padding: '5px 14px', borderRadius: 20, border: filtroEstado === c.key ? 'none' : '1px solid #e0e0e0',
              background: filtroEstado === c.key ? '#CA0B0B' : '#f5f5f5',
              color: filtroEstado === c.key ? '#fff' : '#555',
              fontWeight: filtroEstado === c.key ? 700 : 400, fontSize: 13, cursor: 'pointer',
            }}
          >{c.label}</button>
        ))}
      </div>

      <div className="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Barrio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginados.length === 0 ? (
              <tr><td colSpan={6}><div className="tabla-vacia">No se encontraron clientes</div></td></tr>
            ) : (
              paginados.map((c) => (
                <tr key={c.id_cliente}>
                  <td style={{ textTransform: 'capitalize' }}>{c.nombre}</td>
                  <td className="td-suave">{c.telefono}</td>
                  <td className="td-suave">{c.ciudad}</td>
                  <td className="td-suave">{c.barrio}</td>
                  <td><Toggle activo={c.usuario?.estado === 1} onChange={() => toggle(c)} /></td>
                  <td>
                    <div className="acciones">
                      <button className="btn-accion ver" onClick={() => setDetalle({ ...c })} title="Ver detalle">
                        <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="btn-accion editar" onClick={() => setEditando({ ...c })} title="Editar">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn-accion eliminar" onClick={() => setEliminando({ ...c })} title="Eliminar">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPaginas > 1 && (
          <div className="paginacion">
            <button className="btn-pagina" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}>‹</button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button key={n} className={`btn-pagina${pagina === n ? ' activo' : ''}`} onClick={() => setPagina(n)}>{n}</button>
            ))}
            <button className="btn-pagina" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>›</button>
          </div>
        )}
      </div>

      {modalAbierto && (
        <ModalFormulario key="nuevo" open={true} onClose={() => setModalAbierto(false)} onGuardar={crear} clienteEditar={null} />
      )}
      {editando && (
        <ModalFormulario key={`editar-${editando.id_cliente}`} open={true} onClose={() => setEditando(null)} onGuardar={editar} clienteEditar={editando} />
      )}
      {eliminando && (
        <ModalEliminar open={true} onClose={() => setEliminando(null)} onConfirmar={eliminar} nombre={eliminando?.nombre} />
      )}
      {detalle && (
        <ModalDetalle open={true} onClose={() => setDetalle(null)} cliente={lista.find((c) => c.id_cliente === detalle.id_cliente)} />
      )}
    </AdminLayout>
  );
}

