import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import * as api from '../../../services/api';
import FormDireccion from '../../../components/common/FormDireccion';
import './Ventas.css';

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  en_proceso: 'Confirmado',
  listo:      'Listo para despachar',
  despachado: 'Despachado',
  entregado:  'Entregado',
  anulado:    'Anulado',
};
const ESTADOS = Object.keys(ESTADO_LABELS);

// Aplana la respuesta de API a la forma plana que usa el render
const mapVenta = (v) => ({
  ...v,
  cliente:          v.cliente?.usuario?.nombre || v.cliente?.nombre || '—',
  telefono_cliente: v.cliente?.telefono || '—',
  estado:           v.estado?.nombre_estado    || v.estado          || 'pendiente',
  direccion:        v.direccion?.direccion_linea || v.direccion     || '—',
  barrio:           v.direccion?.barrio  || '',
  ciudad:           v.direccion?.ciudad  || '',
  fecha:            v.fecha ? new Date(v.fecha).toLocaleString('es-CO') : '—',
  metodo_pago:      v.metodo_pago || (
    v.pagos?.[0]?.detallePagos?.length > 1
      ? 'mixto'
      : v.pagos?.[0]?.detallePagos?.[0]?.metodoPago?.nombre || null
  ),
});

const colorEstado = (e) => ({
  pendiente:  { bg: '#fff5f5', color: '#CA0B0B' },
  en_proceso: { bg: '#eff6ff', color: '#3b82f6' },
  listo:      { bg: '#fefce8', color: '#ca8a04' },
  despachado: { bg: '#f5f3ff', color: '#7c3aed' },
  entregado:  { bg: '#f0fdf4', color: '#16a34a' },
  anulado:    { bg: '#f5f5f5', color: '#888'    },
}[e] || { bg: '#fff5f5', color: '#CA0B0B' });

