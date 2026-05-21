import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Banknote, Smartphone, Zap, AlertTriangle, User } from 'lucide-react';
import Navbar from '../../../components/layout/Navbar/Navbar';
import Footer from '../../../components/layout/Footer/Footer';
import { useAuth } from '../../../context/AuthContext';
import { useTiempoEspera } from '../../../hooks/useTiempoEspera';
import * as api from '../../../services/api';
import FormDireccion from '../../../components/common/FormDireccion';
import './Perfil.css';

const COLOR_SALSAS   = '#ea580c';
const MAX_SALSAS_GRATIS  = 2;
const PRECIO_SALSA_EXTRA = 5000;
const parsearSalsas = (raw) => { if (!raw) return []; try { const p = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(p) ? p : []; } catch { return []; } };
const nombreSalsa   = (s) => { const n = typeof s === 'object' ? s.nombre : s; if (!n) return ''; return n.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); };
const calcularSubtotalDetalle = (d) => {
  // Usar producto.precio (base pura) para recalcular desde cero y evitar doble conteo
  const precioBase   = Number(d.producto?.precio || 0);
  const precioUnitBD = Number(d.precio_unitario || 0);
  const cantidad     = d.cantidad || 1;
  const permTop      = d.producto?.permite_toppings;
  const maxInc       = permTop ? (d.producto?.max_toppings || 0) : 0;
  const totTop       = (d.detalleToppings || []).reduce((s,t) => s+(t.cantidad||1), 0);
  const cobTop       = Math.max(0, totTop - maxInc);
  const topExtra     = cobTop * 2000;
  const salsas       = parsearSalsas(d.salsas);
  const cobSal       = Math.max(0, salsas.length - MAX_SALSAS_GRATIS);
  const salExtra     = cobSal * PRECIO_SALSA_EXTRA;
  const adicsTotal   = (d.detalleAdiciones || []).reduce((s,a) => s+Number(a.subtotal||0), 0);
  const precioCalc   = precioBase + topExtra + salExtra;
  // Usar el mayor entre BD y calculado (cubre registros viejos)
  const precioFinal  = Math.max(precioUnitBD, precioCalc);
  return precioFinal * cantidad + adicsTotal;
};

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  en_proceso: 'En cocina',
  listo:      'En cocina',
  despachado: 'En camino',
  entregado:  'Entregado',
  anulado:    'Cancelado',
};

const colorEstado = (e) => ({
  pendiente:  { bg: '#fff5f5', color: '#CA0B0B' },
  en_proceso: { bg: '#fefce8', color: '#ca8a04' },
  listo:      { bg: '#fefce8', color: '#ca8a04' },
  despachado: { bg: '#f5f3ff', color: '#7c3aed' },
  entregado:  { bg: '#f0fdf4', color: '#16a34a' },
  anulado:    { bg: '#f5f5f5', color: '#888'    },
}[e] || { bg: '#f5f5f5', color: '#888' });

