import { useState, useEffect, useCallback } from 'react';
import CocinaLayout from '../../components/layout/CocinaLayout';
import * as api from '../../services/api';
import './Cocina.css';

const mapPedido = (v) => ({
  id_venta:      v.id_venta,
  hora:          v.fecha ? new Date(v.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
  cliente:       v.cliente?.usuario?.nombre || '—',
  observaciones: v.observaciones || '',
  productos:     (v.detalleVentas || []).map((d) => ({
    nombre:    d.producto?.nombre || '—',
    cantidad:  d.cantidad || 1,
    toppings:  (d.detalleToppings  || []).map((t) => t.topping?.nombre  || '').filter(Boolean),
    adiciones: (d.detalleAdiciones || []).map((a) => a.adicion?.nombre  || '').filter(Boolean),
  })),
});

function PedidoCard({ pedido, onListo }) {
  const [marcando,  setMarcando]  = useState(false);
  const [saliendo,  setSaliendo]  = useState(false);

  const handleListo = async () => {
    setMarcando(true);
    try {
      await api.cambiarEstadoVenta(pedido.id_venta, { nombre_estado: 'listo' });
      setSaliendo(true);
      setTimeout(() => onListo(pedido.id_venta), 400);
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al marcar como listo');
      setMarcando(false);
    }
  };

  return (
    <div className={`cocina-card ${saliendo ? 'cocina-card--saliendo' : ''}`}>

      {/* Header rojo */}
      <div className="cocina-card-head">
        <div className="cocina-card-head-izq">
          <span className="cocina-card-num">#{pedido.id_venta}</span>
          <span className="cocina-card-cliente">{pedido.cliente}</span>
        </div>
        <span className="cocina-card-hora-badge">{pedido.hora}</span>
      </div>

      {/* Cuerpo */}
      <div className="cocina-card-body">

        {/* Observaciones */}
        {pedido.observaciones && (
          <div className="cocina-obs">
            <span className="cocina-obs-icon">⚠</span>
            <span>{pedido.observaciones}</span>
          </div>
        )}

        {/* Productos */}
        <p className="cocina-label-sec">PRODUCTOS</p>
        <div className="cocina-prods">
          {pedido.productos.map((p, i) => (
            <div key={i} className="cocina-prod">
              <span className="cocina-prod-nombre">
                <strong>{p.cantidad}×</strong> {p.nombre}
              </span>
              {p.toppings.length > 0 && (
                <div className="cocina-chips-row">
                  {p.toppings.map((t, j) => (
                    <span key={j} className="cocina-chip">{t}</span>
                  ))}
                </div>
              )}
              {p.adiciones.length > 0 && (
                <span className="cocina-adiciones-txt">
                  {p.adiciones.map((a) => `+ ${a}`).join(' · ')}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Separador */}
        <div className="cocina-sep" />

        {/* Botón */}
        <button className="cocina-btn-listo" onClick={handleListo} disabled={marcando}>
          {marcando
            ? <><span className="cocina-spinner" /> Marcando...</>
            : '✓ Marcar como listo'}
        </button>

      </div>
    </div>
  );
}

export default function Cocina() {
  const [pedidos,  setPedidos]  = useState([]);
  const [cargando, setCargando] = useState(true);
  const [hora,     setHora]     = useState('');

  // Reloj en tiempo real
  useEffect(() => {
    const tick = () => setHora(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const cargar = useCallback(() => {
    api.listarVentas('en_proceso')
      .then((data) => setPedidos((data || []).map(mapPedido)))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 30000);
    return () => clearInterval(id);
  }, [cargar]);

  const handleListo = (id) => setPedidos((prev) => prev.filter((p) => p.id_venta !== id));

  return (
    <CocinaLayout>
      <div className="cocina-page">

        {/* Header */}
        <div className="cocina-header">
          <div className="cocina-header-izq">
            <div className="cocina-logo-inline">CF</div>
            <div>
              <h1 className="cocina-titulo">Panel Cocina</h1>
              <p className="cocina-sub">
                {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} en preparación
              </p>
            </div>
          </div>
          <div className="cocina-header-der">
            <span className="cocina-reloj">{hora}</span>
            <button className="cocina-btn-refresh" onClick={cargar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="cocina-vacio">
            <div className="cocina-spinner cocina-spinner--lg" />
            <p>Cargando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="cocina-vacio">
            <span className="cocina-vacio-icono">👨‍🍳</span>
            <p className="cocina-vacio-titulo">Todo listo por ahora</p>
            <p className="cocina-vacio-sub">Los pedidos confirmados aparecerán aquí automáticamente</p>
            <p className="cocina-vacio-hint">Actualizando cada 30 segundos...</p>
          </div>
        ) : (
          <div className="cocina-grid">
            {pedidos.map((p) => (
              <PedidoCard key={p.id_venta} pedido={p} onListo={handleListo} />
            ))}
          </div>
        )}

      </div>
    </CocinaLayout>
  );
}
