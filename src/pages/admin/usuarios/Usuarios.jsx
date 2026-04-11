import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import './Usuarios.css';
import * as api from '../../../services/api';

const roles = [
  { id_rol: 1, nombre: 'Administrador' },
  { id_rol: 2, nombre: 'Domiciliario' },
  { id_rol: 3, nombre: 'Confirmador' },
  { id_rol: 4, nombre: 'Cliente' },
];

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

function ModalFormulario({ open, onClose, onGuardar, usuarioEditar }) {
  const [nombre,        setNombre]        = useState(usuarioEditar?.nombre || '');
  const [email,         setEmail]         = useState(usuarioEditar?.email  || '');
  const [contrasena,    setContrasena]    = useState('');
  const [confirmarPass, setConfirmarPass] = useState('');
  const [idRol,         setIdRol]         = useState(usuarioEditar?.id_rol ?? 1);
  const [estado,        setEstado]        = useState(usuarioEditar?.estado ?? 1);
  const [errores,       setErrores]       = useState({});

  if (!open) return null;

  const validar = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!email.trim())  e.email  = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email no válido';
    if (!usuarioEditar) {
      if (!contrasena)                e.contrasena    = 'La contraseña es requerida';
      else if (contrasena.length < 6) e.contrasena    = 'Mínimo 6 caracteres';
      if (contrasena !== confirmarPass) e.confirmarPass = 'Las contraseñas no coinciden';
    }
    return e;
  };

  const guardar = () => {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    onGuardar({ nombre: nombre.trim(), email: email.trim(), contrasena, id_rol: Number(idRol), estado });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-caja">
        <div className="modal-encabezado">
          <span className="modal-titulo">{usuarioEditar ? 'Editar usuario' : 'Nuevo usuario'}</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>

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

        {/* Contraseña solo al crear */}
        {!usuarioEditar && (
          <>
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
          </>
        )}

        <div className="form-grupo">
          <select
            className="form-input"
            value={idRol}
            onChange={(e) => setIdRol(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
            ))}
          </select>
        </div>

        {/* Estado solo al editar */}
        {usuarioEditar && (
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
          {usuarioEditar
            ? <button className="btn-editar-modal" onClick={guardar}>Guardar cambios</button>
            : <button className="btn-primario"     onClick={guardar}>Crear usuario</button>
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
          ¿Eliminar al usuario <strong>"{nombre}"</strong>?<br />Esta acción no se puede deshacer.
        </p>
        <div className="modal-pie centrado" style={{ marginTop: 24 }}>
          <button className="btn-secundario" onClick={onClose}>Cancelar</button>
          <button className="btn-peligro"    onClick={onConfirmar}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

function ModalDetalle({ open, onClose, usuario }) {
  if (!open || !usuario) return null;
  const rolNombre = usuario.rol?.nombre || roles.find((r) => r.id_rol === usuario.id_rol)?.nombre || '—';
  return (
    <div className="modal-overlay">
      <div className="modal-caja">
        <div className="modal-encabezado">
          <span className="modal-titulo">Detalle de usuario</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>
        <div className="detalle-grid">
          <div className="detalle-item">
            <span className="detalle-label">Estado</span>
            <span className="detalle-badge" style={{
              background: usuario.estado ? '#f0fdf4' : '#fff5f5',
              color:      usuario.estado ? '#22c55e' : '#CA0B0B',
            }}>
              {usuario.estado ? '● Activo' : '● Inactivo'}
            </span>
          </div>
          <div className="detalle-item">
            <span className="detalle-label">Rol</span>
            <span className="detalle-valor">{rolNombre}</span>
          </div>
          <div className="detalle-item detalle-full">
            <span className="detalle-label">Nombre</span>
            <span className="detalle-valor">{usuario.nombre}</span>
          </div>
          <div className="detalle-item detalle-full">
            <span className="detalle-label">Correo electrónico</span>
            <span className="detalle-valor">{usuario.email}</span>
          </div>
          {usuario.empleado && (
            <div className="detalle-item">
              <span className="detalle-label">Cargo</span>
              <span className="detalle-valor">{usuario.empleado.cargo || '—'}</span>
            </div>
          )}
          <div className="detalle-item">
            <span className="detalle-label">Fecha de registro</span>
            <span className="detalle-valor">{usuario.fecha_registro || '—'}</span>
          </div>
        </div>
        <div className="modal-pie">
          <button className="btn-detalle" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function Usuarios() {
  const [lista,        setLista]        = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [busqueda,     setBusqueda]     = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [eliminando,   setEliminando]   = useState(null);
  const [detalle,      setDetalle]      = useState(null);

  useEffect(() => {
    api.listarUsuarios()
      .then((data) => setLista(data.map((u) => ({ ...u, id_rol: u.rol?.id_rol || u.id_rol }))))
      .catch((err) => console.error('Error cargando usuarios:', err))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = lista.filter((u) => {
    const q = busqueda.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.rol?.nombre || '').toLowerCase().includes(q)
    );
  });

  const getRol = (id) => roles.find((r) => r.id_rol === id)?.nombre || '—';

  const crear = async (f) => {
    try {
      const nuevo = await api.crearUsuario({ nombre: f.nombre, email: f.email, contrasena: f.contrasena, id_rol: f.id_rol });
      setLista((p) => [...p, { ...nuevo, id_rol: nuevo.rol?.id_rol || nuevo.id_rol || f.id_rol }]);
      setModalAbierto(false);
    } catch (err) { console.error('Error creando usuario:', err); }
  };

  const editar = async (f) => {
    try {
      const actualizado = await api.actualizarUsuario(editando.id_usuario, { nombre: f.nombre, email: f.email, id_rol: f.id_rol });
      setLista((p) => p.map((u) => u.id_usuario === editando.id_usuario ? { ...u, ...actualizado, id_rol: actualizado.rol?.id_rol || actualizado.id_rol || f.id_rol } : u));
      setEditando(null);
    } catch (err) { console.error('Error editando usuario:', err); }
  };

  const eliminar = async () => {
    try {
      await api.eliminarUsuario(eliminando.id_usuario);
      setLista((p) => p.filter((u) => u.id_usuario !== eliminando.id_usuario));
      setEliminando(null);
    } catch (err) {
      setEliminando(null);
      alert(err?.response?.data?.message || 'No se pudo eliminar el usuario');
    }
  };

  const toggle = async (id) => {
    const usuario = lista.find((u) => u.id_usuario === id);
    const nuevoEstado = usuario.estado ? 0 : 1;
    try {
      await api.estadoUsuario(id, { estado: nuevoEstado });
      setLista((p) => p.map((u) => u.id_usuario === id ? { ...u, estado: nuevoEstado } : u));
    } catch (err) { console.error('Error cambiando estado usuario:', err); }
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-titulo">Usuarios</h1>
          <p className="page-subtitulo">{lista.length} usuarios registrados</p>
        </div>
        <button className="btn-primario" onClick={() => setModalAbierto(true)}>+ Añadir usuario</button>
      </div>

      <div className="buscador">
        <span>🔍</span>
        <input
          placeholder="Buscar usuario..."
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
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={5}><div className="tabla-vacia">No se encontraron usuarios</div></td></tr>
            ) : (
              filtrados.map((u) => (
                <tr key={u.id_usuario}>
                  <td style={{ textTransform: 'capitalize' }}>{u.nombre}</td>
                  <td className="td-suave">{u.email}</td>
                  <td>
                    <span>{u.rol?.nombre || getRol(u.id_rol)}</span>
                    {u.empleado?.cargo && <span className="td-suave" style={{ display: 'block', fontSize: 11 }}>{u.empleado.cargo}</span>}
                  </td>
                  <td><Toggle activo={u.estado === 1} onChange={() => toggle(u.id_usuario)} /></td>
                  <td>
                    <div className="acciones">
                      <button className="btn-accion ver" onClick={() => setDetalle({ ...u })} title="Ver detalle">
                        <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="btn-accion editar" onClick={() => setEditando({ ...u })} title="Editar">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn-accion eliminar" onClick={() => setEliminando({ ...u })} title="Eliminar">
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
          usuarioEditar={null}
        />
      )}

      {editando && (
        <ModalFormulario
          key={`editar-${editando.id_usuario}`}
          open={true}
          onClose={() => setEditando(null)}
          onGuardar={editar}
          usuarioEditar={editando}
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
          usuario={lista.find((u) => u.id_usuario === detalle.id_usuario)}
        />
      )}
    </AdminLayout>
  );
}