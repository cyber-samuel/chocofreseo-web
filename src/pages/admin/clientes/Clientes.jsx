import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import './Clientes.css';
import * as api from '../../../services/api';

function ModalFormulario({ open, onClose, onGuardar, clienteEditar }) {
  // Datos de usuario (se crean en tabla usuarios)
  const [nombre,       setNombre]       = useState(clienteEditar?.nombre        || '');
  const [email,        setEmail]        = useState(clienteEditar?.email         || '');
  const [contrasena,   setContrasena]   = useState('');
  const [confirmarPass,setConfirmarPass]= useState('');
  // Datos de cliente
  const [telefono,     setTelefono]     = useState(clienteEditar?.telefono      || '');
  // Datos de dirección (tabla direcciones)
  const [direccionLinea, setDireccionLinea] = useState(clienteEditar?.direccion_linea || '');
  const [barrio,       setBarrio]       = useState(clienteEditar?.barrio        || '');
  const [ciudad,       setCiudad]       = useState(clienteEditar?.ciudad        || '');
  const [departamento, setDepartamento] = useState(clienteEditar?.departamento  || '');
  const [referencia,   setReferencia]   = useState(clienteEditar?.referencia    || '');

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
    if (!direccionLinea.trim()) e.direccionLinea = 'La dirección es requerida';
    if (!ciudad.trim())   e.ciudad   = 'La ciudad es requerida';
    return e;
  };

  const guardar = () => {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    onGuardar({
      nombre: nombre.trim(), email: email.trim(), contrasena,
      telefono: telefono.trim(),
      direccion_linea: direccionLinea.trim(), barrio: barrio.trim(),
      ciudad: ciudad.trim(), departamento: departamento.trim(),
      referencia: referencia.trim(),
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

        {/* ── Sección cuenta ── */}
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

        {/* ── Sección dirección ── */}
        <span className="form-seccion-titulo">Dirección</span>
        <div className="form-fila">
          {campo('Dirección (ej: Calle 10 #5-20)', direccionLinea, setDireccionLinea, 'direccionLinea')}
          {campo('Barrio',                          barrio,         setBarrio,         'barrio')}
        </div>
        <div className="form-fila">
          {campo('Ciudad',       ciudad,      setCiudad,      'ciudad')}
          {campo('Departamento', departamento, setDepartamento, 'departamento')}
        </div>
        <div className="form-grupo">
          <input
            className="form-input"
            placeholder="Referencia (ej: Frente al parque)"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />
        </div>

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
          <div className="detalle-item">
            <span className="detalle-label">Teléfono</span>
            <span className="detalle-valor">{cliente.telefono || '—'}</span>
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
        <div className="modal-pie">
          <button className="btn-detalle" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function Clientes() {
  const [lista,        setLista]        = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [busqueda,     setBusqueda]     = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [eliminando,   setEliminando]   = useState(null);
  const [detalle,      setDetalle]      = useState(null);

  useEffect(() => {
    api.listarClientes()
      .then((data) => setLista(data.map((c) => ({ ...c, nombre: c.usuario?.nombre || c.nombre }))))
      .catch((err) => console.error('Error cargando clientes:', err))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = lista.filter((c) =>
    (c.usuario?.nombre || c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda)
  );

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
    } catch (err) { console.error('Error eliminando cliente:', err); }
  };

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
        <span>🔍</span>
        <input
          placeholder="Buscar cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Barrio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={5}><div className="tabla-vacia">No se encontraron clientes</div></td></tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id_cliente}>
                  <td style={{ textTransform: 'capitalize' }}>{c.nombre}</td>
                  <td className="td-suave">{c.telefono}</td>
                  <td className="td-suave">{c.ciudad}</td>
                  <td className="td-suave">{c.barrio}</td>
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
        <div className="paginacion">
          <button className="btn-pagina">‹</button>
          <button className="btn-pagina activo">1</button>
          <button className="btn-pagina">›</button>
        </div>
      </div>

      {modalAbierto && (
        <ModalFormulario
          key="nuevo"
          open={true}
          onClose={() => setModalAbierto(false)}
          onGuardar={crear}
          clienteEditar={null}
        />
      )}
      {editando && (
        <ModalFormulario
          key={`editar-${editando.id_cliente}`}
          open={true}
          onClose={() => setEditando(null)}
          onGuardar={editar}
          clienteEditar={editando}
        />
      )}
      {eliminando && (
        <ModalEliminar
          open={true}
          onClose={() => setEliminando(null)}
          onConfirmar={eliminar}
          nombre={eliminando?.nombre}
        />
      )}
      {detalle && (
        <ModalDetalle
          open={true}
          onClose={() => setDetalle(null)}
          cliente={lista.find((c) => c.id_cliente === detalle.id_cliente)}
        />
      )}
    </AdminLayout>
  );
}