function ModalCrearVenta({ open, onClose, onGuardar, clientesData = [], productosData = [], toppingsData = [], adicionesData = [] }) {
  const [paso,               setPaso]               = useState(1);
  const [cliente,            setCliente]            = useState(null);
  const [direccion,          setDireccion]          = useState(null);
  const [modoDir,            setModoDir]            = useState('guardada'); // 'guardada' | 'nueva'
  const [nuevaDireccion,     setNuevaDireccion]     = useState({ direccion_linea: '', barrio: '', ciudad: '', departamento: '', referencia: '' });
  const [errDir,             setErrDir]             = useState({});
  const [carrito,            setCarrito]            = useState([]);
  const [direccionesCliente, setDireccionesCliente] = useState([]);
  const [pagoEfectivo,  setPagoEfectivo]  = useState('');
  const [pagoTransfer,  setPagoTransfer]  = useState('');
  const [comprobante,   setComprobante]   = useState(null);
  const [observaciones, setObservaciones] = useState('');

  if (!open) return null;

  const subtotal       = carrito.reduce((a, i) => a + i.subtotal, 0);
  const costodomicilio = 3000;
  const total          = subtotal + costodomicilio;
  const totalPagado    = (Number(pagoEfectivo) || 0) + (Number(pagoTransfer) || 0);
  const cambio         = totalPagado - total;

  const agregarProducto = (prod) => {
    if (carrito.find((c) => c.id_producto === prod.id_producto)) return;
    setCarrito((p) => [...p, { ...prod, cantidad: 1, toppings: [], adiciones: [], subtotal: prod.precio }]);
  };

  const quitarProducto  = (id) => setCarrito((p) => p.filter((c) => c.id_producto !== id));

  const cambiarCantidad = (id, cant) => {
    if (cant < 1) return;
    setCarrito((p) => p.map((c) => c.id_producto === id
      ? { ...c, cantidad: cant, subtotal: (c.precio + c.adiciones.reduce((a, x) => a + x.precio, 0)) * cant }
      : c
    ));
  };

  const toggleTopping = (id_prod, topping) => {
    setCarrito((p) => p.map((c) => {
      if (c.id_producto !== id_prod) return c;
      const existe = c.toppings.find((t) => t.id_topping === topping.id_topping);
      const nuevos = existe
        ? c.toppings.filter((t) => t.id_topping !== topping.id_topping)
        : c.toppings.length >= c.max_toppings ? c.toppings : [...c.toppings, topping];
      return { ...c, toppings: nuevos };
    }));
  };

  const toggleAdicion = (id_prod, adicion) => {
    setCarrito((p) => p.map((c) => {
      if (c.id_producto !== id_prod) return c;
      const existe   = c.adiciones.find((a) => a.id_adicion === adicion.id_adicion);
      const nuevas   = existe ? c.adiciones.filter((a) => a.id_adicion !== adicion.id_adicion) : [...c.adiciones, adicion];
      const subtotal = (c.precio + nuevas.reduce((a, x) => a + x.precio, 0)) * c.cantidad;
      return { ...c, adiciones: nuevas, subtotal };
    }));
  };

  const reset = () => {
    setPaso(1); setCliente(null); setDireccion(null); setModoDir('guardada');
    setNuevaDireccion({ direccion_linea: '', barrio: '', ciudad: '', departamento: '', referencia: '' });
    setErrDir({}); setCarrito([]); setDireccionesCliente([]);
    setPagoEfectivo(''); setPagoTransfer(''); setComprobante(null); setObservaciones('');
  };

  const guardar = () => {
    const dirFinal = modoDir === 'nueva' ? { ...nuevaDireccion, esNueva: true } : direccion;
    onGuardar({ cliente, direccion: dirFinal, carrito, pagoEfectivo, pagoTransfer, comprobante, observaciones, total, subtotal, costodomicilio });
    reset(); onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-caja" style={{ width: 600, maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-encabezado">
          <span className="modal-titulo">Nueva venta</span>
          <button className="modal-cerrar" onClick={() => { reset(); onClose(); }}>✕</button>
        </div>

        <div className="pasos-wrap">
          {['Cliente', 'Productos', 'Pago'].map((p, i) => (
            <div key={p} className={`paso-item ${paso === i+1 ? 'activo' : ''} ${paso > i+1 ? 'completado' : ''}`}>
              <div className="paso-circulo">{paso > i+1 ? '✓' : i+1}</div>
              <span className="paso-label">{p}</span>
              {i < 2 && <div className="paso-linea" />}
            </div>
          ))}
        </div>

        {/* Paso 1 — Cliente */}
        {paso === 1 && (
          <div>
            <div className="form-grupo">
              <select className="form-input" value={cliente?.id_cliente || ''} onChange={(e) => {
                const c = clientesData.find((x) => x.id_cliente === Number(e.target.value));
                setCliente(c || null); setDireccion(null); setDireccionesCliente([]);
                if (c) {
                  api.listarDireccionesCliente(c.id_cliente)
                    .then((dirs) => setDireccionesCliente((dirs || []).filter((d) => d.estado !== 0)))
                    .catch(() => setDireccionesCliente([]));
                }
              }}>
                <option value="">Seleccionar cliente...</option>
                {clientesData.map((c) => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} — {c.telefono}</option>)}
              </select>
            </div>
            {cliente && (
              <>
                <div className="form-fila" style={{ gap: 8, marginBottom: 8 }}>
                  <button
                    type="button"
                    className={`btn-${modoDir === 'guardada' ? 'primario' : 'secundario'}`}
                    style={{ flex: 1, fontSize: 13 }}
                    onClick={() => setModoDir('guardada')}
                  >Dirección guardada</button>
                  <button
                    type="button"
                    className={`btn-${modoDir === 'nueva' ? 'primario' : 'secundario'}`}
                    style={{ flex: 1, fontSize: 13 }}
                    onClick={() => setModoDir('nueva')}
                  >Nueva dirección</button>
                </div>

                {modoDir === 'guardada' && (
                  <div className="form-grupo">
                    <select className="form-input" value={direccion?.id_direccion || ''} onChange={(e) => {
                      setDireccion(direccionesCliente.find((x) => x.id_direccion === Number(e.target.value)) || null);
                    }}>
                      <option value="">
                        {direccionesCliente.length === 0 ? 'Sin direcciones guardadas' : 'Seleccionar dirección...'}
                      </option>
                      {direccionesCliente.map((d) => <option key={d.id_direccion} value={d.id_direccion}>{d.direccion_linea} — {d.barrio}</option>)}
                    </select>
                  </div>
                )}

                {modoDir === 'nueva' && (
                  <FormDireccion
                    value={nuevaDireccion}
                    onChange={(f, v) => { setNuevaDireccion((p) => ({ ...p, [f]: v })); setErrDir((p) => ({ ...p, [f]: '' })); }}
                    errors={errDir}
                    layout="admin"
                  />
                )}
              </>
            )}
            {cliente && modoDir === 'guardada' && direccion && (
              <div className="cliente-info-card">
                <div className="cliente-info-fila"><span className="detalle-label">Cliente</span><span className="detalle-valor">{cliente.nombre}</span></div>
                <div className="cliente-info-fila"><span className="detalle-label">Teléfono</span><span className="detalle-valor">{cliente.telefono}</span></div>
                <div className="cliente-info-fila"><span className="detalle-label">Dirección</span><span className="detalle-valor">{direccion.direccion_linea}, {direccion.barrio}</span></div>
              </div>
            )}
            <div className="modal-pie">
              <button className="btn-secundario" onClick={() => { reset(); onClose(); }}>Cancelar</button>
              <button
                className="btn-primario"
                onClick={() => setPaso(2)}
                disabled={!cliente || (modoDir === 'guardada' && !direccion)}
              >Siguiente →</button>
            </div>
          </div>
        )}

        {/* Paso 2 — Productos */}
        {paso === 2 && (
          <div>
            <p className="form-seccion-titulo">Agregar productos</p>
            <div className="productos-grid">
              {productosData.map((p) => {
                const enCarrito = carrito.find((c) => c.id_producto === p.id_producto);
                return (
                  <div key={p.id_producto} className={`producto-card ${enCarrito ? 'seleccionado' : ''}`} onClick={() => enCarrito ? quitarProducto(p.id_producto) : agregarProducto(p)}>
                    <div className="producto-card-nombre">{p.nombre}</div>
                    <div className="producto-card-precio">${p.precio.toLocaleString()}</div>
                    {enCarrito && <div className="producto-card-check">✓</div>}
                  </div>
                );
              })}
            </div>
            {carrito.length > 0 && (
              <div className="carrito-lista">
                <p className="form-seccion-titulo">Carrito ({carrito.length} productos)</p>
                {carrito.map((item) => (
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
                    {item.permite_toppings === 1 && (
                      <div className="carrito-extras">
                        <span className="extras-titulo">Toppings (máx. {item.max_toppings})</span>
                        <div className="extras-chips">
                          {toppingsData.map((t) => (
                            <button key={t.id_topping} className={`chip ${item.toppings.find((x) => x.id_topping === t.id_topping) ? 'activo' : ''}`} onClick={() => toggleTopping(item.id_producto, t)}>{t.nombre}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="carrito-extras">
                      <span className="extras-titulo">Adiciones</span>
                      <div className="extras-chips">
                        {adicionesData.map((a) => (
                          <button key={a.id_adicion} className={`chip ${item.adiciones.find((x) => x.id_adicion === a.id_adicion) ? 'activo' : ''}`} onClick={() => toggleAdicion(item.id_producto, a)}>{a.nombre} +${a.precio.toLocaleString()}</button>
                        ))}
                      </div>
                    </div>
                    <div className="carrito-item-subtotal">Subtotal: <strong>${item.subtotal.toLocaleString()}</strong></div>
                  </div>
                ))}
                <div className="carrito-resumen">
                  <div className="carrito-resumen-fila"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
                  <div className="carrito-resumen-fila"><span>Costo domicilio</span><span>${costodomicilio.toLocaleString()}</span></div>
                  <div className="carrito-resumen-fila total"><span>Total</span><span>${total.toLocaleString()}</span></div>
                </div>
              </div>
            )}
            <div className="modal-pie">
              <button className="btn-secundario" onClick={() => setPaso(1)}>← Atrás</button>
              <button className="btn-primario" onClick={() => setPaso(3)} disabled={carrito.length === 0}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* Paso 3 — Pago */}
        {paso === 3 && (
          <div>
            <p className="form-seccion-titulo">Resumen del pedido</p>
            <div className="resumen-venta">
              {carrito.map((item) => (
                <div key={item.id_producto} className="resumen-item">
                  <span>{item.cantidad}x {item.nombre}</span>
                  <span>${item.subtotal.toLocaleString()}</span>
                </div>
              ))}
              <div className="carrito-resumen" style={{ marginTop: 8 }}>
                <div className="carrito-resumen-fila"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
                <div className="carrito-resumen-fila"><span>Domicilio</span><span>${costodomicilio.toLocaleString()}</span></div>
                <div className="carrito-resumen-fila total"><span>Total a pagar</span><span>${total.toLocaleString()}</span></div>
              </div>
            </div>

            <p className="form-seccion-titulo" style={{ marginTop: 16 }}>Método de pago</p>
            <div className="form-fila">
              <div className="form-grupo">
                <label className="form-label">Efectivo</label>
                <div className="input-precio-wrap">
                  <span className="input-precio-simbolo">$</span>
                  <input className="form-input input-precio" type="number" placeholder="0" value={pagoEfectivo} onChange={(e) => setPagoEfectivo(e.target.value)} />
                </div>
              </div>
              <div className="form-grupo">
                <label className="form-label">Transferencia</label>
                <div className="input-precio-wrap">
                  <span className="input-precio-simbolo">$</span>
                  <input className="form-input input-precio" type="number" placeholder="0" value={pagoTransfer} onChange={(e) => setPagoTransfer(e.target.value)} />
                </div>
              </div>
            </div>

            {Number(pagoTransfer) > 0 && (
              <div className="form-grupo">
                <label className="form-label">Comprobante de transferencia</label>
                <label className="upload-imagen">
                  {comprobante
                    ? <img src={URL.createObjectURL(comprobante)} className="upload-preview" alt="comprobante" />
                    : <div className="upload-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span>Subir comprobante</span>
                      </div>
                  }
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setComprobante(e.target.files[0])} />
                </label>
              </div>
            )}

            {totalPagado > 0 && (
              <div className="pago-resumen">
                <div className="pago-resumen-fila">
                  <span>Total pagado</span>
                  <span style={{ color: totalPagado >= total ? '#16a34a' : '#CA0B0B' }}>${totalPagado.toLocaleString()}</span>
                </div>
                {cambio >= 0
                  ? <div className="pago-resumen-fila"><span>Cambio</span><span style={{ color: '#16a34a', fontWeight: 800 }}>${cambio.toLocaleString()}</span></div>
                  : <div className="pago-resumen-fila"><span>Falta</span><span style={{ color: '#CA0B0B', fontWeight: 800 }}>${Math.abs(cambio).toLocaleString()}</span></div>
                }
              </div>
            )}

            <div className="form-grupo" style={{ marginTop: 12 }}>
              <label className="form-label">Observaciones</label>
              <textarea className="form-input" rows={3} placeholder="Instrucciones especiales, referencias de entrega..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ resize: 'none' }} />
            </div>

            <div className="modal-pie">
              <button className="btn-secundario" onClick={() => setPaso(2)}>← Atrás</button>
              <button className="btn-primario" onClick={guardar} disabled={totalPagado < total}>Confirmar venta</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const METODO_BADGE = {
  efectivo:      { bg: '#f0fdf4', color: '#16a34a', label: '💵 Efectivo' },
  transferencia: { bg: '#eff6ff', color: '#3b82f6', label: '📱 Transferencia' },
  mixto:         { bg: '#f5f3ff', color: '#7c3aed', label: '💳 Mixto' },
};

function ModalDetalle({ open, onClose, venta }) {
  if (!open || !venta) return null;
  const est     = colorEstado(venta.estado);
  const metBadge = venta.metodo_pago ? (METODO_BADGE[venta.metodo_pago] || { bg: '#f5f5f5', color: '#888', label: venta.metodo_pago }) : null;
  const subtotalProductos = (venta.detalleVentas || []).reduce((a, d) => a + Number(d.subtotal || 0), 0);

  return (
    <div className="modal-overlay">
      <div className="modal-caja" style={{ width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-encabezado">
          <span className="modal-titulo">Detalle — #V-{String(venta.id_venta).padStart(4,'0')}</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>

        {/* Info principal */}
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
          {(venta.barrio || venta.ciudad) && (
            <>
              {venta.barrio && (
                <div className="detalle-item">
                  <span className="detalle-label">Barrio</span>
                  <span className="detalle-valor">{venta.barrio}</span>
                </div>
              )}
              {venta.ciudad && (
                <div className="detalle-item">
                  <span className="detalle-label">Ciudad</span>
                  <span className="detalle-valor">{venta.ciudad}</span>
                </div>
              )}
            </>
          )}
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

        {/* Productos */}
        {(venta.detalleVentas || []).length > 0 && (
          <>
            <p className="detalle-label" style={{ padding: '10px 0 6px', fontWeight: 700, color: '#333' }}>Productos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {venta.detalleVentas.map((d, i) => (
                <div key={i} style={{ background: '#fafafa', borderRadius: 8, padding: '10px 12px', border: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{d.cantidad}× {d.producto?.nombre || '—'}</span>
                    <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 13 }}>${Number(d.subtotal).toLocaleString()}</span>
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

        {/* Totales */}
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginBottom: 6 }}>
            <span>Subtotal productos</span>
            <span>${subtotalProductos.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginBottom: 8 }}>
            <span>Costo domicilio</span>
            <span>${Number(venta.costo_domicilio || 0).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#16a34a', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
            <span>Total</span>
            <span>${Number(venta.total || 0).toLocaleString()}</span>
          </div>
          {metBadge && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 13, color: '#888' }}>Método de pago</span>
              <span style={{ background: metBadge.bg, color: metBadge.color, fontWeight: 700, fontSize: 12, padding: '3px 12px', borderRadius: 20 }}>{metBadge.label}</span>
            </div>
          )}
        </div>

        <div className="modal-pie" style={{ marginTop: 16 }}>
          <button className="btn-primario" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function ModalEstado({ open, onClose, onGuardar, venta }) {
  const [estado, setEstado] = useState(venta?.estado || '');
  if (!open || !venta) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-caja modal-pequeno">
        <div className="modal-encabezado">
          <span className="modal-titulo">Cambiar estado</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>
        <select className="form-input" value={estado} onChange={(e) => setEstado(e.target.value)}>
          {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
        </select>
        <div className="modal-pie" style={{ marginTop: 16 }}>
          <button className="btn-secundario" onClick={onClose}>Cancelar</button>
          <button className="btn-primario" onClick={() => onGuardar(estado)}>Guardar</button>
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
          <button
            onClick={onConfirmar}
            style={{ background: '#fef3c7', color: '#ca8a04', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}
          >Sí, devolver</button>
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
  const [lista,          setLista]         = useState([]);
  const [clientesData,   setClientesData]  = useState([]);
  const [productosData,  setProductosData] = useState([]);
  const [toppingsData,   setToppingsData]  = useState([]);
  const [adicionesData,  setAdicionesData] = useState([]);
  const [busqueda,       setBusqueda]      = useState('');
  const [filtroEstado,   setFiltroEstado]  = useState('todos');
  const [filtroMetodo,   setFiltroMetodo]  = useState('todos');
  const [filtroFecha,    setFiltroFecha]   = useState('');
  const [modalCrear,     setModalCrear]    = useState(false);
  const [detalle,        setDetalle]       = useState(null);
  const [cambiandoEst,   setCambiandoEst]  = useState(null);
  const [anulando,       setAnulando]      = useState(null);
  const [devolviendo,    setDevolviendo]   = useState(null);

  const cargar = (f = filtroFecha) => api.listarVentas(null, f || undefined).then((d) => setLista(d.map(mapVenta))).catch(() => {});

  useEffect(() => {
    cargar();
    api.listarClientes().then((d) => setClientesData(d.map((c) => ({
      ...c,
      nombre:     c.usuario?.nombre || '—',
      telefono:   c.telefono || c.usuario?.email || '—',
      direcciones: c.direcciones || [],
    })))).catch(() => {});
    api.listarProductos().then(setProductosData).catch(() => {});
    api.listarToppings().then(setToppingsData).catch(() => {});
    api.listarAdiciones().then(setAdicionesData).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = lista.filter((v) => {
    const matchBusqueda = (v.cliente || '').toLowerCase().includes(busqueda.toLowerCase()) || String(v.id_venta).includes(busqueda);
    const matchEstado   = filtroEstado === 'todos' || v.estado === filtroEstado;
    const matchMetodo   = filtroMetodo === 'todos' || v.metodo_pago === filtroMetodo;
    return matchBusqueda && matchEstado && matchMetodo;
  });

  const crearVenta = async (f) => {
    const items = (f.carrito || []).map((item) => ({
      id_producto: item.id_producto,
      cantidad:    item.cantidad,
      toppings:    (item.toppings  || []).map((t) => t.id_topping),
      adiciones:   (item.adiciones || []).map((a) => ({ id_adicion: a.id_adicion, cantidad: 1 })),
    }));
    await api.crearVenta({
      id_cliente:      f.cliente?.id_cliente,
      id_direccion:    f.direccion?.id_direccion,
      costo_domicilio: f.costodomicilio || 3000,
      observaciones:   f.observaciones || '',
      items,
    }).catch(() => {});
    cargar();
    setModalCrear(false);
  };

  const cambiarEstado = async (est) => {
    try {
      await api.cambiarEstadoVenta(cambiandoEst.id_venta, { nombre_estado: est });
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al cambiar estado');
    }
    cargar();
    setCambiandoEst(null);
  };

  const devolverVenta = async () => {
    try {
      await api.cambiarEstadoVenta(devolviendo.id_venta, { nombre_estado: 'despachado' });
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al devolver venta');
    }
    cargar();
    setDevolviendo(null);
  };

  const anularVenta = async (mot) => {
    try {
      await api.anularVenta(anulando.id_venta, { motivo_anulacion: mot });
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al anular venta');
    }
    cargar();
    setAnulando(null);
  };

  const generarComprobante = (venta) => {
    const texto = `COMPROBANTE DE VENTA\n====================\nVenta: #V-${String(venta.id_venta).padStart(4,'0')}\nCliente: ${venta.cliente}\nFecha: ${venta.fecha}\nDirección: ${venta.direccion}\nTotal: $${venta.total.toLocaleString()}\nEstado: ${ESTADO_LABELS[venta.estado] || venta.estado}\n====================\nChocoFreseo — Gracias por tu compra!`;
    const blob  = new Blob([texto], { type: 'text/plain' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href = url; a.download = `comprobante-V${venta.id_venta}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-titulo">Ventas</h1>
          <p className="page-subtitulo">{lista.length} ventas registradas</p>
        </div>
        <button className="btn-primario" onClick={() => setModalCrear(true)}>+ Nueva venta</button>
      </div>

      <div className="ventas-toolbar">
        <div className="buscador" style={{ flex: 1, maxWidth: 340, marginBottom: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Buscar por cliente o número..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        {/* Filtro por fecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
          <span style={{ fontSize: 14 }}>📅</span>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => { setFiltroFecha(e.target.value); cargar(e.target.value); }}
            style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#333' }}
          />
          <button
            onClick={() => { const hoy = new Date().toISOString().slice(0,10); setFiltroFecha(hoy); cargar(hoy); }}
            style={{ fontSize: 11, color: '#CA0B0B', background: 'none', border: '1px solid #CA0B0B', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontWeight: 700 }}
          >Hoy</button>
          {filtroFecha && (
            <button
              onClick={() => { setFiltroFecha(''); cargar(''); }}
              style={{ fontSize: 15, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, lineHeight: 1, padding: '0 2px' }}
              title="Quitar filtro de fecha"
            >×</button>
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

      {/* Chips de método de pago */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { key: 'todos',         label: 'Todos' },
          { key: 'efectivo',      label: '💵 Efectivo' },
          { key: 'transferencia', label: '📱 Transferencia' },
          { key: 'mixto',         label: '💳 Mixto' },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setFiltroMetodo(m.key)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: filtroMetodo === m.key ? 'none' : '1px solid #e0e0e0',
              background: filtroMetodo === m.key ? '#CA0B0B' : '#f5f5f5',
              color: filtroMetodo === m.key ? '#fff' : '#555',
              fontWeight: filtroMetodo === m.key ? 700 : 400,
            }}
          >{m.label}</button>
        ))}
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
            {filtrados.length === 0 ? (
              <tr><td colSpan={7}><div className="tabla-vacia">No se encontraron ventas</div></td></tr>
            ) : (
              filtrados.map((v) => {
                const est = colorEstado(v.estado);
                return (
                  <tr key={v.id_venta}>
                    <td><span className="id-badge">V-{String(v.id_venta).padStart(4,'0')}</span></td>
                    <td>{v.cliente}</td>
                    <td className="td-suave">{v.fecha}</td>
                    <td className="td-suave">{v.direccion}</td>
                    <td style={{ fontWeight: 800, color: '#16a34a' }}>${v.total.toLocaleString()}</td>
                    <td><span className="estado-badge" style={{ background: est.bg, color: est.color }}>{ESTADO_LABELS[v.estado] || v.estado}</span></td>
                    <td>
                      <div className="acciones">
                        <button className="btn-accion ver"     onClick={() => setDetalle(v)}       title="Ver detalle">
                          <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button className="btn-accion editar"  onClick={() => setCambiandoEst(v)}  title="Cambiar estado">
                          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button className="btn-accion permisos" onClick={() => generarComprobante(v)} title="Generar comprobante">
                          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </button>
                        {v.estado === 'entregado' && (
                          <button
                            className="btn-accion"
                            style={{ background: '#fef3c7', color: '#ca8a04' }}
                            onClick={() => setDevolviendo(v)}
                            title="Devolver al domiciliario"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 0 1 0 8h-1"/></svg>
                          </button>
                        )}
                        {v.estado !== 'anulado' && v.estado !== 'entregado' && v.estado !== 'despachado' && (
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
        <div className="paginacion">
          <button className="btn-pagina">‹</button>
          <button className="btn-pagina activo">1</button>
          <button className="btn-pagina">›</button>
        </div>
      </div>

      <ModalCrearVenta open={modalCrear} onClose={() => setModalCrear(false)} onGuardar={crearVenta}
        clientesData={clientesData} productosData={productosData} toppingsData={toppingsData} adicionesData={adicionesData} />
      <ModalDetalle    open={!!detalle}       onClose={() => setDetalle(null)}       venta={detalle} />
      <ModalEstado     open={!!cambiandoEst}  onClose={() => setCambiandoEst(null)} onGuardar={cambiarEstado} venta={cambiandoEst} />
      <ModalAnular     open={!!anulando}      onClose={() => setAnulando(null)}      onConfirmar={anularVenta} venta={anulando} />
      <ModalDevolver   open={!!devolviendo}   onClose={() => setDevolviendo(null)}   onConfirmar={devolverVenta} venta={devolviendo} />
    </AdminLayout>
  );
}