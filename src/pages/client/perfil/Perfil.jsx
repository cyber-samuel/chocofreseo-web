import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar/Navbar';
import Footer from '../../../components/layout/Footer/Footer';
import { useAuth } from '../../../context/AuthContext';
import * as api from '../../../services/api';
import './Perfil.css';

const colorEstado = (e) => ({
  entregado:   { bg: '#f0fdf4', color: '#16a34a' },
  pendiente:   { bg: '#fff5f5', color: '#CA0B0B' },
  'en cocina': { bg: '#fefce8', color: '#ca8a04' },
  despachado:  { bg: '#f5f3ff', color: '#7c3aed' },
  anulado:     { bg: '#f5f5f5', color: '#888'    },
}[e] || { bg: '#f5f5f5', color: '#888' });

function SeccionDatos({ usuario }) {
  const { actualizarUsuario } = useAuth();
  const [editando,  setEditando]  = useState(false);
  const [nombre,    setNombre]    = useState(usuario?.nombre    || '');
  const [telefono,  setTelefono]  = useState(usuario?.telefono  || '');
  const [ciudad,    setCiudad]    = useState(usuario?.ciudad    || '');
  const [barrio,    setBarrio]    = useState(usuario?.barrio    || '');
  const [guardado,  setGuardado]  = useState(false);
  const [error,     setError]     = useState('');

  const handleGuardar = async () => {
    setError('');
    try {
      const u = await api.editarPerfil({ nombre });
      actualizarUsuario({ nombre: u.nombre });
      setEditando(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al guardar');
    }
  };

  return (
    <div className="perfil-seccion">
      <div className="perfil-sec-header">
        <div>
          <h3 className="perfil-sec-titulo">Datos personales</h3>
          <p className="perfil-sec-sub">Tu información de contacto y entrega</p>
        </div>
        {!editando && (
          <button className="perfil-btn-editar" onClick={() => setEditando(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </button>
        )}
      </div>

      {guardado && <div className="perfil-alerta-ok">✓ Datos actualizados correctamente</div>}
      {error && <div className="perfil-alerta-err">{error}</div>}

      {!editando ? (
        <div className="perfil-datos-grid">
          <div className="perfil-dato-item">
            <span className="perfil-dato-label">Nombre</span>
            <span className="perfil-dato-valor">{nombre || '—'}</span>
          </div>
          <div className="perfil-dato-item">
            <span className="perfil-dato-label">Email</span>
            <span className="perfil-dato-valor">{usuario?.email || '—'}</span>
          </div>
          <div className="perfil-dato-item">
            <span className="perfil-dato-label">Teléfono</span>
            <span className="perfil-dato-valor">{telefono || '—'}</span>
          </div>
          <div className="perfil-dato-item">
            <span className="perfil-dato-label">Ciudad</span>
            <span className="perfil-dato-valor">{ciudad || '—'}</span>
          </div>
          <div className="perfil-dato-item">
            <span className="perfil-dato-label">Barrio</span>
            <span className="perfil-dato-valor">{barrio || '—'}</span>
          </div>
          <div className="perfil-dato-item">
            <span className="perfil-dato-label">Rol</span>
            <span className="perfil-dato-valor">{usuario?.rol || '—'}</span>
          </div>
        </div>
      ) : (
        <div className="perfil-form">
          <div className="perfil-form-fila">
            <div className="perfil-campo">
              <label className="perfil-label">Nombre</label>
              <input className="perfil-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="perfil-campo">
              <label className="perfil-label">Email</label>
              <input className="perfil-input" value={usuario?.email || ''} disabled style={{ opacity: .5 }} />
            </div>
          </div>
          <div className="perfil-form-fila">
            <div className="perfil-campo">
              <label className="perfil-label">Teléfono</label>
              <input className="perfil-input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="perfil-campo">
              <label className="perfil-label">Ciudad</label>
              <input className="perfil-input" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
            </div>
          </div>
          <div className="perfil-campo">
            <label className="perfil-label">Barrio</label>
            <input className="perfil-input" value={barrio} onChange={(e) => setBarrio(e.target.value)} />
          </div>
          <div className="perfil-form-botones">
            <button className="perfil-btn-sec" onClick={() => setEditando(false)}>Cancelar</button>
            <button className="perfil-btn-pri" onClick={handleGuardar}>Guardar cambios</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SeccionHistorial() {
  const [expandido,  setExpandido]  = useState(null);
  const [historial,  setHistorial]  = useState([]);
  const [cargando,   setCargando]   = useState(true);

  useEffect(() => {
    api.misVentas()
      .then((data) => setHistorial(data || []))
      .catch(() => setHistorial([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="perfil-seccion">
      <div className="perfil-sec-header">
        <div>
          <h3 className="perfil-sec-titulo">Historial de pedidos</h3>
          <p className="perfil-sec-sub">{historial.length} pedidos realizados</p>
        </div>
      </div>
      {cargando ? (
        <div className="perfil-vacio"><p>Cargando...</p></div>
      ) : historial.length === 0 ? (
        <div className="perfil-vacio"><span style={{ fontSize: 40 }}>🛒</span><p>Aún no tienes pedidos</p></div>
      ) : (
        <div className="historial-lista">
          {historial.map((v) => {
            const estadoNombre = v.estado?.nombre_estado || v.estado || 'pendiente';
            const est          = colorEstado(estadoNombre);
            const abierto      = expandido === v.id_venta;
            const fechaFmt     = v.fecha ? new Date(v.fecha).toLocaleString('es-CO') : '—';
            return (
              <div key={v.id_venta} className="historial-item">
                <div className="historial-item-header" onClick={() => setExpandido(abierto ? null : v.id_venta)}>
                  <div className="historial-item-izq">
                    <span className="historial-id">V-{String(v.id_venta).padStart(4,'0')}</span>
                    <span className="historial-fecha">{fechaFmt}</span>
                  </div>
                  <div className="historial-item-der">
                    <span className="historial-total">${Number(v.total).toLocaleString()}</span>
                    <span className="historial-estado" style={{ background: est.bg, color: est.color }}>{estadoNombre}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"
                      style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>
                {abierto && (
                  <div className="historial-item-detalle">
                    {(v.detalleVentas || []).map((d, i) => (
                      <div key={i} className="historial-producto">
                        <span>{d.cantidad}x {d.producto?.nombre || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SeccionContrasena() {
  const [actual,    setActual]    = useState('');
  const [nueva,     setNueva]     = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error,     setError]     = useState('');
  const [ok,        setOk]        = useState(false);

  const handleCambiar = async () => {
    if (!actual.trim() || !nueva.trim() || !confirmar.trim()) { setError('Completa todos los campos'); return; }
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden'); return; }
    if (nueva.length < 6)    { setError('Mínimo 6 caracteres'); return; }
    setError('');
    try {
      await api.cambiarContrasenaAuth({ contrasena_actual: actual, nueva_contrasena: nueva });
      setOk(true);
      setActual(''); setNueva(''); setConfirmar('');
      setTimeout(() => setOk(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  return (
    <div className="perfil-seccion">
      <div className="perfil-sec-header">
        <div>
          <h3 className="perfil-sec-titulo">Cambiar contraseña</h3>
          <p className="perfil-sec-sub">Elige una contraseña segura de mínimo 6 caracteres</p>
        </div>
      </div>
      {ok    && <div className="perfil-alerta-ok">✓ Contraseña actualizada correctamente</div>}
      {error && <div className="perfil-alerta-err">{error}</div>}
      <div className="perfil-form">
        <div className="perfil-campo">
          <label className="perfil-label">Contraseña actual</label>
          <input className="perfil-input" type="password" placeholder="••••••••" value={actual} onChange={(e) => { setActual(e.target.value); setError(''); }} />
        </div>
        <div className="perfil-form-fila">
          <div className="perfil-campo">
            <label className="perfil-label">Nueva contraseña</label>
            <input className="perfil-input" type="password" placeholder="••••••••" value={nueva} onChange={(e) => { setNueva(e.target.value); setError(''); }} />
          </div>
          <div className="perfil-campo">
            <label className="perfil-label">Confirmar contraseña</label>
            <input className="perfil-input" type="password" placeholder="••••••••" value={confirmar} onChange={(e) => { setConfirmar(e.target.value); setError(''); }} />
          </div>
        </div>
        <div className="perfil-form-botones">
          <button className="perfil-btn-pri" onClick={handleCambiar}>Cambiar contraseña</button>
        </div>
      </div>
    </div>
  );
}

function SeccionDirecciones({ usuario }) {
  const [direcciones, setDirecciones] = useState(usuario?.direcciones || []);
  const [agregando,   setAgregando]   = useState(false);
  const [nuevaDir,    setNuevaDir]    = useState('');
  const [nuevoBarrio, setNuevoBarrio] = useState('');
  const [nuevaRef,    setNuevaRef]    = useState('');

  const handleAgregar = () => {
    if (!nuevaDir.trim()) return;
    setDirecciones((p) => [...p, {
      id_direccion: Date.now(),
      direccion_linea: nuevaDir,
      barrio: nuevoBarrio,
      ciudad: usuario?.ciudad || '',
      referencia: nuevaRef,
    }]);
    setNuevaDir(''); setNuevoBarrio(''); setNuevaRef('');
    setAgregando(false);
  };

  const handleEliminar = (id) => setDirecciones((p) => p.filter((d) => d.id_direccion !== id));

  return (
    <div className="perfil-seccion">
      <div className="perfil-sec-header">
        <div>
          <h3 className="perfil-sec-titulo">Mis direcciones</h3>
          <p className="perfil-sec-sub">{direcciones.length} direcciones guardadas</p>
        </div>
        <button className="perfil-btn-editar" onClick={() => setAgregando(!agregando)}>+ Agregar</button>
      </div>

      {agregando && (
        <div className="perfil-form perfil-form-nueva-dir">
          <div className="perfil-form-fila">
            <div className="perfil-campo">
              <label className="perfil-label">Dirección</label>
              <input className="perfil-input" placeholder="Ej: Calle 10 #5-20" value={nuevaDir} onChange={(e) => setNuevaDir(e.target.value)} />
            </div>
            <div className="perfil-campo">
              <label className="perfil-label">Barrio</label>
              <input className="perfil-input" placeholder="Ej: El Poblado" value={nuevoBarrio} onChange={(e) => setNuevoBarrio(e.target.value)} />
            </div>
          </div>
          <div className="perfil-campo">
            <label className="perfil-label">Referencia (opcional)</label>
            <input className="perfil-input" placeholder="Ej: Casa de la esquina" value={nuevaRef} onChange={(e) => setNuevaRef(e.target.value)} />
          </div>
          <div className="perfil-form-botones">
            <button className="perfil-btn-sec" onClick={() => setAgregando(false)}>Cancelar</button>
            <button className="perfil-btn-pri" onClick={handleAgregar} disabled={!nuevaDir.trim()}>Guardar dirección</button>
          </div>
        </div>
      )}

      <div className="direcciones-lista">
        {direcciones.length === 0 ? (
          <div className="perfil-vacio"><span style={{ fontSize: 36 }}>📍</span><p>No tienes direcciones guardadas</p></div>
        ) : (
          direcciones.map((d) => (
            <div key={d.id_direccion} className="direccion-card">
              <div className="direccion-icono">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="direccion-info">
                <div className="direccion-linea">{d.direccion_linea}</div>
                <div className="direccion-sub">{d.barrio} — {d.ciudad}</div>
                {d.referencia && <div className="direccion-ref">{d.referencia}</div>}
              </div>
              <button className="direccion-eliminar" onClick={() => handleEliminar(d.id_direccion)} title="Eliminar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SeccionDesactivar() {
  const [confirmar, setConfirmar] = useState(false);
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const navigate    = useNavigate();
  const { logout }  = useAuth();

  const handleDesactivar = () => {
    if (!password.trim()) { setError('Ingresa tu contraseña para confirmar'); return; }
    logout();
    navigate('/login');
  };

  return (
    <div className="perfil-seccion">
      <div className="perfil-sec-header">
        <div>
          <h3 className="perfil-sec-titulo">Desactivar cuenta</h3>
          <p className="perfil-sec-sub">Esta acción desactivará tu cuenta temporalmente</p>
        </div>
      </div>
      {!confirmar ? (
        <div className="desactivar-aviso">
          <div className="desactivar-aviso-icono">⚠️</div>
          <div>
            <p className="desactivar-aviso-titulo">¿Estás seguro que quieres desactivar tu cuenta?</p>
            <p className="desactivar-aviso-desc">No podrás realizar pedidos mientras tu cuenta esté desactivada. Puedes reactivarla contactándonos.</p>
          </div>
          <button className="perfil-btn-danger" onClick={() => setConfirmar(true)}>Desactivar cuenta</button>
        </div>
      ) : (
        <div className="perfil-form">
          <p className="desactivar-confirm-texto">Ingresa tu contraseña para confirmar:</p>
          <div className="perfil-campo">
            <label className="perfil-label">Contraseña</label>
            <input className="perfil-input" type="password" placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
          </div>
          {error && <div className="perfil-alerta-err">{error}</div>}
          <div className="perfil-form-botones">
            <button className="perfil-btn-sec" onClick={() => setConfirmar(false)}>Cancelar</button>
            <button className="perfil-btn-danger" onClick={handleDesactivar}>Confirmar desactivación</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Perfil() {
  const [seccionActiva, setSeccionActiva] = useState('datos');
  const navigate        = useNavigate();
  const { usuario }     = useAuth();

  const menu = [
    { id: 'datos',       label: 'Datos personales',   icono: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { id: 'historial',   label: 'Historial de pedidos', icono: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { id: 'contrasena',  label: 'Cambiar contraseña',  icono: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
    { id: 'direcciones', label: 'Mis direcciones',     icono: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    { id: 'desactivar',  label: 'Desactivar cuenta',   icono: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>, peligro: true },
  ];

  return (
    <div className="perfil-wrapper">
      <Navbar />
      <div className="perfil-page">
        <div className="perfil-hero">
          <div className="perfil-hero-avatar">
            {usuario?.nombre?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="perfil-hero-nombre">{usuario?.nombre || 'Usuario'}</h1>
            <p className="perfil-hero-email">{usuario?.email || ''}</p>
          </div>
          <button className="perfil-hero-catalogo" onClick={() => navigate('/catalogo')}>
            Ver catálogo
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <div className="perfil-layout">
          <aside className="perfil-sidebar">
            {menu.map((item) => (
              <button
                key={item.id}
                className={`perfil-menu-item ${seccionActiva === item.id ? 'activo' : ''} ${item.peligro ? 'peligro' : ''}`}
                onClick={() => setSeccionActiva(item.id)}
              >
                {item.icono}
                <span>{item.label}</span>
              </button>
            ))}
          </aside>

          <div className="perfil-contenido">
            {seccionActiva === 'datos'       && <SeccionDatos       usuario={usuario} />}
            {seccionActiva === 'historial'   && <SeccionHistorial   />}
            {seccionActiva === 'contrasena'  && <SeccionContrasena  />}
            {seccionActiva === 'direcciones' && <SeccionDirecciones usuario={usuario} />}
            {seccionActiva === 'desactivar'  && <SeccionDesactivar  />}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}