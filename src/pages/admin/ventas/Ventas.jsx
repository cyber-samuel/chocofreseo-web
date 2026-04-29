import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import * as api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import FormDireccion from '../../../components/common/FormDireccion';
import './Ventas.css';

const POR_PAGINA = 5;

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  en_proceso: 'Confirmado',
  listo:      'Listo para despachar',
  despachado: 'Despachado',
  entregado:  'Entregado',
  anulado:    'Anulado',
};
const ESTADOS = Object.keys(ESTADO_LABELS);

const getMetodoPago = (v) => {
  const detalles = v.pagos?.[0]?.detallePagos || [];
  if (detalles.length > 1) return 'mixto';
  return detalles[0]?.metodoPago?.nombre || v.metodo_pago || null;
};

const getMontoPorMetodo = (v, nombreMetodo) => {
  const detalles = v.pagos?.[0]?.detallePagos || [];
  const found = detalles.find((d) => d.metodoPago?.nombre === nombreMetodo);
  if (found) return Number(found.monto || 0);
  if (nombreMetodo === 'efectivo') return Number(v.monto_efectivo || 0);
  if (nombreMetodo === 'transferencia') return Number(v.monto_transferencia || 0);
  return 0;
};

const mapVenta = (v) => ({
  ...v,
  cliente:          v.cliente?.usuario?.nombre || v.cliente?.nombre || '—',
  telefono_cliente: v.cliente?.telefono || '—',
  estado:           v.estado?.nombre_estado    || v.estado          || 'pendiente',
  direccion:        v.direccion?.direccion_linea || v.direccion     || '—',
  barrio:           v.direccion?.barrio  || '',
  ciudad:           v.direccion?.ciudad  || '',
  fecha:            v.fecha ? new Date(v.fecha).toLocaleString('es-CO') : '—',
  metodo_pago:      getMetodoPago(v),
  monto_efectivo:   getMontoPorMetodo(v, 'efectivo'),
  monto_transferencia: getMontoPorMetodo(v, 'transferencia'),
  comprobante_url:  v.comprobante_url || v.pagos?.[0]?.comprobante_url || null,
});

const colorEstado = (e) => ({
  pendiente:  { bg: '#fff5f5', color: '#CA0B0B' },
  en_proceso: { bg: '#eff6ff', color: '#3b82f6' },
  listo:      { bg: '#fefce8', color: '#ca8a04' },
  despachado: { bg: '#f5f3ff', color: '#7c3aed' },
  entregado:  { bg: '#f0fdf4', color: '#16a34a' },
  anulado:    { bg: '#f5f5f5', color: '#888'    },
}[e] || { bg: '#fff5f5', color: '#CA0B0B' });

const METODO_BADGE = {
  efectivo:      { bg: '#f0fdf4', color: '#16a34a', label: '💵 Efectivo' },
  transferencia: { bg: '#eff6ff', color: '#3b82f6', label: '📱 Transferencia' },
  mixto:         { bg: '#f5f3ff', color: '#7c3aed', label: '⚡ Mixto' },
};

