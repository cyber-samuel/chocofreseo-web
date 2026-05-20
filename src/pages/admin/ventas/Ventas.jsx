import { useState, useEffect } from 'react';
import { Eye, Edit, Check, X, FileText, RotateCcw, AlertTriangle, Banknote, Smartphone, Zap, Star, CheckCircle } from 'lucide-react';
import { toast } from '../../../utils/toast';
import { imgCl } from '../../../utils/cloudinary';
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
  efectivo:      { bg: '#f0fdf4', color: '#16a34a', label: 'Efectivo',      Icon: Banknote   },
  transferencia: { bg: '#eff6ff', color: '#3b82f6', label: 'Transferencia', Icon: Smartphone },
  mixto:         { bg: '#f5f3ff', color: '#7c3aed', label: 'Mixto',         Icon: Zap        },
};

// Helper para calcular y desglosar el subtotal de un detalleVenta (ver detalle)
const calcularDesglose = (d) => {
  const precioBase  = Number(d.producto?.precio || 0);
  const precioUnit  = Number(d.precio_unitario || 0);
  const toppingExtra = Math.max(0, precioUnit - precioBase);
  const cantidad    = d.cantidad || 1;
  const adicsTotal  = (d.detalleAdiciones || []).reduce((s, a) => s + Number(a.subtotal || 0), 0);
  const totalItem   = precioUnit * cantidad + adicsTotal;
  return { precioBase, toppingExtra, adicsTotal, totalItem, precioUnit, cantidad };
};

