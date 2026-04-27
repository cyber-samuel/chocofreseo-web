import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import * as api from '../../../services/api';
import './Domicilios.css';

const mapVentaDomi = (v) => ({
  id_venta:     v.id_venta,
  cliente:      v.cliente?.usuario?.nombre || '—',
  telefono:     v.cliente?.telefono || '—',
  direccion:    v.direccion?.direccion_linea || '—',
  barrio:       v.direccion?.barrio  || '—',
  ciudad:       v.direccion?.ciudad  || '—',
  total:        Number(v.total || 0),
  costo_domicilio: Number(v.costo_domicilio || 3000),
  metodo_pago:  v.metodo_pago || (v.pagos?.[0]?.detallePagos?.length > 1 ? 'mixto' : v.pagos?.[0]?.detallePagos?.[0]?.metodoPago?.nombre) || 'efectivo',
  monto_efectivo:      v.pagos?.[0]?.detallePagos?.find((d) => d.metodoPago?.nombre === 'efectivo')?.monto || 0,
  monto_transferencia: v.pagos?.[0]?.detallePagos?.find((d) => d.metodoPago?.nombre === 'transferencia')?.monto || 0,
  comprobante:  v.comprobante_url || v.pagos?.[0]?.detallePagos?.find((d) => d.comprobante)?.comprobante || null,
  fecha:        v.fecha ? new Date(v.fecha).toLocaleString('es-CO') : '—',
  observaciones: v.observaciones || '',
  productos:    (v.detalleVentas || []).map((d) => ({
    nombre:    d.producto?.nombre || '—',
    cantidad:  d.cantidad || 1,
    toppings:  (d.detalleToppings  || d.toppingDetalles || d.toppings  || []).map((t) => t.topping?.nombre  || t.nombre || ''),
    adiciones: (d.detalleAdiciones || d.adicionDetalles  || d.adiciones || []).map((a) => ({
      nombre: a.adicion?.nombre || a.nombre || '',
      precio: Number(a.adicion?.precio || a.precio || 0),
    })),
    subtotal:  Number(d.subtotal || 0),
  })),
});

