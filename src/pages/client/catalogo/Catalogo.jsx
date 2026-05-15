import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar/Navbar';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { useTiempoEspera } from '../../../hooks/useTiempoEspera';
import { useHorario, calcularAbierto } from '../../../hooks/useHorario';
import * as api from '../../../services/api';
import './Catalogo.css';


/* ─── TAREA 2: Modal con flujo por pasos ─── */
function ModalProducto({ open, onClose, onConfirmar, producto, toppingsDisponibles, adicionesDisponibles }) {
  const [pasoIdx,          setPasoIdx]          = useState(0);
  const [chocolateElegido, setChocolateElegido] = useState('');
  const [toppings,         setToppings]         = useState([]);
  const [adiciones,        setAdiciones]        = useState([]);
  const [observaciones,    setObservaciones]    = useState('');

  if (!open || !producto) return null;

  const tieneChocolate = producto.permite_chocolate === true;
  const tieneToppings  = producto.permite_toppings === 1 && toppingsDisponibles.length > 0;
  const sinToppings    = !tieneToppings; // puede agregar toppings extra a $2000 c/u en paso 3

  // Calcular pasos aplicables
  const pasos = [];
  if (tieneChocolate)  pasos.push('chocolate');
  if (tieneToppings)   pasos.push('toppings');
  pasos.push('adiciones');

  const pasoActual   = pasos[pasoIdx] || 'adiciones';
  const esUltimoPaso = pasoIdx === pasos.length - 1;
  const esPrimerPaso = pasoIdx === 0;

  // Helpers toppings
  const maxTop        = producto.max_toppings || 0;
  const totalUnidades = toppings.reduce((s, t) => s + t.cantidad, 0);
  const incluidos     = Math.min(totalUnidades, maxTop);
  const cobrados      = Math.max(0, totalUnidades - maxTop);

  const agregarTopping = (t) => setToppings((p) => [...p, { ...t, cantidad: 1 }]);
  const ajustarTopping = (id, delta) => setToppings((p) =>
    p.map((t) => t.id_topping === id ? { ...t, cantidad: t.cantidad + delta } : t).filter((t) => t.cantidad > 0)
  );

  // Helpers adiciones
  const agregarAdicion = (a) => setAdiciones((p) => [...p, { ...a, precio: Number(a.precio), cantidad: 1 }]);
  const ajustarAdicion = (id, delta) => setAdiciones((p) =>
    p.map((a) => a.id_adicion === id ? { ...a, cantidad: a.cantidad + delta } : a).filter((a) => a.cantidad > 0)
  );

  // Precio en tiempo real
  const base         = Number(producto.precio);
  const topExtra     = cobrados * 2000 + (sinToppings ? totalUnidades * 2000 : 0);
  const adicionTotal = adiciones.reduce((s, a) => s + a.precio * a.cantidad, 0);
  const total        = base + topExtra + adicionTotal;

  const puedeAvanzar = pasoActual !== 'chocolate' || !!chocolateElegido;

  const cerrar = () => {
    setPasoIdx(0); setChocolateElegido(''); setToppings([]); setAdiciones([]); setObservaciones('');
    onClose();
  };

  const avanzar = () => {
    if (!puedeAvanzar) return;
    if (esUltimoPaso) {
      onConfirmar({
        ...producto,
        toppings,
        adiciones,
        subtotal: total,
        cantidad: 1,
        max_toppings: producto.max_toppings,
        chocolate: tieneChocolate ? chocolateElegido : null,
        observaciones: observaciones.trim() || null,
      });
      setPasoIdx(0); setChocolateElegido(''); setToppings([]); setAdiciones([]); setObservaciones('');
    } else {
      setPasoIdx((i) => i + 1);
    }
  };

  const retroceder = () => {
    if (!esPrimerPaso) setPasoIdx((i) => i - 1);
    else cerrar();
  };

  // ──── Estilos compartidos ────
  const chipB  = { background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', fontSize: 15, fontWeight: 800, lineHeight: 1 };
  const secLbl = { fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, margin: '16px 0 10px' };

  // ──── Renderizado por paso ────

  /* PASO: CHOCOLATE */
  const renderChocolate = () => (
    <>
      {/* Imagen del producto */}
      <div style={{ position: 'relative', height: 220, flexShrink: 0 }}>
        {producto.img
          ? <img src={producto.img} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px 20px 0 0' }} />
          : <div style={{ height: '100%', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, borderRadius: '20px 20px 0 0' }}>🍫</div>
        }
        <button onClick={cerrar} style={{ position: 'absolute', top: 12, right: 12, background: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>{producto.nombre}</h2>
        <p style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 800, color: '#CA0B0B' }}>${base.toLocaleString('es-CO')}</p>
      </div>
      <div style={{ flex: 1, padding: '0 20px 16px', overflowY: 'auto' }}>
        <p style={{ ...secLbl }}>¿Con qué chocolate lo prefieres?</p>
        <div style={{ display: 'flex', gap: 12, margin: '4px 0' }}>
          {['Negro', 'Blanco'].map((tipo) => {
            const sel = chocolateElegido === tipo;
            const img = tipo === 'Negro'
              ? 'https://res.cloudinary.com/dnoxlv5kn/image/upload/v1778815863/chocolate_negro_ancho_kzqpjd.png'
              : 'https://res.cloudinary.com/dnoxlv5kn/image/upload/v1778815900/chocolate_blanco_ancho_rw2b5l.png';
            return (
              <button key={tipo} onClick={() => setChocolateElegido(tipo)} style={{
                flex: 1, height: 155, borderRadius: 16, cursor: 'pointer', padding: 0,
                border: sel ? '2px solid #CA0B0B' : '2px solid transparent',
                position: 'relative', overflow: 'hidden',
                boxShadow: sel ? '0 6px 20px rgba(202,11,11,0.35)' : '0 2px 8px rgba(0,0,0,0.12)',
                transition: 'all 0.2s ease',
              }}>
                <img src={img} alt={`Chocolate ${tipo}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  padding: '30px 12px 10px',
                  color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', textAlign: 'center',
                }}>
                  {tipo}
                  {sel && <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#fca5a5', marginTop: 2 }}>Seleccionado ✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 20px', flexShrink: 0 }}>
        <button onClick={avanzar} disabled={!chocolateElegido} style={{
          width: '100%', padding: 14, background: chocolateElegido ? '#CA0B0B' : '#e5e7eb',
          color: chocolateElegido ? '#fff' : '#aaa', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 800, cursor: chocolateElegido ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
        }}>
          Continuar →
        </button>
      </div>
    </>
  );

  /* PASO: TOPPINGS */
  const renderToppings = () => (
    <>
      <div style={{ padding: '14px 20px 10px', flexShrink: 0, borderBottom: '1px solid #f5f5f5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Elige tus toppings</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, background: '#f9fafb', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#666' }}>
              <span>Los primeros <strong>{maxTop}</strong> son gratis · Extra: <strong>$2.000 c/u</strong></span>
            </div>
          </div>
          <button onClick={cerrar} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        {totalUnidades > 0 && (
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: cobrados > 0 ? '#CA0B0B' : '#16a34a' }}>
            {incluidos > 0 && `✓ ${incluidos} incluido${incluidos > 1 ? 's' : ''} gratis`}
            {cobrados > 0 && ` · +${cobrados} extra = $${(cobrados * 2000).toLocaleString('es-CO')}`}
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {toppingsDisponibles.map((t) => {
            const enLista = toppings.find((x) => x.id_topping === t.id_topping);
            return (
              <div key={t.id_topping} onClick={() => !enLista && agregarTopping(t)} style={{
                borderRadius: 14, cursor: enLista ? 'default' : 'pointer',
                position: 'relative', overflow: 'hidden', height: 120,
                border: `2px solid ${enLista ? '#1a1a1a' : 'transparent'}`,
                boxShadow: enLista ? '0 4px 14px rgba(0,0,0,0.22)' : '0 2px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
              }}>
                {t.img
                  ? <img src={t.img} alt={t.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28, color: '#aaa' }}>{t.nombre.charAt(0).toUpperCase()}</div>
                }
                {/* Overlay nombre */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
                  padding: '22px 8px 8px', textAlign: 'center',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#fff' }}>{t.nombre}</div>
                  {t.gramaje && <div style={{ fontSize: 10, color: '#ddd', marginTop: 1 }}>{t.gramaje}</div>}
                </div>
                {/* Controles cantidad cuando está seleccionado */}
                {enLista && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1a1a1a', borderRadius: 20, padding: '4px 10px' }}>
                      <button style={{ ...chipB, color: '#fff', fontSize: 16 }} onClick={(e) => { e.stopPropagation(); ajustarTopping(t.id_topping, -1); }}>−</button>
                      <span style={{ fontWeight: 800, fontSize: 15, color: '#fff', minWidth: 18, textAlign: 'center' }}>{enLista.cantidad}</span>
                      <button style={{ ...chipB, color: '#fff', fontSize: 16 }} onClick={(e) => { e.stopPropagation(); ajustarTopping(t.id_topping, 1); }}>+</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 20px', flexShrink: 0, display: 'flex', gap: 10 }}>
        <button onClick={retroceder} style={{ flex: 0, padding: '12px 18px', borderRadius: 12, border: '2px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>← Atrás</button>
        <button onClick={avanzar} style={{ flex: 1, padding: 12, background: '#CA0B0B', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Continuar →</button>
      </div>
    </>
  );

  /* PASO: ADICIONES */
  const renderAdiciones = () => (
    <>
      <div style={{ padding: '14px 20px 10px', flexShrink: 0, borderBottom: '1px solid #f5f5f5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
            Adiciones <span style={{ color: '#aaa', fontWeight: 400 }}>— Opcional</span>
          </p>
          <button onClick={cerrar} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {/* Adiciones */}
        {adicionesDisponibles.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {adicionesDisponibles.map((a) => {
                const enLista = adiciones.find((x) => x.id_adicion === a.id_adicion);
                return (
                  <div key={a.id_adicion} onClick={() => !enLista && agregarAdicion(a)} style={{
                    borderRadius: 14, cursor: enLista ? 'default' : 'pointer',
                    position: 'relative', overflow: 'hidden', height: 120,
                    border: `2px solid ${enLista ? '#d97706' : 'transparent'}`,
                    boxShadow: enLista ? '0 4px 14px rgba(217,119,6,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                  }}>
                    {a.img
                      ? <img src={a.img} alt={a.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28, color: '#d97706' }}>{a.nombre.charAt(0).toUpperCase()}</div>
                    }
                    {/* Overlay nombre + precio */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
                      padding: '22px 8px 8px', textAlign: 'center',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#fff' }}>{a.nombre}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginTop: 1 }}>
                        +${Number(a.precio).toLocaleString('es-CO')}
                      </div>
                    </div>
                    {/* Controles cantidad cuando está seleccionado */}
                    {enLista && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#d97706', borderRadius: 20, padding: '4px 10px' }}>
                          <button style={{ ...chipB, color: '#fff', fontSize: 16 }} onClick={(e) => { e.stopPropagation(); ajustarAdicion(a.id_adicion, -1); }}>−</button>
                          <span style={{ fontWeight: 800, fontSize: 15, color: '#fff', minWidth: 18, textAlign: 'center' }}>{enLista.cantidad}</span>
                          <button style={{ ...chipB, color: '#fff', fontSize: 16 }} onClick={(e) => { e.stopPropagation(); ajustarAdicion(a.id_adicion, 1); }}>+</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Toppings extra (solo si el producto NO tiene toppings) */}
        {sinToppings && toppingsDisponibles.length > 0 && (
          <>
            <hr style={{ border: 'none', borderTop: '1px dashed #e5e7eb', margin: '4px 0 12px' }} />
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a', marginBottom: 2, margin: '0 0 2px' }}>Este producto no lleva toppings</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Pero puedes añadir los que desees por un adicional de $2.000 cada uno</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
              {toppingsDisponibles.map((t) => {
                const enLista = toppings.find((x) => x.id_topping === t.id_topping);
                return (
                  <div key={t.id_topping} onClick={() => !enLista && agregarTopping(t)} style={{
                    border: `2px solid ${enLista ? '#1a1a1a' : '#e5e7eb'}`,
                    background: enLista ? '#f5f5f5' : '#fff', borderRadius: 12,
                    padding: '10px', cursor: enLista ? 'default' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textAlign: 'center',
                  }}>
                    {t.img
                      ? <img src={t.img} alt={t.nombre} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                      : <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#aaa' }}>{t.nombre.charAt(0).toUpperCase()}</div>
                    }
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a1a' }}>{t.nombre}</div>
                    {enLista && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#1a1a1a', borderRadius: 20, padding: '2px 7px' }}>
                        <button style={{ ...chipB, color: '#fff', fontSize: 13 }} onClick={(e) => { e.stopPropagation(); ajustarTopping(t.id_topping, -1); }}>−</button>
                        <span style={{ fontWeight: 800, fontSize: 13, color: '#fff', minWidth: 14, textAlign: 'center' }}>{enLista.cantidad}</span>
                        <button style={{ ...chipB, color: '#fff', fontSize: 13 }} onClick={(e) => { e.stopPropagation(); ajustarTopping(t.id_topping, 1); }}>+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {totalUnidades > 0 && (
              <p style={{ fontSize: 12, fontWeight: 700, color: '#CA0B0B', marginBottom: 4 }}>
                {totalUnidades} topping{totalUnidades > 1 ? 's' : ''} extra = +${(totalUnidades * 2000).toLocaleString('es-CO')}
              </p>
            )}
          </>
        )}

      </div>

      {/* Footer con desglose */}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 20px', flexShrink: 0, background: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8, fontSize: 12, color: '#888' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Precio base</span><span>${base.toLocaleString('es-CO')}</span>
          </div>
          {topExtra > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CA0B0B' }}>
              <span>Toppings extra</span><span>+${topExtra.toLocaleString('es-CO')}</span>
            </div>
          )}
          {adicionTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
              <span>Adiciones</span><span>+${adicionTotal.toLocaleString('es-CO')}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>Total</span>
          <span style={{ fontWeight: 900, fontSize: 18, color: '#CA0B0B' }}>${total.toLocaleString('es-CO')}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!esPrimerPaso && (
            <button onClick={retroceder} style={{ flex: 0, padding: '12px 18px', borderRadius: 12, border: '2px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>← Atrás</button>
          )}
          <button onClick={avanzar} style={{ flex: 1, padding: 13, background: '#CA0B0B', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            🛒 Agregar al carrito
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="modal-overlay" onClick={cerrar}>
      <div className="modal-producto-inner" onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, width: '92%', maxWidth: 460,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        {pasoActual === 'chocolate'  && renderChocolate()}
        {pasoActual === 'toppings'   && renderToppings()}
        {pasoActual === 'adiciones'  && renderAdiciones()}
      </div>
    </div>
  );
}

/* ─── Modal login requerido ─── */
function ModalLoginRequerido({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-login-req">
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h3 className="modal-login-titulo">Inicia sesión para continuar</h3>
        <p className="modal-login-desc">Necesitas una cuenta para agregar productos al carrito.</p>
        <div className="modal-login-botones">
          <button className="btn-login-req-sec" onClick={onClose}>Cancelar</button>
          <a href="/login" className="btn-login-req-pri">Iniciar sesión</a>
        </div>
        <p className="modal-login-registro">
          ¿No tienes cuenta? <a href="/registro" className="modal-login-link">Regístrate gratis</a>
        </p>
      </div>
    </div>
  );
}

/* ─── Carrito flotante ─── */
function CarritoBottom({ carrito, subtotal, totalItems, onCambiarCantidad, onQuitar, onIrCheckout, abierto }) {
  const [expandido, setExpandido] = useState(false);

  if (carrito.length === 0) {
    return (
      <div className="carrito-bottom carrito-bottom--vacio">
        <div className="carrito-vacio-msg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span>Tu carrito está vacío — agrega productos para comenzar</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {expandido && <div className="carrito-backdrop" onClick={() => setExpandido(false)} />}
      <div className={`carrito-bottom ${expandido ? 'carrito-bottom--expandido' : ''}`}>
        <div className={`carrito-panel ${expandido ? 'carrito-panel--visible' : ''}`}>
          <div className="carrito-drag-handle" onClick={() => setExpandido(false)}>
            <div className="carrito-drag-pill" />
          </div>
          <div className="carrito-layout">
            <div className="carrito-col-items">
              <h3 className="carrito-col-titulo">Tu pedido</h3>
              <div className="carrito-items-lista">
                {carrito.map((item) => (
                  <div key={item.lineaId} className="carrito-item">
                    <div className="carrito-item-thumb" style={{ overflow: 'hidden', borderRadius: 8, flexShrink: 0 }}>
                      {item.img
                        ? <img src={item.img} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#bbb' }}>{item.nombre.charAt(0)}</div>
                      }
                    </div>
                    <div className="carrito-item-info">
                      <span className="carrito-item-nombre" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                        {item.nombre}
                        {item.chocolate && (
                          <span style={{
                            fontSize: 10, background: item.chocolate === 'Negro' ? '#1e3a5f' : '#f0f0f0',
                            color: item.chocolate === 'Negro' ? '#fff' : '#555',
                            padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                            whiteSpace: 'nowrap', flexShrink: 0,
                          }}>
                            Chocolate {item.chocolate}
                          </span>
                        )}
                      </span>
                      {(item.toppings?.length > 0 || item.adiciones?.length > 0) && (
                        <div className="carrito-item-extras">
                          {item.toppings?.map((t) => (
                            <span key={t.id_topping} style={{ background: '#1a1a1a', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                              {t.nombre}{t.cantidad > 1 ? ` ×${t.cantidad}` : ''}
                            </span>
                          ))}
                          {item.adiciones?.map((a) => (
                            <span key={a.id_adicion} style={{ background: '#d97706', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                              +{a.nombre}{a.cantidad > 1 ? ` ×${a.cantidad}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="carrito-item-precio-unit">
                        ${(item.subtotal / item.cantidad).toLocaleString()} c/u
                      </span>
                    </div>
                    <div className="carrito-controles">
                      <button className="carrito-ctrl-btn" onClick={() => onCambiarCantidad(item.lineaId, item.cantidad - 1)}>−</button>
                      <span className="carrito-ctrl-num">{item.cantidad}</span>
                      <button className="carrito-ctrl-btn" onClick={() => onCambiarCantidad(item.lineaId, item.cantidad + 1)}>+</button>
                    </div>
                    <span className="carrito-item-precio-total">${item.subtotal.toLocaleString()}</span>
                    <button className="carrito-item-quitar" onClick={() => onQuitar(item.lineaId)} title="Quitar">×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="carrito-col-resumen">
              <h3 className="carrito-resumen-titulo">Resumen</h3>
              <div className="carrito-resumen-fila">
                <span>Total productos</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="carrito-resumen-fila">
                <span>Domicilio</span>
                <span className="carrito-domicilio-badge">Por confirmar</span>
              </div>
              <div className="carrito-resumen-divisor" />
              <div className="carrito-resumen-fila carrito-resumen-fila--total">
                <span>Subtotal</span>
                <strong>${subtotal.toLocaleString()}</strong>
              </div>
              <button className="carrito-btn-checkout" onClick={onIrCheckout} disabled={!abierto}
                title={!abierto ? 'Podrás hacer tu pedido en horario de atención' : ''}>
                Hacer pedido
              </button>
              <p className="carrito-resumen-items-count">{totalItems} {totalItems === 1 ? 'ítem' : 'ítems'} en el carrito</p>
            </div>
          </div>
        </div>
        <div className="carrito-barra">
          <div className="carrito-barra-izq" onClick={() => setExpandido((v) => !v)}>
            <div className="carrito-barra-badge">{totalItems}</div>
            <div className="carrito-barra-sep" />
            <span className="carrito-barra-label">Ver pedido</span>
            {!expandido && (
              <div className="carrito-barra-resumen">
                {carrito.slice(0, 2).map((item) => (
                  <span key={item.lineaId} className="carrito-barra-chip">{item.cantidad}× {item.nombre}</span>
                ))}
                {carrito.length > 2 && <span className="carrito-barra-chip carrito-barra-chip--mas">+{carrito.length - 2} más</span>}
              </div>
            )}
            <svg className={`carrito-barra-chevron ${expandido ? 'carrito-barra-chevron--arriba' : ''}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </div>
          <div className="carrito-barra-der">
            <span className="carrito-barra-subtotal">${subtotal.toLocaleString()}</span>
            <button className="carrito-barra-btn-checkout" onClick={(e) => { e.stopPropagation(); onIrCheckout(); }}
              disabled={!abierto} title={!abierto ? 'Podrás hacer tu pedido en horario de atención' : ''}>
              Hacer pedido
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Página principal Catálogo ─── */
export default function Catalogo() {
  const { carrito, agregarItem, quitarItem, cambiarCantidad, subtotal, totalItems } = useCart();
  const { usuario } = useAuth();
  const navigate      = useNavigate();
  const tiempoEspera  = useTiempoEspera();
  const horario       = useHorario();
  const estaAbierto   = () => calcularAbierto(horario);

  useEffect(() => {
    document.title = 'Catálogo | ChocoFreseo - Postres y Chocolates Medellín';
  }, []);

  const [productos,       setProductos]       = useState([]);
  const [categorias,      setCategorias]      = useState([{ id_categoria: 0, nombre: 'Todos' }]);
  const [toppings,        setToppings]        = useState([]);
  const [adiciones,       setAdiciones]       = useState([]);
  const [cargando,        setCargando]        = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState(0);
  const [busqueda,        setBusqueda]        = useState('');
  const [productoActual,  setProductoActual]  = useState(null);
  const [modalProducto,   setModalProducto]   = useState(false);
  const [modalLogin,      setModalLogin]      = useState(false);

  useEffect(() => {
    Promise.all([
      api.catalogoProductos(),
      api.catalogoCategorias(),
      api.catalogoToppings(),
      api.catalogoAdiciones(),
    ]).then(([prods, cats, tops, adics]) => {
      setProductos(prods || []);
      setCategorias([{ id_categoria: 0, nombre: 'Todos' }, ...(cats || [])]);
      setToppings(tops || []);
      setAdiciones(adics || []);
    }).catch(console.error).finally(() => setCargando(false));
  }, []);

  const filtrados = productos.filter((p) => {
    const matchCat  = categoriaActiva === 0 || p.id_categoria === categoriaActiva;
    const matchBusc = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusc;
  });

  const handleAgregar = (producto) => {
    if (!usuario) { setModalLogin(true); return; }
    setProductoActual(producto);
    setModalProducto(true);
  };

  const handleConfirmarProducto = (item) => {
    agregarItem(item);
    setModalProducto(false);
    setProductoActual(null);
  };

  return (
    <div className="catalogo-wrapper">
      <Navbar />
      <div className="catalogo-page">
        {!estaAbierto() && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🕐</span>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>Estamos cerrados por el momento</div>
              <div style={{ color: '#b45309', fontSize: 12 }}>Nuestro horario es lunes a domingo de 1:00 PM a 8:00 PM</div>
            </div>
          </div>
        )}
        {estaAbierto() && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#166534' }}>
            <span style={{ fontSize: 16 }}>⏱️</span>
            <span><strong>Tiempo estimado de entrega:</strong> ~{tiempoEspera} minutos</span>
          </div>
        )}
        <div className="catalogo-top">
          <div className="catalogo-categorias">
            {categorias.map((cat) => (
              <button
                key={cat.id_categoria ?? cat.id}
                className={`cat-pill ${categoriaActiva === (cat.id_categoria ?? cat.id) ? 'activo' : ''}`}
                onClick={() => setCategoriaActiva(cat.id_categoria ?? cat.id)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
          <div className="catalogo-buscador">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </div>

        {cargando ? (
          <div className="catalogo-vacio"><p>Cargando productos...</p></div>
        ) : filtrados.length === 0 ? (
          <div className="catalogo-vacio">
            <span style={{ fontSize: 40 }}>🔍</span>
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div className="productos-grid">
            {filtrados.map((p) => (
              <div key={p.id_producto} className="producto-card">
                <div className="producto-card-img">
                  {p.img
                    ? <img src={p.img} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span className="producto-card-emoji">🍫</span>
                  }
                </div>
                <div className="producto-card-body">
                  <h3 className="producto-card-nombre">{p.nombre}</h3>
                  <p className="producto-card-desc">{p.descripcion}</p>
                  <div className="producto-card-footer">
                    <span className="producto-card-precio">${Number(p.precio).toLocaleString()}</span>
                    <button className="producto-card-btn" onClick={() => handleAgregar(p)}>+ Agregar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CarritoBottom
        carrito={carrito}
        subtotal={subtotal}
        totalItems={totalItems}
        onCambiarCantidad={cambiarCantidad}
        onQuitar={quitarItem}
        onIrCheckout={() => navigate('/checkout')}
        abierto={estaAbierto()}
      />

      <ModalProducto
        open={modalProducto}
        onClose={() => { setModalProducto(false); setProductoActual(null); }}
        onConfirmar={handleConfirmarProducto}
        producto={productoActual}
        toppingsDisponibles={toppings}
        adicionesDisponibles={adiciones}
      />
      <ModalLoginRequerido open={modalLogin} onClose={() => setModalLogin(false)} />
    </div>
  );
}