const calcularPrecioItem = (item) => {
  const base = Number(item.precio);
  const maxTop = item.max_toppings || 0;
  const totalTop = (item.toppings || []).reduce((s, t) => s + (t.cantidad || 1), 0);
  const toppingExtra = Math.max(0, totalTop - maxTop) * 2000;
  const adicionesTotal = (item.adiciones || []).reduce((s, a) => s + Number(a.precio || 0) * (a.cantidad || 1), 0);
  return base + toppingExtra + adicionesTotal;
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
  const [costoEnvio,         setCostoEnvio]         = useState(5500);
  const [metodoPago,         setMetodoPago]         = useState('efectivo');
  const [pagoEfectivo,       setPagoEfectivo]       = useState('');
  const [pagoTransfer,       setPagoTransfer]       = useState('');
  const [observaciones,      setObservaciones]      = useState('');
  const [productoConfigurar, setProductoConfigurar] = useState(null);
  const [toppingsTemp,       setToppingsTemp]       = useState([]);
  const [adicionesTemp,      setAdicionesTemp]      = useState([]);
  const [chocolateTemp,      setChocolateTemp]      = useState('');

  if (!open) return null;

  const subtotal     = carrito.reduce((a, i) => a + calcularPrecioItem(i) * i.cantidad, 0);
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

  const itemsIguales = (a, b) => {
    if (a.id_producto !== b.id_producto) return false;
    const topsA = [...(a.toppings || [])].map((t) => t.id_topping).sort().join(',');
    const topsB = [...(b.toppings || [])].map((t) => t.id_topping).sort().join(',');
    if (topsA !== topsB) return false;
    const adsA  = [...(a.adiciones || [])].map((ad) => ad.id_adicion).sort().join(',');
    const adsB  = [...(b.adiciones || [])].map((ad) => ad.id_adicion).sort().join(',');
    return adsA === adsB;
  };

  const agregarAlCarrito = (producto, toppings, adiciones, chocolate) => {
    const nuevoItem = {
      lineaId:          Date.now() + Math.random(),
      id_producto:      producto.id_producto,
      nombre:           producto.nombre,
      precio:           Number(producto.precio),
      permite_toppings: producto.permite_toppings,
      max_toppings:     producto.max_toppings || 0,
      img:              producto.img,
      toppings,
      adiciones,
      chocolate:        chocolate || null,
      cantidad: 1,
    };
    setCarrito((prev) => {
      const idx = prev.findIndex((item) => itemsIguales(item, nuevoItem));
      if (idx >= 0) {
        const arr = [...prev];
        arr[idx] = { ...arr[idx], cantidad: arr[idx].cantidad + 1 };
        return arr;
      }
      return [...prev, nuevoItem];
    });
    setProductoConfigurar(null);
    setToppingsTemp([]);
    setAdicionesTemp([]);
    setChocolateTemp('');
    setBusquedaProd('');
  };

  const clickProducto = (prod) => {
    setProductoConfigurar(prod);
    setToppingsTemp([]);
    setAdicionesTemp([]);
    setChocolateTemp('');
  };

  const quitarProducto = (lineaId) => setCarrito((p) => p.filter((c) => c.lineaId !== lineaId));

  const cambiarCantidad = (lineaId, cant) => {
    if (cant <= 0) { quitarProducto(lineaId); return; }
    setCarrito((p) => p.map((c) => c.lineaId === lineaId ? { ...c, cantidad: cant } : c));
  };

  const agregarToppingTemp = (t) => setToppingsTemp((p) => [...p, { ...t, cantidad: 1 }]);
  const ajustarToppingTemp = (id, delta) => setToppingsTemp((p) =>
    p.map((t) => t.id_topping === id ? { ...t, cantidad: t.cantidad + delta } : t).filter((t) => t.cantidad > 0)
  );

  const agregarAdicionTemp = (a) => setAdicionesTemp((p) => [...p, { ...a, precio: Number(a.precio), cantidad: 1 }]);
  const ajustarAdicionTemp = (id, delta) => setAdicionesTemp((p) =>
    p.map((a) => a.id_adicion === id ? { ...a, cantidad: a.cantidad + delta } : a).filter((a) => a.cantidad > 0)
  );

  const getSubtotalItem = (item) => calcularPrecioItem(item) * item.cantidad;

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
    setCarrito([]); setDireccionesCliente([]); setFiltroCategoria(''); setBusquedaProd(''); setCostoEnvio(5500);
    setMetodoPago('efectivo'); setPagoEfectivo(''); setPagoTransfer(''); setObservaciones('');
    setProductoConfigurar(null); setToppingsTemp([]); setAdicionesTemp([]); setChocolateTemp('');
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
          <div style={{ position: 'relative' }}>

            {/* ── Modal configurador (toppings + adiciones) ── */}
            {productoConfigurar && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                <div style={{ background: '#fff', borderRadius: 14, width: '92%', maxHeight: '85%', overflowY: 'auto', padding: '20px 18px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a1a' }}>Configurar {productoConfigurar.nombre}</div>
                    <button onClick={() => setProductoConfigurar(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888', lineHeight: 1 }}>✕</button>
                  </div>

                  {/* Chocolate */}
                  {(productoConfigurar.permite_chocolate === true || productoConfigurar.permite_chocolate === 1) && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>🍫 Tipo de chocolate</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['Negro', 'Blanco'].map((tipo) => (
                          <button key={tipo} onClick={() => setChocolateTemp(tipo)} style={{
                            flex: 1, padding: '8px', borderRadius: 8, fontFamily: 'inherit',
                            border: `2px solid ${chocolateTemp === tipo ? '#CA0B0B' : '#e5e7eb'}`,
                            background: chocolateTemp === tipo ? '#fff5f5' : '#fff',
                            color: chocolateTemp === tipo ? '#CA0B0B' : '#555',
                            fontWeight: chocolateTemp === tipo ? 700 : 400, cursor: 'pointer', fontSize: 12,
                          }}>
                            {tipo === 'Negro' ? '🍫' : '⬜'} {tipo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Toppings */}
                  {productoConfigurar.permite_toppings === 1 && toppingsActivos.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      {(() => {
                        const totalTop = toppingsTemp.reduce((s, t) => s + t.cantidad, 0);
                        const maxTop = productoConfigurar.max_toppings || 0;
                        return (
                          <div style={{ fontSize: 11, color: totalTop > maxTop ? '#CA0B0B' : '#888', marginBottom: 6, fontWeight: 600 }}>
                            {totalTop === 0 ? `Hasta ${maxTop} incluidos gratis (+$2.000 extra)`
                              : totalTop <= maxTop ? `${totalTop} de ${maxTop} incluidos gratis`
                              : `${maxTop} incluidos + ${totalTop - maxTop} extra (+$${((totalTop - maxTop) * 2000).toLocaleString('es-CO')})`}
                          </div>
                        );
                      })()}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {toppingsActivos.map((t) => {
                          const enLista = toppingsTemp.find((x) => x.id_topping === t.id_topping);
                          const chipB = { background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', fontSize: 14, fontWeight: 800, color: '#fff' };
                          return enLista ? (
                            <div key={t.id_topping} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', color: '#fff', borderRadius: 8, padding: '6px 10px' }}>
                              <span style={{ fontSize: 12, fontWeight: 700 }}>{t.nombre}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button style={chipB} onClick={() => ajustarToppingTemp(t.id_topping, -1)}>−</button>
                                <span style={{ fontWeight: 800, minWidth: 18, textAlign: 'center', fontSize: 13 }}>{enLista.cantidad}</span>
                                <button style={chipB} onClick={() => ajustarToppingTemp(t.id_topping, 1)}>+</button>
                                <button style={{ ...chipB, color: '#f87171', marginLeft: 2 }} onClick={() => ajustarToppingTemp(t.id_topping, -enLista.cantidad)}>×</button>
                              </div>
                            </div>
                          ) : (
                            <button key={t.id_topping} onClick={() => agregarToppingTemp(t)}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{t.nombre}</span>
                              <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>+</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Adiciones */}
                  {adicionesActivas.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>Adiciones (opcional)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {adicionesActivas.map((a) => {
                          const enLista = adicionesTemp.find((x) => x.id_adicion === a.id_adicion);
                          const chipB = { background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', fontSize: 14, fontWeight: 800, color: '#fff' };
                          return enLista ? (
                            <div key={a.id_adicion} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#d97706', color: '#fff', borderRadius: 8, padding: '6px 10px' }}>
                              <span style={{ fontSize: 12, fontWeight: 700 }}>{a.nombre} — ${(Number(a.precio) * enLista.cantidad).toLocaleString('es-CO')}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button style={chipB} onClick={() => ajustarAdicionTemp(a.id_adicion, -1)}>−</button>
                                <span style={{ fontWeight: 800, minWidth: 18, textAlign: 'center', fontSize: 13 }}>{enLista.cantidad}</span>
                                <button style={chipB} onClick={() => ajustarAdicionTemp(a.id_adicion, 1)}>+</button>
                                <button style={{ ...chipB, color: 'rgba(255,255,255,0.7)', marginLeft: 2 }} onClick={() => ajustarAdicionTemp(a.id_adicion, -enLista.cantidad)}>×</button>
                              </div>
                            </div>
                          ) : (
                            <button key={a.id_adicion} onClick={() => agregarAdicionTemp(a)}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1.5px solid #d97706', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{a.nombre}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>+${Number(a.precio).toLocaleString('es-CO')}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Precio unitario</span>
                    <span style={{ color: '#16a34a' }}>
                      ${calcularPrecioItem({ precio: productoConfigurar.precio, max_toppings: productoConfigurar.max_toppings, toppings: toppingsTemp, adiciones: adicionesTemp }).toLocaleString('es-CO')}
                    </span>
                  </div>

                  <button
                    onClick={() => agregarAlCarrito(productoConfigurar, toppingsTemp, adicionesTemp, chocolateTemp)}
                    style={{ width: '100%', padding: 12, background: '#CA0B0B', color: '#fff', border: 'none',
                      borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + Agregar al pedido
                  </button>
                </div>
              </div>
            )}

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

            {/* Buscador */}
            <input
              style={{ ...sty.input, marginBottom: 10 }}
              placeholder="Buscar producto por nombre..."
              value={busquedaProd}
              onChange={(e) => setBusquedaProd(e.target.value)}
            />

            {/* Grid de productos */}
            {!mostrarProductos ? (
              <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 20px', fontSize: 14 }}>
                Selecciona una categoría o escribe el nombre de un producto
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
                {productosFiltrados.map((p) => {
                  const unidades = carrito.filter((c) => c.id_producto === p.id_producto).reduce((s, c) => s + c.cantidad, 0);
                  return (
                    <div key={p.id_producto} style={{
                      border: `2px solid ${unidades > 0 ? '#CA0B0B' : '#e5e7eb'}`,
                      borderRadius: 10, padding: '10px 12px', background: unidades > 0 ? '#fff5f5' : '#fff',
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    }} onClick={() => clickProducto(p)}>
                      {p.img ? (
                        <img src={imgCl(p.img, 80, 80)} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#aaa', flexShrink: 0 }}>
                          {(p.nombre || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>${Number(p.precio).toLocaleString('es-CO')}</div>
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: unidades > 0 ? '#CA0B0B' : '#f0f0f0', color: unidades > 0 ? '#fff' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: unidades > 0 ? 12 : 16, flexShrink: 0 }}>
                        {unidades > 0 ? unidades : '+'}
                      </div>
                    </div>
                  );
                })}
                {productosFiltrados.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888', fontSize: 13, padding: '20px 0' }}>No hay productos</div>
                )}
              </div>
            )}

            {/* Carrito */}
            {carrito.length > 0 && (
              <div className="carrito-lista" style={{ marginTop: 12 }}>
                <p style={{ ...sty.sec, marginTop: 0 }}>Pedido ({carrito.reduce((s, i) => s + i.cantidad, 0)} unidades)</p>
                {carrito.map((item) => {
                  const precioUnit = calcularPrecioItem(item);
                  const subtotalItem = precioUnit * item.cantidad;
                  return (
                    <div key={item.lineaId} className="carrito-item">
                      <div className="carrito-item-header">
                        <span className="carrito-item-nombre">{item.nombre}</span>
                        <div className="carrito-item-controles">
                          <button className="btn-cantidad" onClick={() => cambiarCantidad(item.lineaId, item.cantidad - 1)}>−</button>
                          <span className="carrito-cantidad">{item.cantidad}</span>
                          <button className="btn-cantidad" onClick={() => cambiarCantidad(item.lineaId, item.cantidad + 1)}>+</button>
                          <button className="btn-accion eliminar" style={{ marginLeft: 6 }} onClick={() => quitarProducto(item.lineaId)}>
                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </div>
                      {item.chocolate && <span style={{ background: item.chocolate==='Negro' ? '#1e3a5f' : '#f0f0f0', color: item.chocolate==='Negro' ? '#fff' : '#555', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, display: 'inline-block', marginTop: 2 }}>Chocolate {item.chocolate}</span>}
                      {item.toppings?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {item.toppings.map((t) => (
                            <span key={t.id_topping} style={{ background: '#1a1a1a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                              {t.nombre}{t.cantidad > 1 ? ` ×${t.cantidad}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.adiciones?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                          {item.adiciones.map((a) => (
                            <span key={a.id_adicion} style={{ background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                              +{a.nombre}{a.cantidad > 1 ? ` ×${a.cantidad}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                        ${precioUnit.toLocaleString('es-CO')} c/u → <strong style={{ color: '#16a34a' }}>${subtotalItem.toLocaleString('es-CO')}</strong>
                      </div>
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
              {carrito.map((item) => (
                <div key={item.lineaId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', padding: '2px 0' }}>
                  <span>{item.cantidad}× {item.nombre}{item.chocolate ? ` (Chocolate ${item.chocolate})` : ''}</span>
                  <span>${(calcularPrecioItem(item) * item.cantidad).toLocaleString('es-CO')}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: '#16a34a', marginTop: 6, borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>
                <span>Total a cobrar</span>
                <span>${total.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <p style={sty.sec}>Método de pago</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { id: 'efectivo',      label: 'Efectivo',                Icon: Banknote   },
                { id: 'transferencia', label: 'Transferencia',            Icon: Smartphone },
                { id: 'mixto',         label: 'Efectivo + Transferencia', Icon: Zap        },
              ].map((m) => (
                <button key={m.id} type="button" style={{ ...sty.btn(metodoPago === m.id), display:'flex', alignItems:'center', gap:5 }} onClick={() => cambiarMetodoPago(m.id)}><m.Icon size={13}/>{m.label}</button>
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

function IcoWhatsApp() {
  return (
    <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
      <path d="M16 0C7.164 0 0 7.163 0 16c0 2.822.737 5.469 2.027 7.773L0 32l8.427-2.007A15.93 15.93 0 0 0 16 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.773-1.853l-.485-.289-5.003 1.193 1.24-4.858-.317-.499A13.233 13.233 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.398-.2-2.355-1.162-2.72-1.294-.365-.133-.631-.2-.897.2-.265.398-1.03 1.294-1.263 1.56-.232.265-.465.299-.863.1-.398-.2-1.682-.62-3.204-1.977-1.184-1.057-1.984-2.362-2.216-2.76-.232-.398-.025-.613.174-.812.179-.178.398-.465.597-.697.2-.232.265-.398.398-.664.133-.265.066-.498-.033-.697-.1-.2-.897-2.163-1.229-2.96-.324-.778-.653-.672-.897-.684l-.764-.013c-.265 0-.697.1-1.063.498-.365.398-1.394 1.362-1.394 3.325 0 1.962 1.427 3.858 1.626 4.123.2.265 2.808 4.287 6.804 6.013.951.41 1.693.655 2.272.839.954.304 1.823.261 2.51.158.766-.114 2.355-.963 2.687-1.893.332-.93.332-1.727.232-1.893-.099-.166-.365-.265-.763-.465z"/>
    </svg>
  );
}

function ModalDetalle({ open, onClose, venta }) {
  const [lightbox, setLightbox] = useState(false);
  if (!open || !venta) return null;
  const est      = colorEstado(venta.estado);
  const metBadge = venta.metodo_pago ? (METODO_BADGE[venta.metodo_pago] || { bg: '#f5f5f5', color: '#888', label: venta.metodo_pago }) : null;
  const tel      = (venta.telefono_cliente || '').replace(/\D/g, '');
  const wppMsg   = encodeURIComponent(`Hola ${venta.cliente}, tu pedido #${venta.id_venta} de ChocoFreseo ya está confirmado y en preparación 🍫🍦`);
  const wpp      = tel ? `https://wa.me/57${tel}?text=${wppMsg}` : null;
  const subtotalProductos = (venta.detalleVentas || []).reduce((a, d) => {
    const adicsTotal = (d.detalleAdiciones || []).reduce((s, ad) => s + Number(ad.subtotal || 0), 0);
    return a + Number(d.subtotal || 0) + adicsTotal;
  }, 0);

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
                {venta.detalleVentas.map((d, i) => {
                  const { precioBase, toppingExtra, adicsTotal, totalItem, precioUnit, cantidad } = calcularDesglose(d);
                  return (
                  <div key={i} style={{ background: '#fafafa', borderRadius: 8, padding: '10px 12px', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{cantidad}× {d.producto?.nombre || '—'}</span>
                      <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 13 }}>${totalItem.toLocaleString('es-CO')}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                      ${precioBase.toLocaleString('es-CO')} base
                      {toppingExtra > 0 && <span style={{ color: '#CA0B0B' }}> + ${toppingExtra.toLocaleString('es-CO')} toppings</span>}
                      {adicsTotal  > 0 && <span style={{ color: '#d97706' }}> + ${adicsTotal.toLocaleString('es-CO')} adiciones</span>}
                      {cantidad    > 1 && <span> × {cantidad}</span>}
                    </div>
                    {d.chocolate && (
                      <span style={{ background: d.chocolate==='Negro' ? '#1e3a5f' : '#f0f0f0', color: d.chocolate==='Negro' ? '#fff' : '#555', fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 600, display: 'inline-block', marginTop: 4 }}>
                        Chocolate {d.chocolate}
                      </span>
                    )}
                    {(d.detalleToppings?.length > 0 || d.detalleAdiciones?.length > 0) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                        {d.detalleToppings?.map((t) => (
                          <span key={t.id_detalle_topping} style={{ background: '#1a1a1a', color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                            {t.topping?.nombre}{t.cantidad > 1 ? ` ×${t.cantidad}` : ''}
                          </span>
                        ))}
                        {d.detalleAdiciones?.map((a) => (
                          <span key={a.id_detalle_adicion} style={{ background: '#d97706', color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                            +{a.adicion?.nombre}{a.cantidad > 1 ? ` ×${a.cantidad}` : ''}
                            {a.cantidad > 1 ? ` =$${(Number(a.precio_unitario || 0) * a.cantidad).toLocaleString('es-CO')}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })}
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
                <span style={{ background: metBadge.bg, color: metBadge.color, fontWeight: 700, fontSize: 12, padding: '3px 12px', borderRadius: 20, display:'inline-flex', alignItems:'center', gap:4 }}>{metBadge.Icon && <metBadge.Icon size={12}/>}{metBadge.label}</span>
              </div>
            )}
            {venta.metodo_pago === 'mixto' && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#f5f3ff', borderRadius: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#555', display:'flex', alignItems:'center', gap:4 }}><Banknote size={13}/>Efectivo</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>${Number(venta.monto_efectivo || 0).toLocaleString('es-CO')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555', display:'flex', alignItems:'center', gap:4 }}><Smartphone size={13}/>Transferencia</span>
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

          <div className="modal-pie" style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            {wpp && (
              <a href={wpp} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#25D366', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', fontFamily: 'inherit' }}>
                <IcoWhatsApp /> WhatsApp
              </a>
            )}
            <button className="btn-primario" onClick={onClose} style={{ flex: 1 }}>Cerrar</button>
          </div>
        </div>
      </div>
    </>
  );
}

function ModalEditarVenta({ open, onClose, onGuardar, venta, productosData = [], toppingsData = [], adicionesData = [], categoriasData = [] }) {
  const [carrito, setCarrito] = useState([]);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoEfectivo, setMontoEfectivo] = useState(0);
  const [montoTransfer, setMontoTransfer] = useState(0);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [productoConfigurar, setProductoConfigurar] = useState(null);
  const [toppingsTemp, setToppingsTemp] = useState([]);
  const [adicionesTemp, setAdicionesTemp] = useState([]);
  const [chocolateTemp, setChocolateTemp] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busquedaProd, setBusquedaProd] = useState('');

  useEffect(() => {
    if (!open || !venta) return;
    setCostoEnvio(Number(venta.costo_domicilio || 0));
    setMetodoPago(venta.metodo_pago || 'efectivo');
    setMontoEfectivo(Number(venta.monto_efectivo || 0));
    setMontoTransfer(Number(venta.monto_transferencia || 0));
    setIntentoGuardar(false);
    setCarrito((venta.detalleVentas || []).map((d) => ({
      lineaId: d.id_detalle_venta,
      id_producto: d.id_producto,
      nombre: d.producto?.nombre || '—',
      // precio_unitario ya incluye topping extra — NO usar calcularPrecioItem para el total
      precio: Number(d.precio_unitario || 0),
      max_toppings: d.producto?.max_toppings || 0,
      cantidad: d.cantidad,
      toppings: (d.detalleToppings || []).map((t) => ({ id_topping: t.id_topping, nombre: t.topping?.nombre || '', cantidad: t.cantidad || 1 })),
      adiciones: (d.detalleAdiciones || []).map((a) => ({ id_adicion: a.id_adicion, nombre: a.adicion?.nombre || '', precio: Number(a.precio_unitario || 0), cantidad: a.cantidad || 1 })),
      chocolate: d.chocolate || null,
    })));
  }, [open, venta]);

  if (!open || !venta) return null;

  const productosActivos  = productosData.filter((p) => p.estado === 1);
  const toppingsActivos   = toppingsData.filter((t) => t.estado === 1);
  const adicionesActivas  = adicionesData.filter((a) => a.estado === 1);
  const categoriasActivas = categoriasData.filter((c) => c.estado === 1);
  const productosFiltrados = productosActivos.filter((p) => {
    if (busquedaProd) return p.nombre.toLowerCase().includes(busquedaProd.toLowerCase());
    return !filtroCategoria || p.id_categoria === Number(filtroCategoria);
  });
  const mostrarProductos = filtroCategoria !== '' || busquedaProd.trim().length > 0;

  // Fórmula: (precio_unitario + adicionPerUnit) × cantidad  — igual que el carrito del catálogo
  const calcItemEdit = (item) => {
    const adicionTotal = (item.adiciones || []).reduce((s, a) => s + Number(a.precio || 0) * (a.cantidad || 1), 0);
    return (Number(item.precio) + adicionTotal) * item.cantidad;
  };
  const total = carrito.reduce((s, i) => s + calcItemEdit(i), 0) + Number(costoEnvio || 0);

  const cambiarCantidadEdit = (lineaId, cant) => {
    if (cant < 1) { setCarrito((p) => p.filter((x) => x.lineaId !== lineaId)); return; }
    setCarrito((p) => p.map((x) => x.lineaId === lineaId ? { ...x, cantidad: cant } : x));
  };

  const agregarToppingTmp = (t) => setToppingsTemp((p) => [...p, { ...t, cantidad: 1 }]);
  const ajustarToppingTmp = (id, delta) => setToppingsTemp((p) => p.map((t) => t.id_topping === id ? { ...t, cantidad: t.cantidad + delta } : t).filter((t) => t.cantidad > 0));
  const agregarAdicionTmp = (a) => setAdicionesTemp((p) => [...p, { ...a, precio: Number(a.precio), cantidad: 1 }]);
  const ajustarAdicionTmp = (id, delta) => setAdicionesTemp((p) => p.map((a) => a.id_adicion === id ? { ...a, cantidad: a.cantidad + delta } : a).filter((a) => a.cantidad > 0));

  const agregarAlCarritoEdit = (prod) => {
    const totalTop = toppingsTemp.reduce((s, t) => s + (t.cantidad || 1), 0);
    const toppingExtra = Math.max(0, totalTop - (prod.max_toppings || 0)) * 2000;
    setCarrito((prev) => [...prev, {
      lineaId: Date.now() + Math.random(),
      id_producto: prod.id_producto, nombre: prod.nombre, precio: Number(prod.precio) + toppingExtra,
      max_toppings: prod.max_toppings || 0, cantidad: 1,
      toppings: toppingsTemp, adiciones: adicionesTemp,
      chocolate: chocolateTemp || null,
    }]);
    setProductoConfigurar(null); setToppingsTemp([]); setAdicionesTemp([]); setChocolateTemp(''); setBusquedaProd('');
  };

  const sty = {
    input: { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    chipB: { background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', fontSize: 14, fontWeight: 800 },
  };

  const esEntregada = venta.estado === 'entregado';

  // Si está entregada: solo mostrar sección de método de pago
  if (esEntregada) {
    const mixtoOk = metodoPago !== 'mixto' || (montoEfectivo > 0 && montoTransfer > 0 && Math.abs(montoEfectivo + montoTransfer - total) < 1);
    return (
      <div className="modal-overlay">
        <div className="modal-caja" style={{ width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="modal-encabezado">
            <span className="modal-titulo">Cambiar método de pago — #{venta.id_venta}</span>
            <button className="modal-cerrar" onClick={onClose}>✕</button>
          </div>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e', display:'flex', alignItems:'center', gap:8 }}>
            <AlertTriangle size={15} /><span>Este pedido ya fue entregado. Solo puedes cambiar el método de pago.</span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 8, display: 'block' }}>Método de pago</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['efectivo', 'transferencia', 'mixto'].map((m) => (
                <button key={m} type="button" onClick={() => {
                  setMetodoPago(m); setIntentoGuardar(false);
                  if (m === 'efectivo')      { setMontoEfectivo(total); setMontoTransfer(0); }
                  if (m === 'transferencia') { setMontoTransfer(total); setMontoEfectivo(0); }
                  if (m === 'mixto')         { setMontoEfectivo(0); setMontoTransfer(0); }
                }} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', border: metodoPago === m ? '2px solid #CA0B0B' : '1px solid #e5e7eb', background: metodoPago === m ? '#fff5f5' : '#fff', color: metodoPago === m ? '#CA0B0B' : '#555' }}>
                  {m === 'efectivo' ? <><Banknote size={13} style={{marginRight:4}}/>Efectivo</> : m === 'transferencia' ? <><Smartphone size={13} style={{marginRight:4}}/>Transferencia</> : <><Zap size={13} style={{marginRight:4}}/>Mixto</>}
                </button>
              ))}
            </div>
            {metodoPago === 'mixto' && (() => {
              const suma = montoEfectivo + montoTransfer;
              const ok = montoEfectivo > 0 && montoTransfer > 0 && Math.abs(suma - total) < 1;
              return (
                <>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: '#888', display: 'flex', alignItems:'center', gap:4, marginBottom: 3 }}><Banknote size={12}/>Efectivo *</label>
                      <input type="number" min="0" value={montoEfectivo || ''} placeholder="0"
                        onChange={(e) => { setMontoEfectivo(Number(e.target.value) || 0); setMontoTransfer(Math.max(0, total - (Number(e.target.value) || 0))); }}
                        style={{ width: '100%', padding: '6px 10px', border: `1px solid ${intentoGuardar && montoEfectivo <= 0 ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: '#888', display: 'flex', alignItems:'center', gap:4, marginBottom: 3 }}><Smartphone size={12}/>Transferencia *</label>
                      <input type="number" min="0" value={montoTransfer || ''} placeholder="0"
                        onChange={(e) => { setMontoTransfer(Number(e.target.value) || 0); setMontoEfectivo(Math.max(0, total - (Number(e.target.value) || 0))); }}
                        style={{ width: '100%', padding: '6px 10px', border: `1px solid ${intentoGuardar && montoTransfer <= 0 ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: ok ? '#f0fdf4' : (intentoGuardar ? '#fff5f5' : '#f9f9f9'), border: `1px solid ${ok ? '#bbf7d0' : (intentoGuardar ? '#fecaca' : '#e5e7eb')}`, color: ok ? '#166534' : '#CA0B0B', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{display:'flex',alignItems:'center',gap:4}}>{ok ? <><Check size={12}/>Los montos cuadran</> : intentoGuardar ? <><AlertTriangle size={12}/>Revisa los montos</> : `Total: $${total.toLocaleString('es-CO')}`}</span>
                    <span>${suma.toLocaleString('es-CO')} / ${total.toLocaleString('es-CO')}</span>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="modal-pie">
            <button className="btn-secundario" onClick={onClose}>Cancelar</button>
            <button className="btn-primario" onClick={() => {
              if (metodoPago === 'mixto' && !mixtoOk) { setIntentoGuardar(true); return; }
              onGuardar({ items: carrito, costo_domicilio: costoEnvio, metodo_pago: metodoPago, monto_efectivo: metodoPago === 'efectivo' ? total : (metodoPago === 'mixto' ? montoEfectivo : 0), monto_transferencia: metodoPago === 'transferencia' ? total : (metodoPago === 'mixto' ? montoTransfer : 0) });
            }}><Check size={14} style={{display:'inline',verticalAlign:'middle',marginRight:5}}/>Guardar método de pago</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-caja" style={{ width: 700, maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-encabezado">
          <span className="modal-titulo">Editar venta #{venta.id_venta}</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>

        {/* Productos actuales */}
        <p style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a', marginBottom: 8 }}>Productos del pedido</p>
        {carrito.length === 0 && <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>No hay productos. Agrega al menos uno.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {carrito.map((item) => (
            <div key={item.lineaId} style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{item.nombre}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button style={{ ...sty.chipB, color: '#555', fontSize: 16 }} onClick={() => cambiarCantidadEdit(item.lineaId, item.cantidad - 1)}>−</button>
                  <span style={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{item.cantidad}</span>
                  <button style={{ ...sty.chipB, color: '#555', fontSize: 16 }} onClick={() => cambiarCantidadEdit(item.lineaId, item.cantidad + 1)}>+</button>
                  <button onClick={() => setCarrito((p) => p.filter((x) => x.lineaId !== item.lineaId))}
                    style={{ background: '#fee2e2', color: '#CA0B0B', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>🗑</button>
                </div>
              </div>
              {item.chocolate && <span style={{ background: item.chocolate==='Negro' ? '#1e3a5f' : '#f0f0f0', color: item.chocolate==='Negro' ? '#fff' : '#555', fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 600, display: 'inline-block', marginTop: 3 }}>Chocolate {item.chocolate}</span>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {item.toppings?.map((t) => <span key={t.id_topping} style={{ background: '#1a1a1a', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{t.nombre}{t.cantidad > 1 ? ` ×${t.cantidad}` : ''}</span>)}
                {item.adiciones?.map((a) => <span key={a.id_adicion} style={{ background: '#d97706', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>+{a.nombre}{a.cantidad > 1 ? ` ×${a.cantidad}` : ''}</span>)}
              </div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                ${Number(item.precio).toLocaleString('es-CO')} c/u → <strong style={{ color: '#16a34a' }}>${calcItemEdit(item).toLocaleString('es-CO')}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* Agregar producto */}
        <p style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a', marginBottom: 8 }}>Agregar producto</p>
        <div style={{ position: 'relative' }}>
          {productoConfigurar && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
              <div style={{ background: '#fff', borderRadius: 12, width: '92%', maxHeight: '80%', overflowY: 'auto', padding: '18px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>Configurar {productoConfigurar.nombre}</span>
                  <button onClick={() => setProductoConfigurar(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>
                {(productoConfigurar.permite_chocolate === true || productoConfigurar.permite_chocolate === 1) && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>🍫 Chocolate</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['Negro', 'Blanco'].map((t) => (
                        <button key={t} onClick={() => setChocolateTemp(t)} style={{ flex: 1, padding: '7px', borderRadius: 8, fontFamily: 'inherit', border: `2px solid ${chocolateTemp === t ? '#CA0B0B' : '#e5e7eb'}`, background: chocolateTemp === t ? '#fff5f5' : '#fff', color: chocolateTemp === t ? '#CA0B0B' : '#555', fontWeight: chocolateTemp === t ? 700 : 400, cursor: 'pointer', fontSize: 12 }}>
                          {t === 'Negro' ? '🍫' : '⬜'} {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {productoConfigurar.permite_toppings === 1 && toppingsActivos.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>Toppings</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {toppingsActivos.map((t) => {
                        const en = toppingsTemp.find((x) => x.id_topping === t.id_topping);
                        const cb = { background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', fontSize: 14, fontWeight: 800, color: '#fff' };
                        return en ? (
                          <div key={t.id_topping} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', color: '#fff', borderRadius: 8, padding: '5px 10px' }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{t.nombre}</span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <button style={cb} onClick={() => ajustarToppingTmp(t.id_topping, -1)}>−</button>
                              <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 800 }}>{en.cantidad}</span>
                              <button style={cb} onClick={() => ajustarToppingTmp(t.id_topping, 1)}>+</button>
                              <button style={{ ...cb, color: '#f87171' }} onClick={() => ajustarToppingTmp(t.id_topping, -en.cantidad)}>×</button>
                            </div>
                          </div>
                        ) : (
                          <button key={t.id_topping} onClick={() => agregarToppingTmp(t)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}>
                            <span style={{ fontSize: 12 }}>{t.nombre}</span><span style={{ fontWeight: 800 }}>+</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {adicionesActivas.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>Adiciones</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {adicionesActivas.map((a) => {
                        const en = adicionesTemp.find((x) => x.id_adicion === a.id_adicion);
                        const cb = { background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', fontSize: 14, fontWeight: 800, color: '#fff' };
                        return en ? (
                          <div key={a.id_adicion} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#d97706', color: '#fff', borderRadius: 8, padding: '5px 10px' }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{a.nombre}</span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <button style={cb} onClick={() => ajustarAdicionTmp(a.id_adicion, -1)}>−</button>
                              <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 800 }}>{en.cantidad}</span>
                              <button style={cb} onClick={() => ajustarAdicionTmp(a.id_adicion, 1)}>+</button>
                              <button style={{ ...cb, color: 'rgba(255,255,255,0.7)' }} onClick={() => ajustarAdicionTmp(a.id_adicion, -en.cantidad)}>×</button>
                            </div>
                          </div>
                        ) : (
                          <button key={a.id_adicion} onClick={() => agregarAdicionTmp(a)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid #d97706', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}>
                            <span style={{ fontSize: 12 }}>{a.nombre}</span><span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>+${Number(a.precio).toLocaleString('es-CO')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button onClick={() => agregarAlCarritoEdit(productoConfigurar)}
                  style={{ width: '100%', padding: 10, background: '#CA0B0B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Agregar al pedido
                </button>
              </div>
            </div>
          )}

          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value ? Number(e.target.value) : '')}
            style={{ ...sty.input, marginBottom: 8 }}>
            <option value="">Seleccionar categoría...</option>
            {categoriasActivas.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
          </select>
          <input style={{ ...sty.input, marginBottom: 8 }} placeholder="Buscar producto..." value={busquedaProd} onChange={(e) => setBusquedaProd(e.target.value)} />
          {mostrarProductos && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 200, overflowY: 'auto', marginBottom: 8 }}>
              {productosFiltrados.map((p) => (
                <div key={p.id_producto} onClick={() => setProductoConfigurar(p)}
                  style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', background: '#fff', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a1a' }}>{p.nombre}</div>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>${Number(p.precio).toLocaleString('es-CO')}</div>
                  </div>
                  <span style={{ fontWeight: 800, color: '#CA0B0B' }}>+</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Costo domicilio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0', padding: '10px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>Costo domicilio $</label>
          <input type="number" value={costoEnvio} onChange={(e) => setCostoEnvio(Number(e.target.value) || 0)}
            style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: 'inherit' }} />
        </div>

        {/* Método de pago */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 8, display: 'block' }}>Método de pago</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['efectivo', 'transferencia', 'mixto'].map((m) => (
              <button key={m} type="button" onClick={() => {
                setMetodoPago(m);
                if (m === 'efectivo')      { setMontoEfectivo(total); setMontoTransfer(0); }
                if (m === 'transferencia') { setMontoTransfer(total); setMontoEfectivo(0); }
                if (m === 'mixto')         { setMontoEfectivo(0); setMontoTransfer(0); }
              }} style={{
                flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                border: metodoPago === m ? '2px solid #CA0B0B' : '1px solid #e5e7eb',
                background: metodoPago === m ? '#fff5f5' : '#fff',
                color: metodoPago === m ? '#CA0B0B' : '#555',
              }}>
                {m === 'efectivo' ? <><Banknote size={13} style={{marginRight:4}}/>Efectivo</> : m === 'transferencia' ? <><Smartphone size={13} style={{marginRight:4}}/>Transferencia</> : <><Zap size={13} style={{marginRight:4}}/>Mixto</>}
              </button>
            ))}
          </div>

          {metodoPago === 'mixto' && (() => {
            const sumaMixto = montoEfectivo + montoTransfer;
            const sumaCubre = Math.abs(sumaMixto - total) < 1;
            const ambosPositivos = montoEfectivo > 0 && montoTransfer > 0;
            const mixtoOk = ambosPositivos && sumaCubre;
            const mostrarError = intentoGuardar && !mixtoOk;
            const bordeEf = (intentoGuardar && montoEfectivo <= 0) ? '#fca5a5' : '#e5e7eb';
            const bordeTr = (intentoGuardar && montoTransfer <= 0) ? '#fca5a5' : '#e5e7eb';
            return (
              <>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#888', display: 'flex', alignItems:'center', gap:4, marginBottom: 3 }}>
                      <Banknote size={12}/>Efectivo <span style={{ color: '#CA0B0B' }}>*</span>
                    </label>
                    <input
                      type="number" min="0"
                      value={montoEfectivo || ''}
                      placeholder="0"
                      onChange={(e) => {
                        const ef = Number(e.target.value) || 0;
                        setMontoEfectivo(ef);
                        setMontoTransfer(Math.max(0, total - ef));
                      }}
                      style={{ width: '100%', padding: '6px 10px', border: `1px solid ${bordeEf}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#888', display: 'flex', alignItems:'center', gap:4, marginBottom: 3 }}>
                      <Smartphone size={12}/>Transferencia <span style={{ color: '#CA0B0B' }}>*</span>
                    </label>
                    <input
                      type="number" min="0"
                      value={montoTransfer || ''}
                      placeholder="0"
                      onChange={(e) => {
                        const tr = Number(e.target.value) || 0;
                        setMontoTransfer(tr);
                        setMontoEfectivo(Math.max(0, total - tr));
                      }}
                      style={{ width: '100%', padding: '6px 10px', border: `1px solid ${bordeTr}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                {/* Indicador: verde cuando cuadra, rojo solo si ya intentó guardar */}
                {mixtoOk ? (
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{display:'flex',alignItems:'center',gap:4}}><Check size={12}/>Los montos cuadran</span>
                    <span>${sumaMixto.toLocaleString('es-CO')} / ${total.toLocaleString('es-CO')}</span>
                  </div>
                ) : mostrarError ? (
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: '#fff5f5', border: '1px solid #fecaca', color: '#CA0B0B', display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <AlertTriangle size={12} style={{marginRight:4}}/>
                      {!ambosPositivos
                        ? 'Ambos montos deben ser mayores a $0'
                        : `Faltan / sobran $${Math.abs(sumaMixto - total).toLocaleString('es-CO')}`
                      }
                    </span>
                    <span>${sumaMixto.toLocaleString('es-CO')} / ${total.toLocaleString('es-CO')}</span>
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, color: '#16a34a', padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 16 }}>
          <span>Total</span><span>${total.toLocaleString('es-CO')}</span>
        </div>

        <div className="modal-pie">
          <button className="btn-secundario" onClick={onClose}>Cancelar</button>
          <button className="btn-primario"
            disabled={carrito.length === 0}
            onClick={() => {
              if (metodoPago === 'mixto') {
                const suma = montoEfectivo + montoTransfer;
                if (montoEfectivo <= 0 || montoTransfer <= 0 || Math.abs(suma - total) >= 1) {
                  setIntentoGuardar(true);
                  return;
                }
              }
              onGuardar({
                items: carrito,
                costo_domicilio: costoEnvio,
                metodo_pago: metodoPago,
                monto_efectivo:      metodoPago === 'efectivo'      ? total : (metodoPago === 'mixto' ? montoEfectivo : 0),
                monto_transferencia: metodoPago === 'transferencia' ? total : (metodoPago === 'mixto' ? montoTransfer : 0),
              });
            }}>
            <Check size={14} style={{display:'inline',verticalAlign:'middle',marginRight:5}}/>Guardar cambios
          </button>
        </div>
      </div>
    </div>
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
          ¿Devolver la venta <strong>#{venta.id_venta}</strong> al domiciliario para facturar de nuevo?
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
        <div className="modal-icono-grande"><AlertTriangle size={40} color="#f59e0b"/></div>
        <p className="modal-texto-confirmar">¿Anular la venta <strong>#{venta.id_venta}</strong>?</p>
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
  const [editandoVenta,  setEditandoVenta] = useState(null);
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
      id_producto:  item.id_producto,
      cantidad:     item.cantidad,
      max_toppings: item.max_toppings || 0,
      toppings:     (item.toppings  || []).map((t) => ({ id_topping: t.id_topping, cantidad: t.cantidad || 1 })),
      adiciones:    (item.adiciones || []).map((a) => ({ id_adicion: a.id_adicion, cantidad: a.cantidad || 1 })),
      chocolate:    item.chocolate || null,
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

    try { await api.crearVenta(payload); toast.success('¡Venta creada correctamente!'); }
    catch (err) { toast.error(err?.response?.data?.message || 'Error al crear la venta'); return; }
    cargar(); setModalCrear(false);
  };

  const handleEditarVenta = async (f) => {
    const items = f.items.map((item) => ({
      id_producto:  item.id_producto,
      cantidad:     item.cantidad,
      max_toppings: item.max_toppings || 0,
      toppings:     (item.toppings || []).map((t) => ({ id_topping: t.id_topping, cantidad: t.cantidad || 1 })),
      adiciones:    (item.adiciones || []).map((a) => ({ id_adicion: a.id_adicion, cantidad: a.cantidad || 1 })),
      chocolate:    item.chocolate || null,
    }));
    try {
      await api.editarVenta(editandoVenta.id_venta, {
        items,
        costo_domicilio:     f.costo_domicilio,
        metodo_pago:         f.metodo_pago,
        monto_efectivo:      f.monto_efectivo,
        monto_transferencia: f.monto_transferencia,
      });
    }
    catch (err) { toast.error(err?.response?.data?.message || 'Error al editar la venta'); return; }
    toast.success('¡Venta actualizada!'); cargar(); setEditandoVenta(null);
  };

  const cambiarEstado = async ({ estado: est, motivo }) => {
    try {
      const payload = { nombre_estado: est };
      if (est === 'anulado' && motivo) payload.motivo_anulacion = motivo;
      await api.cambiarEstadoVenta(cambiandoEst.id_venta, payload);
    } catch (err) { toast.error(err?.response?.data?.message || 'Error al cambiar estado'); }
    cargar(); setCambiandoEst(null);
  };

  const devolverVenta = async () => {
    try { await api.cambiarEstadoVenta(devolviendo.id_venta, { nombre_estado: 'despachado' }); }
    catch (err) { toast.error(err?.response?.data?.message || 'Error al devolver venta'); }
    cargar(); setDevolviendo(null);
  };

  const anularVenta = async (mot) => {
    try { await api.anularVenta(anulando.id_venta, { motivo_anulacion: mot }); }
    catch (err) { toast.error(err?.response?.data?.message || 'Error al anular venta'); cargar(); setAnulando(null); return; }
    toast.success('Venta anulada'); cargar(); setAnulando(null);
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
          { key: 'todos',         label: 'Todos',          Icon: null       },
          { key: 'efectivo',      label: 'Efectivo',       Icon: Banknote   },
          { key: 'transferencia', label: 'Transferencia',  Icon: Smartphone },
          { key: 'mixto',         label: 'Mixto',          Icon: Zap        },
        ].map((m) => (
          <button key={m.key} onClick={() => setFiltroMetodo(m.key)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', display:'flex', alignItems:'center', gap:4,
            border: filtroMetodo === m.key ? 'none' : '1px solid #e0e0e0',
            background: filtroMetodo === m.key ? '#CA0B0B' : '#f5f5f5',
            color: filtroMetodo === m.key ? '#fff' : '#555',
            fontWeight: filtroMetodo === m.key ? 700 : 400,
          }}>{m.Icon && <m.Icon size={12}/>}{m.label}</button>
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
                        <button className="btn-accion ver"     onClick={() => setDetalle(v)}       title="Ver detalle"><Eye size={14} /></button>
                        {tienePermiso('gestionar_ventas') && v.estado !== 'anulado' && (
                          <button className="btn-accion editar" onClick={() => setEditandoVenta(v)}
                            title={v.estado === 'entregado' ? 'Cambiar método de pago' : 'Editar venta'}>
                            <Edit size={14} />
                          </button>
                        )}
                        {tienePermiso('cambiar_estado_venta') && (
                          <button className="btn-accion" style={{ background: '#eff6ff', color: '#3b82f6' }} onClick={() => setCambiandoEst(v)} title="Cambiar estado"><Check size={14} /></button>
                        )}
                        <button className="btn-accion permisos" onClick={() => generarComprobante(v)} title="Generar comprobante"><FileText size={14} /></button>
                        {v.estado === 'entregado' && (
                          <button className="btn-accion" style={{ background: '#fef3c7', color: '#ca8a04' }} onClick={() => setDevolviendo(v)} title="Devolver al domiciliario"><RotateCcw size={14} /></button>
                        )}
                        {tienePermiso('anular_venta') && v.estado !== 'anulado' && v.estado !== 'entregado' && v.estado !== 'despachado' && (
                          <button className="btn-accion eliminar" onClick={() => setAnulando(v)} title="Anular venta"><X size={14} /></button>
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
      <ModalEditarVenta open={!!editandoVenta} onClose={() => setEditandoVenta(null)} onGuardar={handleEditarVenta}
        venta={editandoVenta} productosData={productosData} toppingsData={toppingsData}
        adicionesData={adicionesData} categoriasData={categoriasData} />
      <ModalDetalle    open={!!detalle}       onClose={() => setDetalle(null)}       venta={detalle} />
      <ModalEstado     open={!!cambiandoEst}  onClose={() => setCambiandoEst(null)} onGuardar={cambiarEstado} venta={cambiandoEst} />
      <ModalAnular     open={!!anulando}      onClose={() => setAnulando(null)}      onConfirmar={anularVenta} venta={anulando} />
      <ModalDevolver   open={!!devolviendo}   onClose={() => setDevolviendo(null)}   onConfirmar={devolverVenta} venta={devolviendo} />
    </AdminLayout>
  );
}
