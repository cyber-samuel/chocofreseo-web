import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar/Navbar';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import * as api from '../../../services/api';
import './Catalogo.css';

const estaAbierto = () => {
  const co = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const h = co.getUTCHours() + co.getUTCMinutes() / 60;
  return h >= 13 && h < 20;
};

/* ─── Modal unificado de producto ─── */
function ModalProducto({ open, onClose, onConfirmar, producto, toppingsDisponibles, adicionesDisponibles }) {
  const [toppings,        setToppings]        = useState([]);
  const [adiciones,       setAdiciones]       = useState([]);
  const [chocolateElegido, setChocolateElegido] = useState('Negro');
  const [observaciones,   setObservaciones]   = useState('');

  if (!open || !producto) return null;

  const maxTop        = producto.max_toppings || 0;
  const totalUnidades = toppings.reduce((s, t) => s + t.cantidad, 0);
  const tieneChocolate = producto.permite_chocolate === true;
  const tieneToppings  = producto.permite_toppings === 1 && toppingsDisponibles.length > 0;

  const agregarTopping = (t) => setToppings((p) => [...p, { ...t, cantidad: 1 }]);
  const ajustarTopping = (id, delta) => setToppings((p) =>
    p.map((t) => t.id_topping === id ? { ...t, cantidad: t.cantidad + delta } : t).filter((t) => t.cantidad > 0)
  );
  const agregarAdicion = (a) => setAdiciones((p) => [...p, { ...a, precio: Number(a.precio), cantidad: 1 }]);
  const ajustarAdicion = (id, delta) => setAdiciones((p) =>
    p.map((a) => a.id_adicion === id ? { ...a, cantidad: a.cantidad + delta } : a).filter((a) => a.cantidad > 0)
  );

  const base          = Number(producto.precio);
  const toppingExtra  = Math.max(0, totalUnidades - maxTop) * 2000;
  const adicionTotal  = adiciones.reduce((s, a) => s + a.precio * a.cantidad, 0);
  const subtotal      = base + toppingExtra + adicionTotal;
  const puedeAgregar  = !tieneChocolate || !!chocolateElegido;

  const cerrar = () => {
    setToppings([]); setAdiciones([]); setChocolateElegido('Negro'); setObservaciones('');
    onClose();
  };

  const confirmar = () => {
    if (!puedeAgregar) return;
    onConfirmar({
      ...producto,
      toppings,
      adiciones,
      subtotal,
      cantidad: 1,
      max_toppings: producto.max_toppings,
      chocolate:    tieneChocolate ? chocolateElegido : null,
      observaciones: observaciones.trim() || null,
    });
    setToppings([]); setAdiciones([]); setChocolateElegido('Negro'); setObservaciones('');
  };

  const secTitulo = { fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 18 };
  const chipB = { background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', fontSize: 15, fontWeight: 800, lineHeight: 1 };

  return (
    <div className="modal-overlay" onClick={cerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '92%', maxWidth: 460,
          maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header: imagen */}
        <div style={{ position: 'relative', height: 200, flexShrink: 0 }}>
          {producto.img
            ? <img src={producto.img} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>🍫</div>
          }
          <button onClick={cerrar} style={{
            position: 'absolute', top: 12, right: 12, background: '#fff', border: 'none',
            borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, fontWeight: 800,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Nombre + precio base */}
        <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>{producto.nombre}</h2>
          {producto.descripcion && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{producto.descripcion}</p>}
          <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: '#CA0B0B' }}>${base.toLocaleString('es-CO')}</p>
        </div>

        {/* Cuerpo scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 12px' }}>

          {/* Chocolate */}
          {tieneChocolate && (
            <>
              <p style={secTitulo}>🍫 Tipo de chocolate</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Negro', 'Blanco'].map((tipo) => (
                  <button key={tipo} onClick={() => setChocolateElegido(tipo)} style={{
                    flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                    border: `2px solid ${chocolateElegido === tipo ? '#CA0B0B' : '#e5e7eb'}`,
                    background: chocolateElegido === tipo ? '#fff5f5' : '#fff',
                    color: chocolateElegido === tipo ? '#CA0B0B' : '#555',
                    fontWeight: chocolateElegido === tipo ? 800 : 500, fontSize: 14,
                  }}>
                    {tipo === 'Negro' ? '🍫' : '⬜'} {tipo}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Toppings */}
          {tieneToppings && (
            <>
              <p style={secTitulo}>
                Toppings
                <span style={{
                  marginLeft: 8, background: totalUnidades > maxTop ? '#fee2e2' : '#f0fdf4',
                  color: totalUnidades > maxTop ? '#CA0B0B' : '#16a34a',
                  padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'none', letterSpacing: 0,
                }}>
                  {totalUnidades === 0
                    ? `${maxTop} gratis`
                    : totalUnidades <= maxTop
                      ? `${totalUnidades}/${maxTop} gratis`
                      : `+${totalUnidades - maxTop} extra (+$${((totalUnidades - maxTop) * 2000).toLocaleString('es-CO')})`
                  }
                </span>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {toppingsDisponibles.map((t) => {
                  const enLista = toppings.find((x) => x.id_topping === t.id_topping);
                  return enLista ? (
                    <div key={t.id_topping} style={{ display: 'flex', alignItems: 'center', background: '#1a1a1a', color: '#fff', borderRadius: 12, padding: '10px 14px', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {t.img && <img src={t.img} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{t.nombre}</div>
                          {t.gramaje && <div style={{ fontSize: 11, color: '#aaa' }}>{t.gramaje}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button style={{ ...chipB, color: '#fff' }} onClick={() => ajustarTopping(t.id_topping, -1)}>−</button>
                        <span style={{ fontWeight: 800, fontSize: 15, minWidth: 22, textAlign: 'center' }}>{enLista.cantidad}</span>
                        <button style={{ ...chipB, color: '#fff' }} onClick={() => ajustarTopping(t.id_topping, 1)}>+</button>
                        <button style={{ ...chipB, color: '#f87171', marginLeft: 4 }} onClick={() => ajustarTopping(t.id_topping, -enLista.cantidad)}>×</button>
                      </div>
                    </div>
                  ) : (
                    <button key={t.id_topping} onClick={() => agregarTopping(t)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12,
                      padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {t.img && <img src={t.img} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />}
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{t.nombre}</div>
                          {t.gramaje && <div style={{ fontSize: 11, color: '#aaa' }}>({t.gramaje})</div>}
                        </div>
                      </div>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>+</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Adiciones */}
          {adicionesDisponibles.length > 0 && (
            <>
              <p style={secTitulo}>Adiciones <span style={{ color: '#bbb', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>— Opcional</span></p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {adicionesDisponibles.map((a) => {
                  const enLista = adiciones.find((x) => x.id_adicion === a.id_adicion);
                  return enLista ? (
                    <div key={a.id_adicion} style={{ display: 'flex', alignItems: 'center', background: '#fffbeb', border: '1.5px solid #d97706', color: '#92400e', borderRadius: 12, padding: '10px 14px', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {a.img && <img src={a.img} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{a.nombre}</div>
                          <div style={{ fontSize: 11, color: '#b45309' }}>
                            {a.gramaje ? `${a.gramaje} · ` : ''}${(a.precio * enLista.cantidad).toLocaleString('es-CO')}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button style={{ ...chipB, color: '#d97706' }} onClick={() => ajustarAdicion(a.id_adicion, -1)}>−</button>
                        <span style={{ fontWeight: 800, fontSize: 15, minWidth: 22, textAlign: 'center', color: '#d97706' }}>{enLista.cantidad}</span>
                        <button style={{ ...chipB, color: '#d97706' }} onClick={() => ajustarAdicion(a.id_adicion, 1)}>+</button>
                        <button style={{ ...chipB, color: '#f87171', marginLeft: 4 }} onClick={() => ajustarAdicion(a.id_adicion, -enLista.cantidad)}>×</button>
                      </div>
                    </div>
                  ) : (
                    <button key={a.id_adicion} onClick={() => agregarAdicion(a)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12,
                      padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {a.img && <img src={a.img} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />}
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{a.nombre}</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>{a.gramaje ? `${a.gramaje} · ` : ''}+${Number(a.precio).toLocaleString('es-CO')}</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#16a34a' }}>+${Number(a.precio).toLocaleString('es-CO')}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Observaciones */}
          <p style={secTitulo}>Nota especial</p>
          <textarea
            rows={2}
            placeholder="¿Alguna nota para este producto? (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        {/* Footer fijo */}
        <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 20px', flexShrink: 0, background: '#fff' }}>
          {/* Desglose de precio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10, fontSize: 12, color: '#888' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Base</span><span>${base.toLocaleString('es-CO')}</span>
            </div>
            {toppingExtra > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CA0B0B' }}>
                <span>Toppings extra ({totalUnidades - maxTop} uds.)</span><span>+${toppingExtra.toLocaleString('es-CO')}</span>
              </div>
            )}
            {adicionTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                <span>Adiciones</span><span>+${adicionTotal.toLocaleString('es-CO')}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#CA0B0B' }}>${subtotal.toLocaleString('es-CO')}</span>
          </div>
          <button onClick={confirmar} disabled={!puedeAgregar} style={{
            width: '100%', padding: '14px', background: puedeAgregar ? '#CA0B0B' : '#e5e7eb',
            color: puedeAgregar ? '#fff' : '#aaa', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 800, cursor: puedeAgregar ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', transition: 'background .15s',
          }}>
            {tieneChocolate && !chocolateElegido ? 'Elige el tipo de chocolate' : '+ Agregar al carrito'}
          </button>
        </div>
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
function CarritoBottom({ carrito, subtotal, totalItems, onCambiarCantidad, onQuitar, onIrCheckout }) {
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
                    <div className="carrito-item-thumb">🍫</div>
                    <div className="carrito-item-info">
                      <span className="carrito-item-nombre">{item.nombre}</span>
                      {item.chocolate && (
                        <span style={{ background: '#1e3a5f', color: '#fff', fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 600, display: 'inline-block', marginTop: 2 }}>
                          🍫 {item.chocolate}
                        </span>
                      )}
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
              <button className="carrito-btn-checkout" onClick={onIrCheckout} disabled={!estaAbierto()}
                title={!estaAbierto() ? 'Podrás hacer tu pedido de 1PM a 8PM' : ''}>
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
              disabled={!estaAbierto()} title={!estaAbierto() ? 'Podrás hacer tu pedido de 1PM a 8PM' : ''}>
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
  const navigate    = useNavigate();

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
