import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import * as api from '../../services/api';

const hoyISO = () => new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);

const mapPedido = (v) => ({
  id_venta:      v.id_venta,
  hora:          v.fecha ? new Date(v.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
  cliente:       v.cliente?.usuario?.nombre || '—',
  observaciones: v.observaciones || '',
  productos:     (v.detalleVentas || []).map((d) => ({
    nombre:    d.producto?.nombre || '—',
    cantidad:  d.cantidad || 1,
    toppings:  (d.detalleToppings  || []).map((t) => t.topping?.nombre || '').filter(Boolean),
    adiciones: (d.detalleAdiciones || []).map((a) => a.adicion?.nombre || '').filter(Boolean),
  })),
});

const chipTopping = { background: '#1a1a1a', color: '#fff',      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, display: 'inline-block' };
const chipAdicion = { background: '#d97706', color: '#fff',      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, display: 'inline-block' };

function PedidoCard({ pedido, onConfirmar }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header rojo */}
      <div style={{ background: '#CA0B0B', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>#{pedido.id_venta}</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{pedido.cliente}</div>
        </div>
        <div style={{ background: '#fff', color: '#CA0B0B', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
          {pedido.hora}
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: 16, flex: 1 }}>
        {pedido.observaciones && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#92400e' }}>
            ⚠ {pedido.observaciones}
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, marginBottom: 8 }}>PRODUCTOS</div>
        {pedido.productos.map((p, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', marginBottom: 4 }}>
              {p.cantidad}× {p.nombre}
            </div>
            {(p.toppings.length > 0 || p.adiciones.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {p.toppings.map((t, j) => <span key={`t${j}`} style={chipTopping}>{t}</span>)}
                {p.adiciones.map((a, j) => <span key={`a${j}`} style={chipAdicion}>{a}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 16px' }}>
        <button
          onClick={() => onConfirmar(pedido.id_venta)}
          style={{
            width: '100%', background: '#16a34a', color: '#fff', border: 'none',
            borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
          }}
        >
          ✓ Marcar como listo
        </button>
      </div>
    </div>
  );
}

export default function Cocina() {
  const [pedidos,     setPedidos]     = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [confirmando, setConfirmando] = useState(null);
  const [marcando,    setMarcando]    = useState(false);

  const cargar = useCallback(() => {
    api.listarVentas('en_proceso', hoyISO())
      .then((data) => setPedidos((data || []).map(mapPedido)))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 30000);
    return () => clearInterval(id);
  }, [cargar]);

  const marcarListo = async (id) => {
    setMarcando(true);
    try {
      await api.cambiarEstadoVenta(id, { nombre_estado: 'listo' });
      setPedidos((prev) => prev.filter((p) => p.id_venta !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al marcar como listo');
    } finally {
      setMarcando(false);
      setConfirmando(null);
    }
  };

  return (
    <AdminLayout>
      {/* Modal de confirmación */}
      {confirmando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 360, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>
              ¿Confirmar pedido listo?
            </h3>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
              ¿Estás seguro de marcar el pedido <strong>#{confirmando}</strong> como listo para despachar?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setConfirmando(null)}
                disabled={marcando}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'Nunito, sans-serif' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => marcarListo(confirmando)}
                disabled={marcando}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: marcando ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: 'Nunito, sans-serif' }}
              >
                {marcando ? 'Marcando...' : 'Sí, está listo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-titulo">Panel Cocina</h1>
          <p className="page-subtitulo">
            {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} en preparación
          </p>
        </div>
        <button
          onClick={cargar}
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
          Actualizar
        </button>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ color: '#888' }}>Cargando pedidos...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>👨‍🍳</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Todo listo por ahora</h3>
          <p style={{ color: '#888', fontSize: 14 }}>Los pedidos confirmados aparecerán aquí</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {pedidos.map((p) => (
            <PedidoCard key={p.id_venta} pedido={p} onConfirmar={setConfirmando} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