function ModalCrearVenta({ open, onClose, onGuardar, clientesData = [], productosData = [], toppingsData = [], adicionesData = [], categoriasData = [] }) {
  const [paso,               setPaso]               = useState(1);
  const [cliente,            setCliente]            = useState(null);
  const [busquedaCliente,    setBusquedaCliente]    = useState('');
  const [dropdownVisible,    setDropdownVisible]    = useState(false);
  const [direccion,          setDireccion]          = useState(null);
  const [modoDir,            setModoDir]            = useState('guardada');
  const [nuevaDireccion,     setNuevaDireccion]     = useState({ direccion_linea: '', barrio: '', ciudad: '', departamento: '', referencia: '' });
  const [carrito,            setCarrito]            = useState([]);
  const [direccionesCliente, setDireccionesCliente] = useState([]);
  const [filtroCategoria,    setFiltroCategoria]    = useState('');
  const [busquedaProd,       setBusquedaProd]       = useState('');
  const [costoEnvio,         setCostoEnvio]         = useState(3000);
  const [metodoPago,         setMetodoPago]         = useState('efectivo');
  const [pagoEfectivo,       setPagoEfectivo]       = useState('');
  const [pagoTransfer,       setPagoTransfer]       = useState('');
  const [observaciones,      setObservaciones]      = useState('');

  if (!open) return null;

  const subtotal     = carrito.reduce((a, i) => a + Number(i.precio) * i.cantidad + i.adiciones.reduce((x, ad) => x + Number(ad.precio), 0) * i.cantidad, 0);
  const total        = subtotal + Number(costoEnvio || 0);
  const totalPagado  = (Number(pagoEfectivo) || 0) + (Number(pagoTransfer) || 0);
  const pagoCompleto = metodoPago === 'efectivo' || metodoPago === 'transferencia' || Math.abs(totalPagado - total) < 1;

  const clientesFiltrados = busquedaCliente.length >= 2
    ? clientesData.filter((c) =>
        (c.nombre || '').toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        (c.email  || '').toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        (c.telefono || '').includes(busquedaCliente)
      ).slice(0, 8)
    : [];

  const seleccionarCliente = (c) => {
    setCliente(c); setBusquedaCliente(c.nombre || ''); setDropdownVisible(false);
    setDireccion(null); setDireccionesCliente([]);
    api.listarDireccionesCliente(c.id_cliente)
      .then((dirs) => {
        const activas = (dirs || []).filter((d) => d.estado !== 0);
        setDireccionesCliente(activas);
        if (activas.length > 0) { setModoDir('guardada'); setDireccion(activas[0]); }
        else setModoDir('nueva');
      })
      .catch(() => setDireccionesCliente([]));
  };

  const categoriasActivas  = categoriasData.filter((c) => c.estado === 1);
  const productosActivos   = productosData.filter((p) => p.estado === 1);
  const toppingsActivos    = toppingsData.filter((t) => t.estado === 1);
  const adicionesActivas   = adicionesData.filter((a) => a.estado === 1);

  const productosFiltrados = productosActivos.filter((p) => {
    if (busquedaProd) return p.nombre.toLowerCase().includes(busquedaProd.toLowerCase());
    return !filtroCategoria || p.id_categoria === Number(filtroCategoria);
  });

  const mostrarProductos = filtroCategoria !== '' || busquedaProd.trim().length > 0;

  const agregarProducto = (prod) => {
    if (carrito.find((c) => c.id_producto === prod.id_producto)) return;
    setCarrito((p) => [...p, { ...prod, precio: Number(prod.precio), cantidad: 1, toppings: [], adiciones: [] }]);
    setBusquedaProd('');
  };

  const quitarProducto = (id) => setCarrito((p) => p.filter((c) => c.id_producto !== id));

  const cambiarCantidad = (id, cant) => {
    if (cant < 1) return;
    setCarrito((p) => p.map((c) => c.id_producto === id ? { ...c, cantidad: cant } : c));
  };

  const toggleTopping = (id_prod, topping) => {
    setCarrito((p) => p.map((c) => {
      if (c.id_producto !== id_prod) return c;
      const existe = c.toppings.find((t) => t.id_topping === topping.id_topping);
      const nuevos = existe
        ? c.toppings.filter((t) => t.id_topping !== topping.id_topping)
        : c.toppings.length >= (c.max_toppings || 99) ? c.toppings : [...c.toppings, topping];
      return { ...c, toppings: nuevos };
    }));
  };

  const toggleAdicion = (id_prod, adicion) => {
    setCarrito((p) => p.map((c) => {
      if (c.id_producto !== id_prod) return c;
      const existe = c.adiciones.find((a) => a.id_adicion === adicion.id_adicion);
      const nuevas = existe ? c.adiciones.filter((a) => a.id_adicion !== adicion.id_adicion) : [...c.adiciones, { ...adicion, precio: Number(adicion.precio) }];
      return { ...c, adiciones: nuevas };
    }));
  };

  const getSubtotalItem = (item) => (Number(item.precio) + item.adiciones.reduce((a, x) => a + Number(x.precio), 0)) * item.cantidad;

  const cambiarMetodoPago = (m) => {
    setMetodoPago(m);
    if (m === 'efectivo')      { setPagoEfectivo(String(total)); setPagoTransfer(''); }
    if (m === 'transferencia') { setPagoTransfer(String(total)); setPagoEfectivo(''); }
    if (m === 'mixto')         { setPagoEfectivo(''); setPagoTransfer(''); }
  };

  const handleEfMixto = (v) => { setPagoEfectivo(v); const ef = Number(v)||0; if (ef<=total) setPagoTransfer(String(total-ef)); };
  const handleTrMixto = (v) => { setPagoTransfer(v); const tr = Number(v)||0; if (tr<=total) setPagoEfectivo(String(total-tr)); };

  const reset = () => {
    setPaso(1); setCliente(null); setBusquedaCliente(''); setDropdownVisible(false);
    setDireccion(null); setModoDir('guardada'); setNuevaDireccion({ direccion_linea: '', barrio: '', ciudad: '', departamento: '', referencia: '' });
    setCarrito([]); setDireccionesCliente([]); setFiltroCategoria(''); setBusquedaProd(''); setCostoEnvio(3000);
    setMetodoPago('efectivo'); setPagoEfectivo(''); setPagoTransfer(''); setObservaciones('');
  };

  const guardar = () => {
    const dirFinal = modoDir === 'nueva' ? { ...nuevaDireccion, esNueva: true } : direccion;
    const carritoConSubtotales = carrito.map((item) => ({ ...item, subtotal: getSubtotalItem(item) }));
    onGuardar({ cliente, direccion: dirFinal, carrito: carritoConSubtotales, metodoPago, pagoEfectivo, pagoTransfer, observaciones, total, subtotal, costodomicilio: Number(costoEnvio || 0) });
    reset(); onClose();
  };

  const sty = {
    input:  { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    label:  { fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4, display: 'block' },
    sec:    { fontWeight: 700, fontSize: 13, color: '#1a1a1a', marginBottom: 8, marginTop: 16 },
    btn:    (act) => ({ flex: 1, padding: '11px 8px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 700, border: act ? 'none' : '1.5px solid #1a1a1a', background: act ? '#CA0B0B' : '#fff', color: act ? '#fff' : '#1a1a1a', fontFamily: 'inherit' }),
  };

  return (
    <div className="modal-overlay">
      <div className="modal-caja" style={{ width: 700, maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-encabezado">
          <span className="modal-titulo">Nueva venta <span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>— Paso {paso} de 3</span></span>
          <button className="modal-cerrar" onClick={() => { reset(); onClose(); }}>✕</button>
        </div>

        <div className="pasos-wrap">
          {['Cliente & Dirección', 'Productos', 'Pago'].map((p, i) => (
            <div key={p} className={`paso-item ${paso === i+1 ? 'activo' : ''} ${paso > i+1 ? 'completado' : ''}`}>
              <div className="paso-circulo">{paso > i+1 ? '✓' : i+1}</div>
              <span className="paso-label">{p}</span>
              {i < 2 && <div className="paso-linea" />}
            </div>
          ))}
        </div>

        {/* ── PASO 1: Cliente & Dirección ── */}
        {paso === 1 && (
          <div>
            <p style={sty.sec}>Buscar cliente</p>
            <div style={{ position: 'relative' }}>
              <input
                style={sty.input}
                placeholder="Buscar por nombre, email o teléfono..."
                value={busquedaCliente}
                onChange={(e) => { setBusquedaCliente(e.target.value); setDropdownVisible(true); if (!e.target.value) { setCliente(null); setDireccion(null); } }}
                onFocus={() => setDropdownVisible(true)}
              />
              {dropdownVisible && clientesFiltrados.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 240, overflowY: 'auto' }}>
                  {clientesFiltrados.map((c) => (
                    <div key={c.id_cliente} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f5f5f5' }} onMouseDown={() => seleccionarCliente(c)}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#CA0B0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                        {(c.nombre || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{c.nombre}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{c.email} · {c.telefono}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cliente && (
              <div style={{ marginTop: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                  {(cliente.nombre || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{cliente.nombre}</div>
                  <div style={{ fontSize: 12, color: '#555' }}>{cliente.email} · {cliente.telefono}</div>
                </div>
              </div>
            )}

            {cliente && (
              <>
                <p style={{ ...sty.sec, marginTop: 20 }}>Dirección de entrega</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {direccionesCliente.length > 0 && (
                    <button type="button" style={sty.btn(modoDir === 'guardada')} onClick={() => setModoDir('guardada')}>Guardada</button>
                  )}
                  <button type="button" style={sty.btn(modoDir === 'nueva')} onClick={() => { setModoDir('nueva'); setDireccion(null); }}>Ingresar manualmente</button>
                </div>

                {modoDir === 'guardada' && direccionesCliente.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {direccionesCliente.map((d) => (
                      <button key={d.id_direccion} type="button" onClick={() => setDireccion(d)}
                        style={{ textAlign: 'left', padding: '10px 14px', border: `2px solid ${direccion?.id_direccion === d.id_direccion ? '#CA0B0B' : '#e5e7eb'}`, borderRadius: 10, background: direccion?.id_direccion === d.id_direccion ? '#fff5f5' : '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{d.direccion_linea}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{d.barrio}{d.ciudad ? `, ${d.ciudad}` : ''}</div>
                      </button>
                    ))}
                  </div>
                )}

                {modoDir === 'nueva' && (
                  <div style={{ marginTop: 4 }}>
                    <FormDireccion
                      value={nuevaDireccion}
                      onChange={(field, value) => setNuevaDireccion((p) => ({ ...p, [field]: value }))}
                    />
                  </div>
                )}
              </>
            )}

            <div className="modal-pie" style={{ marginTop: 20 }}>
              <button className="btn-secundario" onClick={() => { reset(); onClose(); }}>Cancelar</button>
              <button className="btn-primario" onClick={() => setPaso(2)}
                disabled={!cliente || (modoDir === 'guardada' && !direccion) || (modoDir === 'nueva' && !nuevaDireccion.direccion_linea.trim())}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 2: Productos ── */}
        {paso === 2 && (
          <div>
            <p style={sty.sec}>Filtrar por categoría</p>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value ? Number(e.target.value) : '')}
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#f7f8fd', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}
            >
              <option value="">Seleccionar categoría...</option>
              {categoriasActivas.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
              ))}
            </select>

            {/* Buscador de producto */}
            <input
              style={{ ...sty.input, marginBottom: 10 }}
              placeholder="Buscar producto por nombre..."
              value={busquedaProd}
              onChange={(e) => setBusquedaProd(e.target.value)}
            />

            {/* Grid 2 columnas — solo si hay categoría o búsqueda */}
            {!mostrarProductos ? (
              <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 20px', fontSize: 14 }}>
                Selecciona una categoría o escribe el nombre de un producto
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
                {productosFiltrados.map((p) => {
                  const enCarrito = carrito.find((c) => c.id_producto === p.id_producto);
                  return (
                    <div key={p.id_producto} style={{
                      border: `2px solid ${enCarrito ? '#CA0B0B' : '#e5e7eb'}`,
                      borderRadius: 10, padding: '10px 12px', background: enCarrito ? '#fff5f5' : '#fff',
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    }} onClick={() => enCarrito ? quitarProducto(p.id_producto) : agregarProducto(p)}>
                      {p.img ? (
                        <img src={p.img} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#aaa', flexShrink: 0 }}>
                          {(p.nombre || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>${Number(p.precio).toLocaleString('es-CO')}</div>
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: enCarrito ? '#CA0B0B' : '#f0f0f0', color: enCarrito ? '#fff' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                        {enCarrito ? '✓' : '+'}
                      </div>
                    </div>
                  );
                })}
                {productosFiltrados.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888', fontSize: 13, padding: '20px 0' }}>No hay productos</div>
                )}
              </div>
            )}

            {carrito.length > 0 && (
              <div className="carrito-lista" style={{ marginTop: 12 }}>
                <p style={{ ...sty.sec, marginTop: 0 }}>Pedido ({carrito.length} productos)</p>
                {carrito.map((item) => {
                  const precioUnitario = Number(item.precio) + item.adiciones.reduce((a, x) => a + Number(x.precio), 0);
                  const subtotalItem   = precioUnitario * item.cantidad;
                  return (
                    <div key={item.id_producto} className="carrito-item">
                      <div className="carrito-item-header">
                        <span className="carrito-item-nombre">{item.nombre}</span>
                        <div className="carrito-item-controles">
                          <button className="btn-cantidad" onClick={() => cambiarCantidad(item.id_producto, item.cantidad - 1)}>−</button>
                          <span className="carrito-cantidad">{item.cantidad}</span>
                          <button className="btn-cantidad" onClick={() => cambiarCantidad(item.id_producto, item.cantidad + 1)}>+</button>
                          <button className="btn-accion eliminar" style={{ marginLeft: 6 }} onClick={() => quitarProducto(item.id_producto)}>
                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                        ${Number(item.precio).toLocaleString('es-CO')} c/u
                        {item.adiciones.length > 0 && ` + adiciones`}
                        {' → '}
                        <strong style={{ color: '#16a34a' }}>${subtotalItem.toLocaleString('es-CO')}</strong>
                      </div>
                      {item.permite_toppings === 1 && toppingsActivos.length > 0 && (
                        <div className="carrito-extras">
                          <span className="extras-titulo">Toppings (máx. {item.max_toppings || '∞'})</span>
                          <div className="extras-chips">
                            {toppingsActivos.map((t) => (
                              <button key={t.id_topping} className={`chip ${item.toppings.find((x) => x.id_topping === t.id_topping) ? 'activo' : ''}`} onClick={() => toggleTopping(item.id_producto, t)}>{t.nombre}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {adicionesActivas.length > 0 && (
                        <div className="carrito-extras">
                          <span className="extras-titulo">Adiciones</span>
                          <div className="extras-chips">
                            {adicionesActivas.map((a) => (
                              <button key={a.id_adicion} className={`chip ${item.adiciones.find((x) => x.id_adicion === a.id_adicion) ? 'activo' : ''}`} onClick={() => toggleAdicion(item.id_producto, a)}>
                                {a.nombre} +${Number(a.precio).toLocaleString('es-CO')}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0', padding: '10px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>Costo domicilio $</label>
                  <input type="number" value={costoEnvio} onChange={(e) => setCostoEnvio(Number(e.target.value) || 0)}
                    style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: 'inherit' }} />
                </div>

                <div className="carrito-resumen">
                  <div className="carrito-resumen-fila"><span>Subtotal productos</span><span>${subtotal.toLocaleString('es-CO')}</span></div>
                  <div className="carrito-resumen-fila"><span>Costo domicilio</span><span>${Number(costoEnvio||0).toLocaleString('es-CO')}</span></div>
                  <div className="carrito-resumen-fila total"><span>Total</span><span>${total.toLocaleString('es-CO')}</span></div>
                </div>
              </div>
            )}

            <div className="modal-pie" style={{ marginTop: 16 }}>
              <button className="btn-secundario" onClick={() => setPaso(1)}>← Atrás</button>
              <button className="btn-primario" onClick={() => { cambiarMetodoPago('efectivo'); setPaso(3); }} disabled={carrito.length === 0}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Pago ── */}
        {paso === 3 && (
          <div>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', border: '1px solid #f0f0f0', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#1a1a1a' }}>Resumen del pedido</div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
                <strong>{cliente?.nombre}</strong> · {direccion?.direccion_linea || nuevaDireccion?.direccion_linea}
              </div>
              {carrito.map((item) => {
                const subtotalItem = (Number(item.precio) + item.adiciones.reduce((a, x) => a + Number(x.precio), 0)) * item.cantidad;
                return (
                  <div key={item.id_producto} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', padding: '2px 0' }}>
                    <span>{item.cantidad}× {item.nombre}</span>
                    <span>${subtotalItem.toLocaleString('es-CO')}</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: '#16a34a', marginTop: 6, borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>
                <span>Total a cobrar</span>
                <span>${total.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <p style={sty.sec}>Método de pago</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { id: 'efectivo',      label: '💵 Efectivo'              },
                { id: 'transferencia', label: '📱 Transferencia'          },
                { id: 'mixto',         label: '⚡ Efectivo + Transferencia' },
              ].map((m) => (
                <button key={m.id} type="button" style={sty.btn(metodoPago === m.id)} onClick={() => cambiarMetodoPago(m.id)}>{m.label}</button>
              ))}
            </div>

            {metodoPago === 'efectivo' && (
              <div>
                <label style={sty.label}>Efectivo recibido</label>
                <div className="input-precio-wrap">
                  <span className="input-precio-simbolo">$</span>
                  <input className="form-input input-precio" type="number" value={total} readOnly style={{ background: '#f9fafb', cursor: 'not-allowed' }} />
                </div>
              </div>
            )}

            {metodoPago === 'transferencia' && (
              <div>
                <label style={sty.label}>Monto transferencia</label>
                <div className="input-precio-wrap">
                  <span className="input-precio-simbolo">$</span>
                  <input className="form-input input-precio" type="number" value={total} readOnly style={{ background: '#f9fafb', cursor: 'not-allowed' }} />
                </div>
              </div>
            )}

            {metodoPago === 'mixto' && (
              <>
                <div className="form-fila">
                  <div className="form-grupo">
                    <label style={sty.label}>Efectivo</label>
                    <div className="input-precio-wrap">
                      <span className="input-precio-simbolo">$</span>
                      <input className="form-input input-precio" type="number" placeholder="0" value={pagoEfectivo} onChange={(e) => handleEfMixto(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-grupo">
                    <label style={sty.label}>Transferencia</label>
                    <div className="input-precio-wrap">
                      <span className="input-precio-simbolo">$</span>
                      <input className="form-input input-precio" type="number" placeholder="0" value={pagoTransfer} onChange={(e) => handleTrMixto(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: pagoCompleto ? '#f0fdf4' : '#fff5f5', border: `1px solid ${pagoCompleto ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                  <span>{pagoCompleto ? '✓ Pago completo' : 'Falta'}</span>
                  <span style={{ color: pagoCompleto ? '#16a34a' : '#CA0B0B' }}>
                    {pagoCompleto ? `$${total.toLocaleString('es-CO')}` : `$${(total - totalPagado).toLocaleString('es-CO')}`}
                  </span>
                </div>
              </>
            )}

            <div className="form-grupo" style={{ marginTop: 14 }}>
              <label style={sty.label}>Observaciones (opcional)</label>
              <textarea className="form-input" rows={2} placeholder="Instrucciones especiales..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ resize: 'none' }} />
            </div>

            <div className="modal-pie" style={{ marginTop: 16 }}>
              <button className="btn-secundario" onClick={() => setPaso(2)}>← Atrás</button>
              <button className="btn-primario" onClick={guardar} disabled={!pagoCompleto}>✓ Crear venta</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalDetalle({ open, onClose, venta }) {
  const [lightbox, setLightbox] = useState(false);
  if (!open || !venta) return null;
  const est      = colorEstado(venta.estado);
  const metBadge = venta.metodo_pago ? (METODO_BADGE[venta.metodo_pago] || { bg: '#f5f5f5', color: '#888', label: venta.metodo_pago }) : null;
  const subtotalProductos = (venta.detalleVentas || []).reduce((a, d) => a + Number(d.subtotal || 0), 0);

  return (
    <>
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={venta.comprobante_url} alt="Comprobante" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
      <div className="modal-overlay">
        <div className="modal-caja" style={{ width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="modal-encabezado">
            <span className="modal-titulo">Detalle — #{venta.id_venta}</span>
            <button className="modal-cerrar" onClick={onClose}>✕</button>
          </div>

          <div className="detalle-grid">
            <div className="detalle-item">
              <span className="detalle-label">Estado</span>
              <span className="detalle-badge" style={{ background: est.bg, color: est.color }}>{ESTADO_LABELS[venta.estado] || venta.estado}</span>
            </div>
            <div className="detalle-item">
              <span className="detalle-label">Fecha</span>
              <span className="detalle-valor">{venta.fecha}</span>
            </div>
            <div className="detalle-item">
              <span className="detalle-label">Cliente</span>
              <span className="detalle-valor">{venta.cliente}</span>
            </div>
            <div className="detalle-item">
              <span className="detalle-label">Teléfono</span>
              <span className="detalle-valor">{venta.telefono_cliente}</span>
            </div>
            {venta.barrio && <div className="detalle-item"><span className="detalle-label">Barrio</span><span className="detalle-valor">{venta.barrio}</span></div>}
            {venta.ciudad && <div className="detalle-item"><span className="detalle-label">Ciudad</span><span className="detalle-valor">{venta.ciudad}</span></div>}
            <div className="detalle-item detalle-full">
              <span className="detalle-label">Dirección</span>
              <span className="detalle-valor">{venta.direccion}</span>
            </div>
            {venta.observaciones && (
              <div className="detalle-item detalle-full">
                <span className="detalle-label">Observaciones</span>
                <span className="detalle-valor" style={{ fontStyle: 'italic', color: '#666' }}>{venta.observaciones}</span>
              </div>
            )}
          </div>

          {(venta.detalleVentas || []).length > 0 && (
            <>
              <p className="detalle-label" style={{ padding: '10px 0 6px', fontWeight: 700, color: '#333' }}>Productos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                {venta.detalleVentas.map((d, i) => (
                  <div key={i} style={{ background: '#fafafa', borderRadius: 8, padding: '10px 12px', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{d.cantidad}× {d.producto?.nombre || '—'}</span>
                      <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 13 }}>${Number(d.subtotal).toLocaleString('es-CO')}</span>
                    </div>
                    {d.detalleToppings?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                        {d.detalleToppings.map((t) => (
                          <span key={t.id_detalle_topping} style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                            {t.topping?.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                    {d.detalleAdiciones?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {d.detalleAdiciones.map((a) => (
                          <span key={a.id_detalle_adicion} style={{ background: '#f0fdf4', color: '#166534', fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                            +{a.adicion?.nombre} ×{a.cantidad}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginBottom: 6 }}>
              <span>Subtotal productos</span><span>${subtotalProductos.toLocaleString('es-CO')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginBottom: 8 }}>
              <span>Costo domicilio</span><span>${Number(venta.costo_domicilio || 0).toLocaleString('es-CO')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#16a34a', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
              <span>Total</span><span>${Number(venta.total || 0).toLocaleString('es-CO')}</span>
            </div>
            {metBadge && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 13, color: '#888' }}>Método de pago</span>
                <span style={{ background: metBadge.bg, color: metBadge.color, fontWeight: 700, fontSize: 12, padding: '3px 12px', borderRadius: 20 }}>{metBadge.label}</span>
              </div>
            )}
            {venta.metodo_pago === 'mixto' && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#f5f3ff', borderRadius: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#555' }}>💵 Efectivo</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>${Number(venta.monto_efectivo || 0).toLocaleString('es-CO')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555' }}>📱 Transferencia</span>
                  <span style={{ fontWeight: 700, color: '#3b82f6' }}>${Number(venta.monto_transferencia || 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
            )}
            {venta.comprobante_url && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 600 }}>Comprobante de pago</p>
                <img
                  src={venta.comprobante_url}
                  alt="Comprobante"
                  onClick={() => setLightbox(true)}
                  style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'zoom-in', display: 'block' }}
                />
              </div>
            )}
          </div>

          <div className="modal-pie" style={{ marginTop: 16 }}>
            <button className="btn-primario" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </>
  );
}

const ESTADOS_ADMIN = ['pendiente', 'en_proceso', 'listo', 'anulado'];
const ESTADO_LABELS_ADMIN = {
  pendiente:  'Pendiente',
  en_proceso: 'En cocina',
  listo:      'Listo para despachar',
  anulado:    'Anular pedido',
};

function ModalEstado({ open, onClose, onGuardar, venta }) {
  const opciones = ESTADOS_ADMIN.filter((e) => e !== venta?.estado);
  const [estado,          setEstado]         = useState(opciones[0] || '');
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  if (!open || !venta) return null;
  const puedeGuardar = estado !== 'anulado' || motivoAnulacion.trim().length > 0;
  return (
    <div className="modal-overlay">
      <div className="modal-caja modal-pequeno">
        <div className="modal-encabezado">
          <span className="modal-titulo">Cambiar estado</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>
        <select className="form-input" value={estado} onChange={(e) => { setEstado(e.target.value); setMotivoAnulacion(''); }}>
          {opciones.map((e) => <option key={e} value={e}>{ESTADO_LABELS_ADMIN[e] || ESTADO_LABELS[e]}</option>)}
        </select>
        {estado === 'anulado' && (
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#CA0B0B', display: 'block', marginBottom: 6 }}>
              Motivo de anulación (requerido)
            </label>
            <textarea
              rows={3}
              className="form-input"
              placeholder="Escribe el motivo de la anulación..."
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              style={{ resize: 'none', borderColor: '#fca5a5' }}
            />
          </div>
        )}
        <div className="modal-pie" style={{ marginTop: 16 }}>
          <button className="btn-secundario" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primario"
            disabled={!puedeGuardar}
            onClick={() => onGuardar({ estado, motivo: motivoAnulacion.trim() })}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalDevolver({ open, onClose, onConfirmar, venta }) {
  if (!open || !venta) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-caja modal-pequeno">
        <div className="modal-icono-grande">↩</div>
        <p className="modal-texto-confirmar">
          ¿Devolver la venta <strong>#V-{String(venta.id_venta).padStart(4,'0')}</strong> al domiciliario para facturar de nuevo?
        </p>
        <div className="modal-pie centrado" style={{ marginTop: 16 }}>
          <button className="btn-secundario" onClick={onClose}>Cancelar</button>
          <button onClick={onConfirmar} style={{ background: '#fef3c7', color: '#ca8a04', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>Sí, devolver</button>
        </div>
      </div>
    </div>
  );
}

function ModalAnular({ open, onClose, onConfirmar, venta }) {
  const [motivo, setMotivo] = useState('');
  if (!open || !venta) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-caja modal-pequeno">
        <div className="modal-icono-grande">⚠️</div>
        <p className="modal-texto-confirmar">¿Anular la venta <strong>#V-{String(venta.id_venta).padStart(4,'0')}</strong>?</p>
        <textarea className="form-input" rows={3} placeholder="Motivo de anulación..." value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ resize: 'none', marginTop: 12 }} />
        <div className="modal-pie centrado" style={{ marginTop: 16 }}>
          <button className="btn-secundario" onClick={onClose}>Cancelar</button>
          <button className="btn-peligro" onClick={() => { if (motivo.trim()) onConfirmar(motivo); }} disabled={!motivo.trim()}>Anular venta</button>
        </div>
      </div>
    </div>
  );
}

export default function Ventas() {
  const { tienePermiso } = useAuth();
  const [lista,          setLista]         = useState([]);
  const [clientesData,   setClientesData]  = useState([]);
  const [productosData,  setProductosData] = useState([]);
  const [toppingsData,   setToppingsData]  = useState([]);
  const [adicionesData,  setAdicionesData] = useState([]);
  const [categoriasData, setCategoriasData]= useState([]);
  const [busqueda,       setBusqueda]      = useState('');
  const [filtroEstado,   setFiltroEstado]  = useState('todos');
  const [filtroMetodo,   setFiltroMetodo]  = useState('todos');
  const [filtroFecha,    setFiltroFecha]   = useState(() => new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [pagina,         setPagina]        = useState(1);
  const [modalCrear,     setModalCrear]    = useState(false);
  const [detalle,        setDetalle]       = useState(null);
  const [cambiandoEst,   setCambiandoEst]  = useState(null);
  const [anulando,       setAnulando]      = useState(null);
  const [devolviendo,    setDevolviendo]   = useState(null);

  const cargar = (f = filtroFecha) => api.listarVentas(null, f || undefined).then((d) => setLista(d.map(mapVenta))).catch(() => {});

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroMetodo('todos');
    setFiltroFecha('');
    setBusqueda('');
    cargar('');
  };

  useEffect(() => {
    cargar();
    api.listarClientes().then((d) => setClientesData(d.map((c) => ({ ...c, nombre: c.usuario?.nombre || '—', telefono: c.telefono || c.usuario?.email || '—', direcciones: c.direcciones || [] })))).catch(() => {});
    api.listarProductos().then(setProductosData).catch(() => {});
    api.listarToppings().then(setToppingsData).catch(() => {});
    api.listarAdiciones().then(setAdicionesData).catch(() => {});
    api.listarCategorias().then(setCategoriasData).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado, filtroMetodo, filtroFecha]);

  const filtrados = lista.filter((v) => {
    const matchBusqueda = (v.cliente || '').toLowerCase().includes(busqueda.toLowerCase()) || String(v.id_venta).includes(busqueda);
    const matchEstado   = filtroEstado === 'todos' || v.estado === filtroEstado;
    const matchMetodo   = filtroMetodo === 'todos' ? true : v.estado !== 'anulado' && v.metodo_pago === filtroMetodo;
    return matchBusqueda && matchEstado && matchMetodo;
  });

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados    = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const crearVenta = async (f) => {
    const items = (f.carrito || []).map((item) => ({
      id_producto: item.id_producto,
      cantidad:    item.cantidad,
      toppings:    (item.toppings  || []).map((t) => t.id_topping),
      adiciones:   (item.adiciones || []).map((a) => ({ id_adicion: a.id_adicion, cantidad: 1 })),
    }));
    const metodo   = f.metodoPago || 'efectivo';
    const efectivo = metodo === 'efectivo' ? f.total : metodo === 'mixto' ? (Number(f.pagoEfectivo) || 0) : 0;
    const transfer = metodo === 'transferencia' ? f.total : metodo === 'mixto' ? (Number(f.pagoTransfer) || 0) : 0;

    const payload = {
      id_cliente:          f.cliente?.id_cliente,
      costo_domicilio:     f.costodomicilio || 3000,
      observaciones:       f.observaciones || '',
      items,
      ...(metodo ? { metodo_pago: metodo } : {}),
      ...(efectivo > 0  ? { monto_efectivo:      efectivo  } : {}),
      ...(transfer > 0  ? { monto_transferencia: transfer  } : {}),
    };

    if (f.direccion?.esNueva) {
      payload.nueva_direccion = {
        direccion_linea: f.direccion.direccion_linea,
        barrio:          f.direccion.barrio          || null,
        ciudad:          f.direccion.ciudad          || null,
        departamento:    f.direccion.departamento    || null,
        referencia:      f.direccion.referencia      || null,
      };
    } else {
      payload.id_direccion = f.direccion?.id_direccion;
    }

    try { await api.crearVenta(payload); }
    catch (err) { alert(err?.response?.data?.message || 'Error al crear la venta'); }
    cargar(); setModalCrear(false);
  };

  const cambiarEstado = async ({ estado: est, motivo }) => {
    try {
      const payload = { nombre_estado: est };
      if (est === 'anulado' && motivo) payload.motivo_anulacion = motivo;
      await api.cambiarEstadoVenta(cambiandoEst.id_venta, payload);
    } catch (err) { alert(err?.response?.data?.message || 'Error al cambiar estado'); }
    cargar(); setCambiandoEst(null);
  };

  const devolverVenta = async () => {
    try { await api.cambiarEstadoVenta(devolviendo.id_venta, { nombre_estado: 'despachado' }); }
    catch (err) { alert(err?.response?.data?.message || 'Error al devolver venta'); }
    cargar(); setDevolviendo(null);
  };

  const anularVenta = async (mot) => {
    try { await api.anularVenta(anulando.id_venta, { motivo_anulacion: mot }); }
    catch (err) { alert(err?.response?.data?.message || 'Error al anular venta'); }
    cargar(); setAnulando(null);
  };

  const generarComprobante = (venta) => {
    const texto = `COMPROBANTE DE VENTA\n====================\nPedido: #${venta.id_venta}\nCliente: ${venta.cliente}\nFecha: ${venta.fecha}\nDirección: ${venta.direccion}\nTotal: $${venta.total.toLocaleString()}\nEstado: ${ESTADO_LABELS[venta.estado] || venta.estado}\n====================\nChocoFreseo — Gracias por tu compra!`;
    const blob  = new Blob([texto], { type: 'text/plain' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href = url; a.download = `comprobante-${venta.id_venta}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-titulo">Ventas</h1>
          <p className="page-subtitulo">{lista.length} ventas registradas</p>
        </div>
        {tienePermiso('gestionar_ventas') && (
          <button className="btn-primario" onClick={() => setModalCrear(true)}>+ Nueva venta</button>
        )}
      </div>

      <div className="ventas-toolbar">
        <div className="buscador" style={{ flex: 1, maxWidth: 340, marginBottom: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Buscar por cliente o número..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
          <span style={{ fontSize: 14 }}>📅</span>
          <input type="date" value={filtroFecha}
            onChange={(e) => { setFiltroFecha(e.target.value); cargar(e.target.value); }}
            style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#333' }} />
          {filtroFecha && (
            <button onClick={() => { setFiltroFecha(''); cargar(''); }}
              style={{ fontSize: 15, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, lineHeight: 1, padding: '0 2px' }} title="Quitar filtro de fecha">×</button>
          )}
        </div>

        <div className="filtro-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <select className="filtro-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'todos',         label: 'Todos' },
          { key: 'efectivo',      label: '💵 Efectivo' },
          { key: 'transferencia', label: '📱 Transferencia' },
          { key: 'mixto',         label: '⚡ Mixto' },
        ].map((m) => (
          <button key={m.key} onClick={() => setFiltroMetodo(m.key)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: filtroMetodo === m.key ? 'none' : '1px solid #e0e0e0',
            background: filtroMetodo === m.key ? '#CA0B0B' : '#f5f5f5',
            color: filtroMetodo === m.key ? '#fff' : '#555',
            fontWeight: filtroMetodo === m.key ? 700 : 400,
          }}>{m.label}</button>
        ))}
        {(filtroEstado !== 'todos' || filtroMetodo !== 'todos' || filtroFecha !== '' || busqueda !== '') && (
          <button onClick={limpiarFiltros} style={{ fontSize: 12, color: '#CA0B0B', border: '1px solid #CA0B0B', background: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      <div className="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>Venta</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Dirección</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginados.length === 0 ? (
              <tr><td colSpan={7}><div className="tabla-vacia">No se encontraron ventas</div></td></tr>
            ) : (
              paginados.map((v) => {
                const est = colorEstado(v.estado);
                return (
                  <tr key={v.id_venta}>
                    <td><span className="id-badge">#{v.id_venta}</span></td>
                    <td>{v.cliente}</td>
                    <td className="td-suave">{v.fecha}</td>
                    <td className="td-suave">{v.direccion}</td>
                    <td style={{ fontWeight: 800, color: '#16a34a' }}>${Number(v.total).toLocaleString('es-CO')}</td>
                    <td><span className="estado-badge" style={{ background: est.bg, color: est.color }}>{ESTADO_LABELS[v.estado] || v.estado}</span></td>
                    <td>
                      <div className="acciones">
                        <button className="btn-accion ver"     onClick={() => setDetalle(v)}       title="Ver detalle">
                          <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        {tienePermiso('cambiar_estado_venta') && (
                          <button className="btn-accion editar"  onClick={() => setCambiandoEst(v)}  title="Cambiar estado">
                            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                        )}
                        <button className="btn-accion permisos" onClick={() => generarComprobante(v)} title="Generar comprobante">
                          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </button>
                        {v.estado === 'entregado' && (
                          <button className="btn-accion" style={{ background: '#fef3c7', color: '#ca8a04' }} onClick={() => setDevolviendo(v)} title="Devolver al domiciliario">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 0 1 0 8h-1"/></svg>
                          </button>
                        )}
                        {tienePermiso('anular_venta') && v.estado !== 'anulado' && v.estado !== 'entregado' && v.estado !== 'despachado' && (
                          <button className="btn-accion eliminar" onClick={() => setAnulando(v)} title="Anular venta">
                            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
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

      <ModalCrearVenta open={modalCrear} onClose={() => setModalCrear(false)} onGuardar={crearVenta}
        clientesData={clientesData} productosData={productosData} toppingsData={toppingsData}
        adicionesData={adicionesData} categoriasData={categoriasData} />
      <ModalDetalle    open={!!detalle}       onClose={() => setDetalle(null)}       venta={detalle} />
      <ModalEstado     open={!!cambiandoEst}  onClose={() => setCambiandoEst(null)} onGuardar={cambiarEstado} venta={cambiandoEst} />
      <ModalAnular     open={!!anulando}      onClose={() => setAnulando(null)}      onConfirmar={anularVenta} venta={anulando} />
      <ModalDevolver   open={!!devolviendo}   onClose={() => setDevolviendo(null)}   onConfirmar={devolverVenta} venta={devolviendo} />
    </AdminLayout>
  );
}
