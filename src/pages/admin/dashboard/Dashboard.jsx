import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import * as api from '../../../services/api';
import './Dashboard.css';

// ── Datos por período ────────────────────────────────────────────
const datosPorPeriodo = {
  mes: [],
  semana: [],
  dia: [],
};

const labelTitulo = { mes: 'Ventas por mes', semana: 'Ventas por semana', dia: 'Ventas de hoy' };
const labelTotal  = { mes: 'Total acumulado del año', semana: 'Total de la semana', dia: 'Total de hoy' };

const coloresEstado = {
  pendiente:        { bg: '#fff5f5', color: '#CA0B0B' },
  aceptado:         { bg: '#eff6ff', color: '#3b82f6' },
  'en preparación': { bg: '#fefce8', color: '#ca8a04' },
  listo:            { bg: '#f0fdf4', color: '#16a34a' },
  despachado:       { bg: '#f5f3ff', color: '#7c3aed' },
  entregado:        { bg: '#f0fdf4', color: '#16a34a' },
  anulado:          { bg: '#f5f5f5', color: '#888'    },
};

const tabs = [
  { key: 'mes',    label: 'Mes'    },
  { key: 'semana', label: 'Semana' },
  { key: 'dia',    label: 'Día'    },
];

// ── TarjetaStat ──────────────────────────────────────────────────
function TarjetaStat({ icono, titulo, valor, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icono" style={{ background: color + '18', color }}>{icono}</div>
      <div className="stat-info">
        <div className="stat-valor">{valor}</div>
        <div className="stat-titulo">{titulo}</div>
        {sub && <div className="stat-sub" style={{ color }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Gráfica de barras ────────────────────────────────────────────
// key={periodo} fuerza re-mount al cambiar período → las barras "entran" desde 0
function BarraGrafica({ datos, periodo }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...datos.map((d) => d.total));

  return (
    <div className="barra-grafica" key={periodo}>
      {datos.map((d, i) => (
        <div
          key={`${periodo}-${i}`}
          className="barra-item"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          {hover === i && (
            <div className="barra-tooltip">${d.total.toLocaleString()}</div>
          )}
          <div className="barra-wrap">
            <div
              className={`barra-fill ${hover === i ? 'barra-fill--activa' : ''}`}
              style={{
                height: `${Math.max((d.total / max) * 100, 3)}%`,
                animationDelay: `${i * 40}ms`,
              }}
            />
          </div>
          <span className="barra-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────
export default function Dashboard() {
  const [periodo,          setPeriodo]          = useState('semana');
  const [stats,            setStats]            = useState({});
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);

  useEffect(() => {
    api.getDashboard().then((data) => {
      setStats(data);
      const semana = Array.isArray(data.ventas_semana) ? data.ventas_semana : [];
      datosPorPeriodo.semana = semana.map((d) => ({ label: d.label || d.dia || d.fecha || '', total: Number(d.total) || 0 }));
      const tops = Array.isArray(data.top_productos) ? data.top_productos : [];
      const maxCant = tops.reduce((m, p) => Math.max(m, Number(p.cantidad) || 0), 1);
      setProductosMasVendidos(tops.map((p) => ({
        nombre: p.nombre,
        cantidad: Number(p.cantidad) || 0,
        porcentaje: Math.round(((Number(p.cantidad) || 0) / maxCant) * 100),
      })));
    }).catch(() => {});
    api.pedidosRecientes(5).then((data) => {
      setPedidosRecientes(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const datosGrafica = (datosPorPeriodo[periodo] && datosPorPeriodo[periodo].length > 0)
    ? datosPorPeriodo[periodo]
    : [{ label: '—', total: 0 }];
  const totalPeriodo  = datosGrafica.reduce((a, b) => a + b.total, 0);
  const pedidosHoy    = pedidosRecientes.filter((p) => (p.estado?.nombre_estado || p.estado) !== 'anulado').length;

  return (
    <AdminLayout>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-titulo">Dashboard</h1>
          <p className="page-subtitulo">Resumen general de ChocoFreseo</p>
        </div>
        <div className="dash-fecha">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats — 4 tarjetas */}
      <div className="stats-grid">
        <TarjetaStat
          icono="💰" color="#16a34a"
          titulo="Ingresos hoy"
          valor={`$${Number(stats.ingresos_hoy || 0).toLocaleString()}`}
          sub="Total del día"
        />
        <TarjetaStat
          icono="🛒" color="#3b82f6"
          titulo="Ventas hoy"
          valor={stats.ventas_hoy ?? 0}
          sub={`${pedidosHoy} activas`}
        />
        <TarjetaStat
          icono="👥" color="#7c3aed"
          titulo="Clientes hoy"
          valor={stats.clientes_hoy ?? 0}
          sub="Nuevos registros"
        />
        <TarjetaStat
          icono="🚴" color="#ca8a04"
          titulo="Domicilios activos"
          valor={stats.domicilios_activos ?? 0}
          sub="En camino"
        />
      </div>

      {/* Fila 1 — Gráfica (ancha) + Productos + Adiciones */}
      <div className="dash-fila-top">

        {/* Gráfica dinámica */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-titulo">{labelTitulo[periodo]}</span>
            <div className="dash-tabs">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`dash-tab ${periodo === t.key ? 'activo' : ''}`}
                  onClick={() => setPeriodo(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <BarraGrafica datos={datosGrafica} periodo={periodo} />
          <div className="grafica-total">
            {labelTotal[periodo]}: <strong>${totalPeriodo.toLocaleString()}</strong>
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-titulo">Productos más vendidos</span>
          </div>
          <div className="productos-lista">
            {productosMasVendidos.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>Sin datos aún</div>
            ) : productosMasVendidos.map((p, i) => (
              <div key={p.nombre} className="producto-item">
                <div className="producto-rank">#{i + 1}</div>
                <div className="producto-info">
                  <div className="producto-nombre">{p.nombre}</div>
                  <div className="producto-barra-wrap">
                    <div className="producto-barra" style={{ width: `${p.porcentaje}%` }} />
                  </div>
                </div>
                <div className="producto-cantidad">{p.cantidad}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Fila 2 — Pedidos recientes */}
      <div className="dash-fila-media">
        <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
          <div className="dash-card-header">
            <span className="dash-card-titulo">Pedidos recientes</span>
          </div>
          <div className="pedidos-lista">
            {pedidosRecientes.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>Sin pedidos aún</div>
            ) : pedidosRecientes.map((p) => {
              const estadoNom = p.estado?.nombre_estado || p.estado || 'pendiente';
              const est = coloresEstado[estadoNom] ?? coloresEstado.pendiente;
              return (
                <div key={p.id_venta} className="pedido-item">
                  <div className="pedido-id">#{p.id_venta}</div>
                  <div className="pedido-info">
                    <div className="pedido-cliente">{p.cliente?.usuario?.nombre || '—'}</div>
                    <div className="pedido-fecha">{p.fecha ? new Date(p.fecha).toLocaleString('es-CO') : '—'}</div>
                  </div>
                  <div className="pedido-derecha">
                    <div className="pedido-total">${Number(p.total || 0).toLocaleString()}</div>
                    <span className="pedido-estado" style={{ background: est.bg, color: est.color }}>{estadoNom}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </AdminLayout>
  );
}