function IconoOjo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconoWhatsApp({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.528 5.845L.057 23.55a.75.75 0 00.906.98l5.919-1.55A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.587-.5-5.084-1.37l-.363-.217-3.762.985.999-3.648-.235-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

function ModalRechazarRapido({ open, onClose, onConfirmar, pedido }) {
  const [motivo, setMotivo] = useState('');
  if (!open || !pedido) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-caja modal-pequeno">
        <div className="modal-encabezado">
          <span className="modal-titulo">Rechazar pedido</span>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>
        <div className="modal-icono-grande">⚠️</div>
        <p className="modal-texto-confirmar">¿Rechazar el pedido <strong>#V-{String(pedido.id_venta).padStart(4,'0')}</strong>?</p>
        <textarea className="form-input" rows={3} placeholder="Motivo del rechazo..." value={motivo}
          onChange={(e) => setMotivo(e.target.value)} style={{ resize: 'none', marginTop: 12 }} />
        <div className="modal-pie centrado" style={{ marginTop: 16 }}>
          <button className="btn-secundario" onClick={() => { setMotivo(''); onClose(); }}>Cancelar</button>
          <button className="btn-peligro" onClick={() => { if (motivo.trim()) { onConfirmar(motivo); setMotivo(''); } }} disabled={!motivo.trim()}>
            Confirmar rechazo
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalRevision({ open, onClose, onConfirmar, onRechazar, pedido }) {
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [vista,         setVista]         = useState('revision');
  const [lightbox,      setLightbox]      = useState(false);

  if (!open || !pedido) return null;

  const costodomicilio = Number(pedido.costo_domicilio || 3000);
  const subtotal       = Number(pedido.total) - costodomicilio;

  const reset = () => { setMotivoRechazo(''); setVista('revision'); setLightbox(false); };

  if (vista === 'rechazar') {
    return (
      <div className="modal-overlay">
        <div className="modal-caja modal-pequeno">
          <div className="modal-encabezado">
            <span className="modal-titulo">Rechazar pedido</span>
            <button className="modal-cerrar" onClick={() => { reset(); onClose(); }}>✕</button>
          </div>
          <div className="modal-icono-grande">⚠️</div>
          <p className="modal-texto-confirmar">¿Rechazar el pedido <strong>#V-{String(pedido.id_venta).padStart(4,'0')}</strong>?</p>
          <textarea className="form-input" rows={3} placeholder="Motivo del rechazo..." value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)} style={{ resize: 'none', marginTop: 12 }} />
          <div className="modal-pie centrado" style={{ marginTop: 16 }}>
            <button className="btn-secundario" onClick={() => setVista('revision')}>← Volver</button>
            <button className="btn-peligro" onClick={() => { if (motivoRechazo.trim()) { onRechazar(motivoRechazo); reset(); } }} disabled={!motivoRechazo.trim()}>
              Confirmar rechazo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={pedido.comprobante} alt="Comprobante" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}

      <div className="modal-overlay">
        <div className="modal-caja" style={{ width: 580, maxHeight: '92vh', overflowY: 'auto' }}>
          <div className="modal-encabezado">
            <span className="modal-titulo">Revisar pedido #V-{String(pedido.id_venta).padStart(4,'0')}</span>
            <button className="modal-cerrar" onClick={() => { reset(); onClose(); }}>✕</button>
          </div>

          <p className="form-seccion-titulo">Información del cliente</p>
          <div className="revision-grid">
            <div className="revision-item">
              <span className="detalle-label">Cliente</span>
              <span className="detalle-valor">{pedido.cliente}</span>
            </div>
            <div className="revision-item">
              <span className="detalle-label">Teléfono</span>
              <span className="detalle-valor">{pedido.telefono}</span>
            </div>
            <div className="revision-item">
              <span className="detalle-label">Barrio</span>
              <span className="detalle-valor">{pedido.barrio}</span>
            </div>
            <div className="revision-item">
              <span className="detalle-label">Ciudad</span>
              <span className="detalle-valor">{pedido.ciudad}</span>
            </div>
            <div className="revision-item revision-full">
              <span className="detalle-label">Dirección</span>
              <span className="detalle-valor">{pedido.direccion}</span>
            </div>
            {pedido.observaciones && (
              <div className="revision-item revision-full">
                <span className="detalle-label">Observaciones</span>
                <span className="detalle-valor" style={{ color: '#ca8a04' }}>⚠ {pedido.observaciones}</span>
              </div>
            )}
          </div>

          <p className="form-seccion-titulo" style={{ marginTop: 16 }}>Productos del pedido</p>
          <div className="revision-productos">
            {pedido.productos.map((p, i) => (
              <div key={i} className="revision-producto-item">
                <div className="revision-producto-header">
                  <span className="revision-producto-nombre">{p.cantidad}x {p.nombre}</span>
                  <span className="revision-producto-precio">${Number(p.subtotal).toLocaleString()}</span>
                </div>
                {p.toppings.length > 0 && (
                  <div className="revision-extras">
                    <span className="extras-titulo">Toppings:</span>
                    <div className="extras-chips">
                      {p.toppings.map((t) => <span key={t} className="chip activo">{t}</span>)}
                    </div>
                  </div>
                )}
                {p.adiciones.length > 0 && (
                  <div className="revision-extras">
                    <span className="extras-titulo">Adiciones:</span>
                    <div className="extras-chips">
                      {p.adiciones.map((a, ai) => (
                        <span key={ai} className="chip activo">
                          {a.nombre}{a.precio > 0 ? ` +$${Number(a.precio).toLocaleString()}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="revision-total">
              <div className="carrito-resumen-fila"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
              <div className="carrito-resumen-fila"><span>Domicilio</span><span>${costodomicilio.toLocaleString()}</span></div>
              <div className="carrito-resumen-fila total"><span>Total</span><span>${Number(pedido.total).toLocaleString()}</span></div>
            </div>
          </div>

          <p className="form-seccion-titulo" style={{ marginTop: 16 }}>Método de pago</p>
          <div className={`pago-verificacion ${pedido.metodo_pago}`}>
            <div className="pago-verif-icono">
              {pedido.metodo_pago === 'efectivo' ? '💵' : pedido.metodo_pago === 'mixto' ? '⚡' : '📱'}
            </div>
            <div>
              <div className="pago-verif-titulo">
                {pedido.metodo_pago === 'efectivo' ? 'Pago en efectivo' : pedido.metodo_pago === 'mixto' ? 'Efectivo + Transferencia' : 'Transferencia bancaria'}
              </div>
              {pedido.metodo_pago === 'mixto' && (
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  <div>💵 Efectivo: <strong>${Number(pedido.monto_efectivo || 0).toLocaleString()}</strong></div>
                  <div>📱 Transferencia: <strong>${Number(pedido.monto_transferencia || 0).toLocaleString()}</strong></div>
                </div>
              )}
              {(pedido.metodo_pago === 'transferencia' || pedido.metodo_pago === 'mixto') && (
                <div className="pago-verif-sub">
                  {pedido.comprobante
                    ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Comprobante recibido</span>
                    : <span style={{ color: '#CA0B0B', fontWeight: 700 }}>⚠ Sin comprobante — verificar por WhatsApp</span>
                  }
                </div>
              )}
            </div>
          </div>

          {(pedido.metodo_pago === 'transferencia' || pedido.metodo_pago === 'mixto') && (
            <div style={{ marginTop: 16 }}>
              <p className="form-seccion-titulo">Comprobante de pago</p>
              {pedido.comprobante ? (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <img
                    src={pedido.comprobante}
                    alt="Comprobante"
                    onClick={() => setLightbox(true)}
                    style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                  />
                  <div style={{ padding: '8px 12px', background: '#f9fafb', fontSize: 12, color: '#888', textAlign: 'center' }}>
                    Haz clic en la imagen para verla en pantalla completa
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>⚠</span>
                  <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>Sin comprobante — verificar por WhatsApp antes de confirmar</span>
                </div>
              )}
            </div>
          )}

          <div className="modal-pie" style={{ marginTop: 20 }}>
            <button className="btn-rechazar" onClick={() => setVista('rechazar')}>Rechazar pedido</button>
            <button className="btn-primario" onClick={() => { onConfirmar(); reset(); }}>
              ✓ Confirmar — enviar a cocina
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Domicilios() {
  const [lista,            setLista]            = useState([]);
  const [revisando,        setRevisando]        = useState(null);
  const [rechazandoRapido, setRechazandoRapido] = useState(null);
  const [busqueda,         setBusqueda]         = useState('');

  const cargar = () => api.listarVentas('pendiente').then((d) => setLista(d.map(mapVentaDomi))).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const filtrados = lista.filter((d) =>
    (d.cliente || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    String(d.id_venta).includes(busqueda)
  );

  const confirmar = async (pedido) => {
    try { await api.cambiarEstadoVenta(pedido.id_venta, { nombre_estado: 'en_proceso' }); }
    catch (err) { alert(err?.response?.data?.message || 'Error al confirmar pedido'); }
    cargar(); setRevisando(null);
  };

  const rechazar = async (motivo) => {
    const id = (revisando || rechazandoRapido)?.id_venta;
    if (id) {
      try { await api.anularVenta(id, { motivo_anulacion: motivo || 'Rechazado por admin' }); }
      catch (err) { alert(err?.response?.data?.message || 'Error al rechazar pedido'); }
    }
    cargar(); setRevisando(null); setRechazandoRapido(null);
  };

  const urlWpp = (telefono, idVenta) =>
    `https://wa.me/57${telefono}?text=Hola,%20confirmamos%20tu%20pedido%20%23V-${String(idVenta).padStart(4,'0')}%20de%20ChocoFreseo%20🍫`;

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-titulo">Pedidos por confirmar</h1>
          <p className="page-subtitulo">{lista.length} pedidos esperando confirmación</p>
        </div>
        <button
          onClick={cargar}
          style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
          Actualizar pedidos
        </button>
      </div>

      {lista.length === 0 ? (
        <div className="domi-vacio">
          <div className="domi-vacio-icono">🛵</div>
          <div className="domi-vacio-texto">No hay pedidos pendientes por confirmar</div>
          <div className="domi-vacio-sub">Cuando lleguen nuevos pedidos aparecerán aquí</div>
        </div>
      ) : (
        <div>
          <div className="buscador" style={{ marginBottom: 16 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Buscar por cliente o número..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>

          <div className="domi-cards">
            {filtrados.map((d) => (
              <div key={d.id_venta} className="domi-card">
                <div className="domi-card-header">
                  <div>
                    <span className="domi-card-venta">V-{String(d.id_venta).padStart(4,'0')}</span>
                    <span className="domi-card-fecha">{d.fecha}</span>
                  </div>
                  <span className={`domi-pago-badge ${d.metodo_pago}`}>
                    {d.metodo_pago === 'efectivo' ? '💵 Efectivo' : d.metodo_pago === 'mixto' ? '⚡ Mixto' : '📱 Transferencia'}
                  </span>
                </div>

                <div className="domi-card-cliente">
                  <div className="domi-card-nombre">{d.cliente}</div>
                  <div className="domi-card-tel">{d.telefono}</div>
                </div>

                <div className="domi-card-direccion">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {d.direccion}, {d.barrio}
                </div>

                <div className="domi-card-productos">
                  {d.productos.map((p, i) => (
                    <span key={i} className="domi-producto-chip">{p.cantidad}x {p.nombre}</span>
                  ))}
                </div>

                {(d.metodo_pago === 'transferencia' || d.metodo_pago === 'mixto') && !d.comprobante && (
                  <div className="domi-alerta">⚠ Sin comprobante — verificar por WhatsApp antes de confirmar</div>
                )}

                <div className="domi-card-footer">
                  <span className="domi-card-total">${d.total.toLocaleString()}</span>
                  <div className="domi-card-acciones">
                    <a href={urlWpp(d.telefono, d.id_venta)} target="_blank" rel="noopener noreferrer" className="btn-accion btn-wpp" title="Contactar por WhatsApp">
                      <IconoWhatsApp size={17} />
                    </a>
                    <button className="btn-accion btn-rechazar-rapido" onClick={() => setRechazandoRapido(d)} title="Rechazar pedido">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    </button>
                    <button className="btn-accion btn-confirmar-rapido" onClick={() => confirmar(d)} title="Confirmar pedido">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button className="btn-accion btn-ver" onClick={() => setRevisando(d)} title="Ver detalle">
                      <IconoOjo />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ModalRevision
        open={!!revisando}
        onClose={() => setRevisando(null)}
        onConfirmar={() => confirmar(revisando)}
        onRechazar={rechazar}
        pedido={revisando}
      />
      <ModalRechazarRapido
        open={!!rechazandoRapido}
        onClose={() => setRechazandoRapido(null)}
        onConfirmar={rechazar}
        pedido={rechazandoRapido}
      />
    </AdminLayout>
  );
}
