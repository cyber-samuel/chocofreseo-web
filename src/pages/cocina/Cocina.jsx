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
    toppings:  (d.detalleToppings  || []).map((t) => t.topping?.nombre  || ''),
    adiciones: (d.detalleAdiciones || []).map((a) => a.adicion?.nombre  || ''),
  })),
});

function PedidoCard({ pedido, onListo }) {
  const [marcando, setMarcando] = useState(false);

  const handleListo = async () => {
    setMarcando(true);
    try {
      await api.cambiarEstadoVenta(pedido.id_venta, { nombre_estado: 'listo' });
      onListo(pedido.id_venta);
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al marcar como listo');
      setMarcando(false);
    }
  };

  return (
    <div className="cocina-card">
      <div className="cocina-card-header">
        <span className="cocina-card-num">V-{String(pedido.id_venta).padStart(4, '0')}</span>
        <span className="cocina-card-hora">{pedido.hora}</span>
        <span className="cocina-card-cliente">{pedido.cliente}</span>
      </div>

      {pedido.observaciones && (
        <div className="cocina-card-obs">
          <span>⚠</span>
          <span>{pedido.observaciones}</span>
        </div>
      )}

      <div className="cocina-card-productos">
        {pedido.productos.map((p, i) => (
          <div key={i} className="cocina-producto">
            <div className="cocina-producto-nombre">
              <span className="cocina-producto-cant">{p.cantidad}×</span>
              {p.nombre}
            </div>
            {p.toppings.length > 0 && (
              <div className="cocina-extras">
                {p.toppings.filter(Boolean).map((t, j) => (
                  <span key={j} className="cocina-chip cocina-chip--top">{t}</span>
                ))}
              </div>
            )}
            {p.adiciones.length > 0 && (
              <div className="cocina-adiciones">
                {p.adiciones.filter(Boolean).map((a, j) => (
                  <span key={j} className="cocina-adicion">+{a}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="cocina-btn-listo" onClick={handleListo} disabled={marcando}>
        {marcando ? 'Marcando...' : '✓ Listo para despachar'}
      </button>
    </div>
  );
}

export default function Cocina() {
  const [pedidos,    setPedidos]    = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [ultimaAct,  setUltimaAct] = useState('');

  const cargar = useCallback(() => {
    api.listarVentas('en_proceso')
      .then((data) => {
        setPedidos((data || []).map(mapPedido));
        setUltimaAct(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 30000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const handleListo = (id) => {
    setPedidos((prev) => prev.filter((p) => p.id_venta !== id));
  };

  return (
    <CocinaLayout>
      <div className="cocina-page">
        <div className="cocina-header">
          <div>
            <h1 className="cocina-titulo">Pedidos en cocina</h1>
            <p className="cocina-sub">
              {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} por preparar
              {ultimaAct && <span className="cocina-act"> · Actualizado {ultimaAct}</span>}
            </p>
          </div>
          <button className="cocina-btn-refresh" onClick={cargar}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
            </svg>
            Actualizar
          </button>
        </div>

        {cargando ? (
          <div className="cocina-vacio">
            <span style={{ fontSize: 32 }}>⏳</span>
            <p>Cargando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="cocina-vacio">
            <span style={{ fontSize: 56 }}>👨‍🍳</span>
            <p className="cocina-vacio-titulo">No hay pedidos en cocina</p>
            <p className="cocina-vacio-sub">Los pedidos confirmados aparecerán aquí</p>
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
