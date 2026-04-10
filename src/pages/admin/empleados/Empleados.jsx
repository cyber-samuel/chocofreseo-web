import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import * as api from '../../../services/api';
import './Empleados.css';

const cargos = ['Administrador', 'Domiciliario', 'Vendedor', 'Cajero'];

// Aplana datos de API para que coincidan con la forma que espera el render
const mapEmpleado = (e) => ({
  ...e,
  nombre:       e.usuario?.nombre       || e.nombre        || '—',
  email:        e.usuario?.email        || e.email         || '—',
  fecha_ingreso: e.fecha_ingreso        || '',
});

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

function ModalFormulario({ open, onClose, onGuardar, empleadoEditar }) {
  const [nombre,        setNombre]        = useState(empleadoEditar?.nombre        || '');
  const [email,         setEmail]         = useState(empleadoEditar?.email         || '');
  const [contrasena,    setContrasena]    = useState('');
  const [confirmarPass, setConfirmarPass] = useState('');
  const [cargo,         setCargo]         = useState(empleadoEditar?.cargo         || 'Vendedor');
  const [fechaIngreso,  setFechaIngreso]  = useState(empleadoEditar?.fecha_ingreso || '');
  const [estado,        setEstado]        = useState(empleadoEditar?.estado        ?? 1);
  const [errores,       setErrores]       = useState({});

  if (!open) return null;

  const validar = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!email.trim())  e.email  = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email no válido';
    if (!empleadoEditar) {
      if (!contrasena)                  e.contrasena    = 'La contraseña es requerida';
      else if (contrasena.length < 6)   e.contrasena    = 'Mínimo 6 caracteres';
      if (contrasena !== confirmarPass) e.confirmarPass = 'Las contraseñas no coinciden';
    }
    if (!fechaIngreso) e.fechaIngreso = 'La fecha de ingreso es requerida';
    return e;
  };

  const guardar = () => {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    onGuardar({ nombre: nombre.trim(), email: email.trim(), contrasena, cargo, fecha_ingreso: fechaIngreso, estado: empleadoEditar ? estado : 1 });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-caja" style={{ width: 540, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-encabezado">
          <span className="modal-titulo">{empleadoEditar ? 'Editar empleado' : 'Nuevo empleado'}</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>

        {/* Cuenta */}
        <span className="form-seccion-titulo">Cuenta</span>
        <div className="form-fila">
          <div className="form-grupo">
            <input
              className={`form-input${errores.nombre ? ' input-error' : ''}`}
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: '' })); }}
            />
            {errores.nombre && <span className="form-error">{errores.nombre}</span>}
          </div>
          <div className="form-grupo">
            <input
              className={`form-input${errores.email ? ' input-error' : ''}`}
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrores((p) => ({ ...p, email: '' })); }}
            />
            {errores.email && <span className="form-error">{errores.email}</span>}
          </div>
        </div>

        {/* Contraseña solo al crear */}
        {!empleadoEditar && (
          <div className="form-fila">
            <div className="form-grupo">
              <input
                className={`form-input${errores.contrasena ? ' input-error' : ''}`}
                type="password"
                placeholder="Contraseña (mín. 6 caracteres)"
                value={contrasena}
                onChange={(e) => { setContrasena(e.target.value); setErrores((p) => ({ ...p, contrasena: '' })); }}
              />
              {errores.contrasena && <span className="form-error">{errores.contrasena}</span>}
            </div>
            <div className="form-grupo">
              <input
                className={`form-input${errores.confirmarPass ? ' input-error' : ''}`}
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmarPass}
                onChange={(e) => { setConfirmarPass(e.target.value); setErrores((p) => ({ ...p, confirmarPass: '' })); }}
              />
              {errores.confirmarPass && <span className="form-error">{errores.confirmarPass}</span>}
            </div>
          </div>
        )}

        {/* Info laboral */}
        <span className="form-seccion-titulo">Información laboral</span>
        <div className="form-fila">
          <div className="form-grupo">
            <select className="form-input" value={cargo} onChange={(e) => setCargo(e.target.value)}>
              {cargos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-grupo">
            <input
              className={`form-input${errores.fechaIngreso ? ' input-error' : ''}`}
              type="date"
              value={fechaIngreso}
              onChange={(e) => { setFechaIngreso(e.target.value); setErrores((p) => ({ ...p, fechaIngreso: '' })); }}
            />
            {errores.fechaIngreso && <span className="form-error">{errores.fechaIngreso}</span>}
          </div>
        </div>

        {/* Estado solo al editar */}
        {empleadoEditar && (
          <div className="form-grupo">
            <div className="form-estado">
              <Toggle activo={estado === 1} onChange={() => setEstado(estado === 1 ? 0 : 1)} />
              <span className="form-estado-texto" style={{ color: estado ? '#22c55e' : '#CA0B0B' }}>
                {estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        )}

        <div className="modal-pie">
          <button className="btn-secundario" onClick={onClose}>Cancelar</button>
          {empleadoEditar
            ? <button className="btn-editar-modal" onClick={guardar}>Guardar cambios</button>
            : <button className="btn-primario"     onClick={guardar}>Crear empleado</button>
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
          ¿Eliminar al empleado <strong>"{nombre}"</strong>?<br />Esta acción no se puede deshacer.
        </p>
        <div className="modal-pie centrado" style={{ marginTop: 24 }}>
          <button className="btn-secundario" onClick={onClose}>Cancelar</button>
          <button className="btn-peligro"    onClick={onConfirmar}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

function ModalDetalle({ open, onClose, empleado }) {
  if (!open || !empleado) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-caja" style={{ width: 520 }}>
        <div className="modal-encabezado">
          <span className="modal-titulo">Detalle de empleado</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>
        <div className="detalle-grid">
          <div className="detalle-item">
            <span className="detalle-label">Estado</span>
            <span className="detalle-badge" style={{
              background: empleado.estado ? '#f0fdf4' : '#fff5f5',
              color:      empleado.estado ? '#22c55e' : '#CA0B0B',
            }}>
              {empleado.estado ? '● Activo' : '● Inactivo'}
            </span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Cargo</span>
            <span style={{
              background: '#fff5f5', color: '#CA0B0B',
              padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              border: '1px solid #f5c6c6',
            }}>{empleado.cargo}</span>
          </div>
          <div className="detalle-item detalle-full">
            <span className="detalle-label">Nombre</span>
            <span className="detalle-valor">{empleado.nombre}</span>
          </div>
          <div className="detalle-item detalle-full">
            <span className="detalle-label">Correo electrónico</span>
            <span className="detalle-valor">{empleado.email}</span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Fecha de ingreso</span>
            <span className="detalle-valor">{empleado.fecha_ingreso || '—'}</span>
          </div>
        </div>
        <div className="modal-pie">
          <button className="btn-detalle" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function Empleados() {
  const [lista,        setLista]        = useState([]);
  const [busqueda,     setBusqueda]     = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [eliminando,   setEliminando]   = useState(null);
  const [detalle,      setDetalle]      = useState(null);

  const cargar = () => api.listarEmpleados().then((d) => setLista(d.map(mapEmpleado))).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const filtrados = lista.filter((e) =>
    (e.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.cargo  || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const crear    = async (f)  => { await api.crearEmpleado(f).catch(() => {}); cargar(); setModalAbierto(false); };
  const editar   = async (f)  => { await api.actualizarEmpleado(editando.id_empleado, f).catch(() => {}); cargar(); setEditando(null); };
  const eliminar = async ()   => { await api.eliminarEmpleado(eliminando.id_empleado).catch(() => {}); cargar(); setEliminando(null); };
  const toggle   = async (id, estadoActual) => { await api.estadoEmpleado(id, { estado: estadoActual ? 0 : 1 }).catch(() => {}); cargar(); };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-titulo">Empleados</h1>
          <p className="page-subtitulo">{lista.length} empleados registrados</p>
        </div>
        <button className="btn-primario" onClick={() => setModalAbierto(true)}>+ Añadir empleado</button>
      </div>

      <div className="buscador">
        <span>🔍</span>
        <input
          placeholder="Buscar empleado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Cargo</th>
              <th>Fecha ingreso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={6}><div className="tabla-vacia">No se encontraron empleados</div></td></tr>
            ) : (
              filtrados.map((e) => (
                <tr key={e.id_empleado}>
                  <td style={{ textTransform: 'capitalize' }}>{e.nombre}</td>
                  <td className="td-suave">{e.email}</td>
                  <td>
                    <span style={{
                      background: '#fff5f5', color: '#CA0B0B',
                      padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                      border: '1px solid #f5c6c6',
                    }}>{e.cargo}</span>
                  </td>
                  <td className="td-suave">{e.fecha_ingreso || '—'}</td>
                  <td><Toggle activo={e.estado === 1} onChange={() => toggle(e.id_empleado, e.estado)} /></td>
                  <td>
                    <div className="acciones">
                      <button className="btn-accion ver" onClick={() => setDetalle({ ...e })} title="Ver detalle">
                        <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="btn-accion editar" onClick={() => setEditando({ ...e })} title="Editar">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn-accion eliminar" onClick={() => setEliminando({ ...e })} title="Eliminar">
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
          empleadoEditar={null}
        />
      )}
      {editando && (
        <ModalFormulario
          key={`editar-${editando.id_empleado}`}
          open={true}
          onClose={() => setEditando(null)}
          onGuardar={editar}
          empleadoEditar={editando}
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
          empleado={lista.find((e) => e.id_empleado === detalle.id_empleado)}
        />
      )}
    </AdminLayout>
  );
}