function SeccionDatos({ usuario }) {
  const { actualizarUsuario } = useAuth();
  const [editando,  setEditando]  = useState(false);
  const [nombre,    setNombre]    = useState(usuario?.nombre    || '');
  const [telefono,  setTelefono]  = useState(usuario?.telefono  || '');
  const [guardado,  setGuardado]  = useState(false);
  const [error,     setError]     = useState('');

  const handleGuardar = async () => {
    setError('');
    if (!nombre.trim() || nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres'); return;
    }
    if (telefono && telefono.trim() !== '') {
      if (!/^3[0-9]{9}$/.test(telefono.trim())) {
        setError('El teléfono debe ser un número colombiano válido de 10 dígitos (ej: 3001234567)'); return;
      }
    }
    try {
      const u = await api.editarPerfil({ nombre: nombre.trim(), telefono: telefono.trim() || undefined });
      actualizarUsuario({ nombre: u.nombre, telefono: u.telefono });
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

      {guardado && <div className="perfil-alerta-ok" style={{display:'flex',alignItems:'center',gap:6}}><Check size={14}/>Datos actualizados correctamente</div>}
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
              <input className="perfil-input" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 3001234567" maxLength={10} />
            </div>
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
  const tiempoEspera = useTiempoEspera();

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
                    <span className="historial-id">#{v.id_venta}</span>
                    <span className="historial-fecha">{fechaFmt}</span>
                  </div>
                  <div className="historial-item-der">
                    <span className="historial-total">${Number(v.total).toLocaleString()}</span>
                    <span className="historial-estado" style={{ background: est.bg, color: est.color }}>{ESTADO_LABELS[estadoNombre] || estadoNombre}</span>
                    {(estadoNombre === 'pendiente' || estadoNombre === 'en_proceso') && (
                      <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>⏱️ ~{tiempoEspera} min</span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"
                      style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>
                {estadoNombre === 'anulado' && (
                  <div style={{ padding: '4px 16px 6px', fontSize: 12, color: '#888' }}>
                    Motivo: {v.motivo_anulacion || 'Sin especificar'}
                  </div>
                )}
                {abierto && (
                  <div className="historial-item-detalle">
                    {/* Dirección */}
                    {v.direccion && (
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 10, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CA0B0B" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>{v.direccion?.direccion_linea || '—'}{v.direccion?.barrio ? `, ${v.direccion.barrio}` : ''}</span>
                      </div>
                    )}
                    {/* Productos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                      {(v.detalleVentas || []).map((d, i) => (
                        <div key={i} style={{ background: '#fafafa', borderRadius: 8, padding: '10px 12px', border: '1px solid #f0f0f0' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{d.cantidad}× {d.producto?.nombre || '—'}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#CA0B0B' }}>${calcularSubtotalDetalle(d).toLocaleString('es-CO')}</span>
                          </div>
                          {d.chocolate && (
                            <span style={{ background: d.chocolate==='Negro' ? '#1e3a5f' : '#f0f0f0', color: d.chocolate==='Negro' ? '#fff' : '#555', fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 600, display: 'inline-block', marginBottom: 4 }}>
                              Chocolate {d.chocolate}
                            </span>
                          )}
                          {parsearSalsas(d.salsas).length > 0 && <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginBottom:4 }}>{parsearSalsas(d.salsas).map((s,si) => <span key={si} style={{ fontSize:10, color:COLOR_SALSAS, background:'#fff7ed', border:`1px solid ${COLOR_SALSAS}`, padding:'1px 7px', borderRadius:20, fontWeight:600 }}>{nombreSalsa(s)}</span>)}</div>}
                          {(d.detalleToppings?.length > 0 || d.detalleAdiciones?.length > 0) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {(d.detalleToppings || []).map((t, ti) => (
                                <span key={ti} style={{ background: '#1a1a1a', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                                  {t.topping?.nombre}{(t.cantidad || 1) > 1 ? ` ×${t.cantidad}` : ''}
                                </span>
                              ))}
                              {(d.detalleAdiciones || []).map((a, ai) => (
                                <span key={ai} style={{ background: '#d97706', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                                  +{a.adicion?.nombre}{(a.cantidad || 1) > 1 ? ` ×${a.cantidad}` : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Totales */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 3 }}>
                        <span>Subtotal</span>
                        <span>${(Number(v.subtotal || v.total) - Number(v.costo_domicilio || 0)).toLocaleString('es-CO')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 6 }}>
                        <span>Domicilio</span>
                        <span>${Number(v.costo_domicilio || 0).toLocaleString('es-CO')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: '#16a34a' }}>
                        <span>Total</span>
                        <span>${Number(v.total || 0).toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                    {/* Método de pago */}
                    {v.metodo_pago && (
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        <span style={{ background: '#f0f0f0', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                          {v.metodo_pago === 'efectivo' ? <><Banknote size={12} style={{marginRight:3}}/>Efectivo</> : v.metodo_pago === 'transferencia' ? <><Smartphone size={12} style={{marginRight:3}}/>Transferencia</> : <><Zap size={12} style={{marginRight:3}}/>Mixto</>}
                        </span>
                      </div>
                    )}
                    {/* Anulado: motivo */}
                    {estadoNombre === 'anulado' && v.motivo_anulacion && (
                      <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#CA0B0B', marginBottom: 8 }}>
                        <strong>Motivo de cancelación:</strong> {v.motivo_anulacion}
                      </div>
                    )}
                    {/* WhatsApp */}
                    <a href="https://wa.me/573159914624" target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#16a34a"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.528 5.845L.057 23.55a.75.75 0 00.906.98l5.919-1.55A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.587-.5-5.084-1.37l-.363-.217-3.762.985.999-3.648-.235-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                      ¿Necesitas ayuda? Escríbenos
                    </a>
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
      {ok    && <div className="perfil-alerta-ok" style={{display:'flex',alignItems:'center',gap:6}}><Check size={14}/>Contraseña actualizada correctamente</div>}
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
  const [direcciones, setDirecciones] = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [agregando,     setAgregando]     = useState(false);
  const [nuevaDireccion, setNuevaDireccion] = useState({ direccion_linea: '', barrio: '', ciudad: '', departamento: '', referencia: '' });
  const [errDir,        setErrDir]        = useState({});
  const [error,         setError]         = useState('');

  useEffect(() => {
    api.misDirecciones()
      .then((data) => setDirecciones((data || []).filter((d) => d.estado !== 0)))
      .catch(() => setDirecciones([]))
      .finally(() => setCargando(false));
  }, []);

  const handleAgregar = async () => {
    const errs = {};
    if (!nuevaDireccion.direccion_linea.trim()) errs.direccion_linea = 'La dirección es requerida';
    if (!nuevaDireccion.barrio.trim())          errs.barrio          = 'El barrio es requerido';
    if (!nuevaDireccion.ciudad.trim())          errs.ciudad          = 'La ciudad es requerida';
    if (Object.keys(errs).length > 0) { setErrDir(errs); return; }
    try {
      const nueva = await api.crearMiDireccion({
        ...nuevaDireccion,
        lat: nuevaDireccion.lat || null,
        lng: nuevaDireccion.lng || null,
      });
      setDirecciones((p) => [...p, nueva]);
      setNuevaDireccion({ direccion_linea: '', barrio: '', ciudad: '', departamento: '', referencia: '' });
      setErrDir({});
      setAgregando(false);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al guardar dirección');
    }
  };

  const handleEliminar = async (id) => {
    try {
      await api.eliminarMiDireccion(id);
      setDirecciones((p) => p.filter((d) => d.id_direccion !== id));
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al eliminar dirección');
    }
  };

  return (
    <div className="perfil-seccion">
      <div className="perfil-sec-header">
        <div>
          <h3 className="perfil-sec-titulo">Mis direcciones</h3>
          <p className="perfil-sec-sub">{direcciones.length} direcciones guardadas</p>
        </div>
        <button className="perfil-btn-editar" onClick={() => { setAgregando(!agregando); setError(''); }}>+ Agregar</button>
      </div>

      {error && <div className="perfil-alerta-err">{error}</div>}

      {agregando && (
        <div className="perfil-form perfil-form-nueva-dir">
          <FormDireccion
            value={nuevaDireccion}
            onChange={(f, v) => {
              if (f === 'costo_domicilio') { /* el FormDireccion ya muestra el costo */ }
              else { setNuevaDireccion((p) => ({ ...p, [f]: v })); setErrDir((p) => ({ ...p, [f]: '' })); }
            }}
            errors={errDir}
            layout="client"
          />
          <div className="perfil-form-botones">
            <button className="perfil-btn-sec" onClick={() => { setAgregando(false); setErrDir({}); }}>Cancelar</button>
            <button className="perfil-btn-pri" onClick={handleAgregar}>Guardar dirección</button>
          </div>
        </div>
      )}

      <div className="direcciones-lista">
        {cargando ? (
          <div className="perfil-vacio"><p>Cargando...</p></div>
        ) : direcciones.length === 0 ? (
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
          <div className="desactivar-aviso-icono"><AlertTriangle size={36} color="#f59e0b"/></div>
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
  const [puntos,        setPuntos]        = useState({ puntos: 0, saldo_pesos: 0, movimientos: [] });
  const navigate        = useNavigate();
  const { usuario }     = useAuth();

  const puedeVerPuntos = ['cliente', 'domiciliario', 'admin'].includes(usuario?.rol);

  useEffect(() => {
    if (!puedeVerPuntos) return;
    api.getMisPuntos().then(setPuntos).catch(() => {});
  }, [puedeVerPuntos]);

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
            <User size={34} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="perfil-hero-nombre">{usuario?.nombre || 'Usuario'}</h1>
            <p className="perfil-hero-email">{usuario?.email || ''}</p>
          </div>
          {/* Card de puntos en lugar del botón "Ver catálogo" */}
          {puedeVerPuntos && (
            <div style={{ background: 'linear-gradient(135deg, #CA0B0B 0%, #8B0000 100%)', borderRadius: 10, padding: '10px 14px', color: 'white', minWidth: 160, flexShrink: 0 }}>
              <div style={{ fontSize: 10, opacity: 0.75, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                Mis puntos ChocoFreseo
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{puntos.puntos}</span>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>pts</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>${(puntos.puntos * 12.5).toLocaleString('es-CO')}</div>
                  <div style={{ fontSize: 10, opacity: 0.65 }}>disponibles · 1pt = $12.50</div>
                </div>
              </div>
            </div>
          )}
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