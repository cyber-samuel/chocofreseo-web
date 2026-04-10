import { useState, useEffect } from 'react';
import DomiciliarioLayout from '../../../components/layout/DomiciliarioLayout/DomiciliarioLayout';
import * as api from '../../../services/api';
import './PedidosDomiciliario.css';

// Aplana una venta de API a la forma que espera PedidoCard
const mapVentaPedido = (v, facturado = false) => ({
  id_venta:        v.id_venta,
  hora:            v.fecha ? new Date(v.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
  cliente:         v.cliente?.usuario?.nombre || '—',
  telefono:        v.cliente?.telefono        || '—',
  direccion:       v.direccion?.direccion_linea || '—',
  barrio:          v.direccion?.barrio         || '—',
  ciudad:          v.direccion?.ciudad         || '—',
  forma_pago:      'efectivo',
  valor:           v.total || 0,
  costo_domicilio: v.costo_domicilio || 3000,
  estado:          v.estado?.nombre_estado || v.estado || '—',
  facturado,
  productos:       (v.detalleVentas || []).map((d) => ({
    nombre:    d.producto?.nombre || '—',
    cantidad:  d.cantidad || 1,
    toppings:  (d.toppingDetalles || d.toppings || []).map((t) => t.topping?.nombre || t.nombre || ''),
    adiciones: (d.adicionDetalles || d.adiciones || []).map((a) => a.adicion?.nombre || a.nombre || ''),
    subtotal:  d.subtotal || 0,
  })),
});

// ── Iconos ───────────────────────────────────────────────────────
function IcoWhatsApp() {
  return (
    <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor">
      <path d="M16 0C7.164 0 0 7.163 0 16c0 2.822.737 5.469 2.027 7.773L0 32l8.427-2.007A15.93 15.93 0 0 0 16 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.773-1.853l-.485-.289-5.003 1.193 1.24-4.858-.317-.499A13.233 13.233 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.398-.2-2.355-1.162-2.72-1.294-.365-.133-.631-.2-.897.2-.265.398-1.03 1.294-1.263 1.56-.232.265-.465.299-.863.1-.398-.2-1.682-.62-3.204-1.977-1.184-1.057-1.984-2.362-2.216-2.76-.232-.398-.025-.613.174-.812.179-.178.398-.465.597-.697.2-.232.265-.398.398-.664.133-.265.066-.498-.033-.697-.1-.2-.897-2.163-1.229-2.96-.324-.778-.653-.672-.897-.684l-.764-.013c-.265 0-.697.1-1.063.498-.365.398-1.394 1.362-1.394 3.325 0 1.962 1.427 3.858 1.626 4.123.2.265 2.808 4.287 6.804 6.013.951.41 1.693.655 2.272.839.954.304 1.823.261 2.51.158.766-.114 2.355-.963 2.687-1.893.332-.93.332-1.727.232-1.893-.099-.166-.365-.265-.763-.465z"/>
    </svg>
  );
}
function IcoMapa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function IcoCoger() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
function IcoDevolver() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}
function IcoFacturar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}
function IcoOjo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function IcoChevron({ abierto }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      width="18" height="18"
      style={{ transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .25s' }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ── Modal Detalle ────────────────────────────────────────────────
function ModalDetalle({ pedido, onClose }) {
  if (!pedido) return null;
  return (
    <div className="pd-overlay" onClick={onClose}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-header">
          <span className="pd-modal-titulo">Venta #V-{String(pedido.id_venta).padStart(4,'0')}</span>
          <button className="pd-modal-cerrar" onClick={onClose}>✕</button>
        </div>

        <div className="pd-modal-grid">
          <div className="pd-modal-item">
            <span className="pd-modal-label">Cliente</span>
            <span className="pd-modal-valor">{pedido.cliente}</span>
          </div>
          <div className="pd-modal-item">
            <span className="pd-modal-label">Hora</span>
            <span className="pd-modal-valor">{pedido.hora}</span>
          </div>
          <div className="pd-modal-item pd-modal-full">
            <span className="pd-modal-label">Dirección</span>
            <span className="pd-modal-valor">{pedido.direccion}</span>
          </div>
          <div className="pd-modal-item">
            <span className="pd-modal-label">Teléfono</span>
            <span className="pd-modal-valor">{pedido.telefono}</span>
          </div>
          <div className="pd-modal-item">
            <span className="pd-modal-label">Pago</span>
            <span className={`pd-pago-badge ${pedido.forma_pago}`}>
              {pedido.forma_pago === 'efectivo' ? '💵 Efectivo' : '📱 Transferencia'}
            </span>
          </div>
        </div>

        <p className="pd-modal-sec">Productos</p>
        <div className="pd-modal-productos">
          {pedido.productos.map((p, i) => (
            <div key={i} className="pd-modal-prod">
              <div className="pd-modal-prod-row">
                <span className="pd-modal-prod-nombre">{p.cantidad}× {p.nombre}</span>
                <span className="pd-modal-prod-precio">${p.subtotal.toLocaleString()}</span>
              </div>
              {p.toppings.length > 0 && (
                <div className="pd-chips">
                  {p.toppings.map((t) => <span key={t} className="pd-chip pd-chip--top">{t}</span>)}
                </div>
              )}
              {p.adiciones.length > 0 && (
                <div className="pd-chips">
                  {p.adiciones.map((a) => <span key={a} className="pd-chip pd-chip--adi">{a}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pd-modal-total-bloque">
          <div className="pd-modal-total-fila">
            <span>Subtotal productos</span>
            <span>${pedido.productos.reduce((a, p) => a + p.subtotal, 0).toLocaleString()}</span>
          </div>
          <div className="pd-modal-total-fila">
            <span>Domicilio</span>
            <span>${(pedido.costo_domicilio ?? 3000).toLocaleString()}</span>
          </div>
          <div className="pd-modal-total-fila pd-modal-total-fila--total">
            <span>Total</span>
            <strong>${pedido.valor.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Facturar ───────────────────────────────────────────────
function ModalFacturar({ pedido, onClose, onConfirmar }) {
  // modo: 'efectivo' | 'transferencia' | 'ambos'
  const [modo,          setModo]          = useState('efectivo');
  const [valEfectivo,   setValEfectivo]   = useState('');
  const [valTransf,     setValTransf]     = useState('');

  if (!pedido) return null;

  const ef   = parseFloat(valEfectivo) || 0;
  const tr   = parseFloat(valTransf)   || 0;
  const total = modo === 'efectivo'      ? ef
              : modo === 'transferencia' ? tr
              : ef + tr;

  const diferencia    = total - pedido.valor;
  const puedeFacturar = total >= pedido.valor;

  const handleModo = (m) => {
    setModo(m);
    setValEfectivo('');
    setValTransf('');
  };

  const handleConfirmar = () => {
    if (!puedeFacturar) return;
    onConfirmar(pedido.id_venta, { efectivo: ef, transferencia: tr });
  };

  return (
    <div className="pd-overlay" onClick={onClose}>
      <div className="pd-modal pd-modal--factura" onClick={(e) => e.stopPropagation()}>

        {/* Header rojo */}
        <div className="mf-header">
          <span className="mf-titulo">
            Registro de pago — Venta No. {String(pedido.id_venta).padStart(2,'0')}
          </span>
          <button className="mf-cerrar" onClick={onClose}>✕</button>
        </div>

        <div className="mf-body">

          {/* Total de la venta */}
          <div className="mf-venta-total">
            <span className="mf-venta-label">Total a cobrar</span>
            <span className="mf-venta-valor">${pedido.valor.toLocaleString()}</span>
          </div>

          {/* Selector modo pago */}
          <p className="mf-sec-label">¿Cómo pagó el cliente?</p>
          <div className="mf-modo-grupo">
            <button
              className={`mf-modo-btn ${modo === 'efectivo' ? 'activo' : ''}`}
              onClick={() => handleModo('efectivo')}
            >
              💵 Efectivo
            </button>
            <button
              className={`mf-modo-btn ${modo === 'transferencia' ? 'activo' : ''}`}
              onClick={() => handleModo('transferencia')}
            >
              📱 Transferencia
            </button>
            <button
              className={`mf-modo-btn ${modo === 'ambos' ? 'activo' : ''}`}
              onClick={() => handleModo('ambos')}
            >
              ⚡ Dividido
            </button>
          </div>

          {/* Campos según modo */}
          <div className="mf-campos">
            {(modo === 'efectivo' || modo === 'ambos') && (
              <div className="mf-campo">
                <label className="mf-campo-label">💵 Efectivo recibido</label>
                <div className="mf-input-wrap">
                  <span className="mf-prefix">$</span>
                  <input
                    className="mf-input"
                    type="number" min="0"
                    placeholder="0"
                    value={valEfectivo}
                    onChange={(e) => setValEfectivo(e.target.value)}
                  />
                </div>
              </div>
            )}
            {(modo === 'transferencia' || modo === 'ambos') && (
              <div className="mf-campo">
                <label className="mf-campo-label">📱 Transferencia recibida</label>
                <div className="mf-input-wrap">
                  <span className="mf-prefix">$</span>
                  <input
                    className="mf-input"
                    type="number" min="0"
                    placeholder="0"
                    value={valTransf}
                    onChange={(e) => setValTransf(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="mf-resumen">
            <div className="mf-resumen-fila">
              <span>Valor recibido</span>
              <span className={total > 0 ? (puedeFacturar ? 'mf-verde' : 'mf-rojo') : ''}>${total.toLocaleString()}</span>
            </div>
            <div className="mf-resumen-fila">
              <span>Total venta</span>
              <strong>${pedido.valor.toLocaleString()}</strong>
            </div>
            {diferencia > 0 && (
              <div className="mf-resumen-fila mf-cambio">
                <span>Cambio a devolver</span>
                <span className="mf-verde">${diferencia.toLocaleString()}</span>
              </div>
            )}
            {diferencia < 0 && total > 0 && (
              <div className="mf-resumen-fila mf-cambio">
                <span>Falta por cobrar</span>
                <span className="mf-rojo">${Math.abs(diferencia).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Aviso */}
          <div className="mf-aviso">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Se marcará como domicilio entregado
          </div>

          {/* Botones */}
          <div className="mf-pie">
            <button className="mf-btn-cancelar" onClick={onClose}>Cancelar</button>
            <button className="mf-btn-facturar" onClick={handleConfirmar} disabled={!puedeFacturar}>
              Facturar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Card compacta ─────────────────────────────────────────────────
function PedidoCard({ pedido, tipo, onCoger, onDevolver, onAbrirFacturar, onVerDetalle }) {
  const wpp  = `https://wa.me/57${pedido.telefono}?text=Hola%20${encodeURIComponent(pedido.cliente)},%20ya%20voy%20en%20camino%20%F0%9F%8D%AB`;
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.direccion + ', ' + pedido.ciudad)}`;

  return (
    <div className={`pd-card ${pedido.facturado ? 'pd-card--ok' : ''}`}>

      {pedido.facturado && <div className="pd-ok-banner">✓ Entregado y facturado</div>}

      {/* Fila 1: ID + hora + pago */}
      <div className="pd-card-top">
        <div className="pd-card-ids">
          <span className="pd-num">V-{String(pedido.id_venta).padStart(4,'0')}</span>
          <span className="pd-hora">{pedido.hora}</span>
        </div>
        <span className={`pd-pago-badge ${pedido.forma_pago}`}>
          {pedido.forma_pago === 'efectivo' ? '💵 Efectivo' : '📱 Transferencia'}
        </span>
      </div>

      {/* Fila 2: nombre + tel */}
      <div className="pd-card-cliente">
        <span className="pd-nombre">{pedido.cliente}</span>
        <span className="pd-tel">{pedido.telefono}</span>
      </div>

      {/* Fila 3: dirección */}
      <div className="pd-card-dir">
        <IcoMapa />
        <span>{pedido.direccion}</span>
      </div>

      {/* Fila 4: estado */}
      <span className={`pd-estado ${pedido.facturado ? 'pd-estado--ok' : ''}`}>
        {pedido.facturado ? '✓ Domicilio entregado' : pedido.estado}
      </span>

      {/* Fila 5: total + botones */}
      <div className="pd-card-footer">
        <span className="pd-total">${pedido.valor.toLocaleString()}</span>

        <div className="pd-btns">
          {/* WhatsApp */}
          <a href={wpp} target="_blank" rel="noopener noreferrer" className="pd-btn pd-btn--wpp" title="WhatsApp">
            <IcoWhatsApp />
          </a>

          {/* Mapa */}
          <a href={maps} target="_blank" rel="noopener noreferrer" className="pd-btn pd-btn--map" title="Abrir en mapa">
            <IcoMapa />
          </a>

          {tipo === 'despachar' ? (
            <button className="pd-btn pd-btn--coger" onClick={() => onCoger(pedido)} title="Coger pedido">
              <IcoCoger />
            </button>
          ) : !pedido.facturado ? (
            <>
              <button className="pd-btn pd-btn--dev" onClick={() => onDevolver(pedido)} title="Devolver">
                <IcoDevolver />
              </button>
              <button className="pd-btn pd-btn--fac" onClick={() => onAbrirFacturar(pedido)} title="Facturar">
                <IcoFacturar />
              </button>
            </>
          ) : null}

          {/* Siempre: ver detalle */}
          <button className="pd-btn pd-btn--ver" onClick={() => onVerDetalle(pedido)} title="Ver detalle">
            <IcoOjo />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sección colapsable ────────────────────────────────────────────
function Seccion({ titulo, badge, badgeClass, children, defaultOpen = true }) {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <section className="pd-seccion">
      <button className="pd-seccion-header" onClick={() => setAbierto((v) => !v)}>
        <div className="pd-seccion-left">
          <h2 className="pd-seccion-titulo">{titulo}</h2>
          <span className={`pd-badge ${badgeClass}`}>{badge}</span>
        </div>
        <IcoChevron abierto={abierto} />
      </button>

      <div className={`pd-seccion-body ${abierto ? 'pd-seccion-body--open' : ''}`}>
        {children}
      </div>
    </section>
  );
}

// ── Página ────────────────────────────────────────────────────────
export default function PedidosDomiciliario() {
  const [porDespachar, setPorDespachar] = useState([]);
  const [despachados,  setDespachados]  = useState([]);
  const [detalle,      setDetalle]      = useState(null);
  const [facturando,   setFacturando]   = useState(null);

  const cargar = () => {
    api.listarVentas('listo').then((d) => setPorDespachar(d.map((v) => mapVentaPedido(v, false)))).catch(() => {});
    api.listarVentas('despachado').then((d) => setDespachados(d.map((v) => mapVentaPedido(v, false)))).catch(() => {});
  };
  useEffect(() => { cargar(); }, []);

  const coger = async (pedido) => {
    await api.cambiarEstadoVenta(pedido.id_venta, { estado: 'despachado' }).catch(() => {});
    cargar();
  };

  const devolver = async (pedido) => {
    await api.cambiarEstadoVenta(pedido.id_venta, { estado: 'listo' }).catch(() => {});
    cargar();
  };

  const confirmarFactura = async (id_venta) => {
    await api.cambiarEstadoVenta(id_venta, { estado: 'entregado' }).catch(() => {});
    setFacturando(null);
    cargar();
  };

  return (
    <DomiciliarioLayout>
      <div className="pd-page">

        <Seccion
          titulo="Por despachar"
          badge={porDespachar.length}
          badgeClass="pd-badge--rojo"
          defaultOpen={true}
        >
          {porDespachar.length === 0 ? (
            <div className="pd-vacio">
              <span>📭</span>
              <span>No hay pedidos listos por despachar</span>
            </div>
          ) : (
            porDespachar.map((p) => (
              <PedidoCard
                key={p.id_venta} pedido={p} tipo="despachar"
                onCoger={coger}
                onVerDetalle={setDetalle}
              />
            ))
          )}
        </Seccion>

        <Seccion
          titulo="Despachados"
          badge={despachados.length}
          badgeClass="pd-badge--verde"
          defaultOpen={true}
        >
          {despachados.length === 0 ? (
            <div className="pd-vacio">
              <span>🛵</span>
              <span>Aún no has cogido ningún pedido</span>
            </div>
          ) : (
            [...despachados].reverse().map((p) => (
              <PedidoCard
                key={p.id_venta} pedido={p} tipo="despachado"
                onDevolver={devolver}
                onAbrirFacturar={setFacturando}
                onVerDetalle={setDetalle}
              />
            ))
          )}
        </Seccion>

      </div>

      <ModalDetalle  pedido={detalle}    onClose={() => setDetalle(null)} />
      <ModalFacturar pedido={facturando} onClose={() => setFacturando(null)} onConfirmar={confirmarFactura} />
    </DomiciliarioLayout>
  );
}