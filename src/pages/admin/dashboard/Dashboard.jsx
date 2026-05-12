import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import * as api from '../../../services/api';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function TarjetaFinanciera({ icono, titulo, valor, color }) {
  return (
    <div className="stat-card" style={{ flex: 1, minWidth: 140 }}>
      <div className="stat-icono" style={{ background: color + '18', color, fontSize: 18 }}>{icono}</div>
      <div className="stat-info">
        <div className="stat-valor" style={{ fontSize: 18 }}>{valor}</div>
        <div className="stat-titulo" style={{ fontSize: 12 }}>{titulo}</div>
      </div>
    </div>
  );
}

// ── Datos por período ────────────────────────────────────────────
const datosPorPeriodo = {
  mes: [],
  semana: [],
  dia: [],
};

const labelTitulo = { mes: 'Ventas del año por mes', semana: 'Ventas de los últimos 7 días', dia: 'Ventas de hoy por hora' };
const labelTotal  = { mes: 'Total acumulado del año', semana: 'Total de la semana',       dia: 'Total de hoy' };


const hoyISO = () => {
  const co = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return co.toISOString().slice(0, 10);
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

  const isEmpty = datos.length === 0 || (datos.length === 1 && datos[0].label === '—');
  if (isEmpty) {
    return (
      <div className="barra-grafica" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#ccc' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5">
            <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
          </svg>
          <span style={{ fontSize: 13, color: '#bbb' }}>Sin ventas en este período</span>
        </div>
      </div>
    );
  }

  const max = Math.max(...datos.map((d) => d.total), 1);

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
                background: hover === i
                  ? 'linear-gradient(180deg, #e84040 0%, #CA0B0B 100%)'
                  : 'linear-gradient(180deg, #f87171 0%, #CA0B0B 100%)',
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
  const navigate = useNavigate();
  const [periodo,          setPeriodo]          = useState('semana');
  const [filtroFecha,      setFiltroFecha]      = useState(hoyISO());
  const [stats,            setStats]            = useState({});
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [domiciliarios,    setDomiciliarios]    = useState([]);
  const [resumenResenas,   setResumenResenas]   = useState(null);
  const [tiempoEspera,     setTiempoEspera]     = useState(30);
  const [editandoTiempo,   setEditandoTiempo]   = useState(false);
  const [nuevoTiempo,      setNuevoTiempo]      = useState(30);

  const cargar = (f = filtroFecha) => {
    api.getDashboard(f || undefined).then((data) => {
      setStats(data);
      datosPorPeriodo.semana = Array.isArray(data.ventas_semana) ? data.ventas_semana : [];
      datosPorPeriodo.mes    = Array.isArray(data.ventas_mes)    ? data.ventas_mes    : [];
      datosPorPeriodo.dia    = Array.isArray(data.ventas_dia)    ? data.ventas_dia    : [];
      const tops = Array.isArray(data.top_productos) ? data.top_productos : [];
      const maxCant = tops.reduce((m, p) => Math.max(m, Number(p.cantidad) || 0), 1);
      setProductosMasVendidos(tops.map((p) => ({
        nombre: p.nombre,
        cantidad: Number(p.cantidad) || 0,
        porcentaje: Math.round(((Number(p.cantidad) || 0) / maxCant) * 100),
      })));
    }).catch(() => {});
    api.getDomiciliariosDia(f || undefined).then((data) => {
      setDomiciliarios(Array.isArray(data) ? data : []);
    }).catch(() => {});
  };

  useEffect(() => {
    cargar();
    fetch(`${API_URL}/resenas/resumen`).then((r) => r.json()).then((d) => { if (d.success) setResumenResenas(d.data); }).catch(() => {});
    api.getTiempoEspera().then((min) => { setTiempoEspera(min); setNuevoTiempo(min); }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const datosGrafica = (datosPorPeriodo[periodo] && datosPorPeriodo[periodo].length > 0)
    ? datosPorPeriodo[periodo]
    : [{ label: '—', total: 0 }];
  const totalPeriodo = datosGrafica.reduce((a, b) => a + b.total, 0);

  return (
    <AdminLayout>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-titulo">
            {filtroFecha
              ? `Resumen del ${new Date(filtroFecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
              : 'Resumen histórico total'}
          </h1>
          <p className="page-subtitulo">ChocoFreseo — Panel de administración</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f7f8fd', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CA0B0B" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => { setFiltroFecha(e.target.value); cargar(e.target.value); }}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#333' }}
            />
          </div>
          {filtroFecha && (
            <button
              onClick={() => { setFiltroFecha(''); cargar(''); }}
              style={{ fontSize: 12, color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 700 }}
            >
              Ver todo
            </button>
          )}
          <button
            onClick={() => cargar(filtroFecha)}
            style={{ fontSize: 12, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Widget tiempo de espera — compacto, arriba de todo */}
      <div style={{ background: 'white', borderRadius: 10, padding: '10px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⏱️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>Tiempo estimado de entrega</div>
            <div style={{ fontSize: 11, color: '#888' }}>Visible para los clientes</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {editandoTiempo ? (
            <>
              <input type="number" value={nuevoTiempo} onChange={(e) => setNuevoTiempo(Number(e.target.value))} min={1} max={180}
                style={{ width: 55, padding: '4px 8px', borderRadius: 6, border: '2px solid #CA0B0B', fontSize: 14, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
              <span style={{ fontSize: 12, color: '#555' }}>min</span>
              <button onClick={async () => {
                try { await api.setTiempoEspera(nuevoTiempo); setTiempoEspera(nuevoTiempo); setEditandoTiempo(false); }
                catch (e) { alert('Error al guardar'); }
              }} style={{ background: '#CA0B0B', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✓</button>
              <button onClick={() => { setEditandoTiempo(false); setNuevoTiempo(tiempoEspera); }}
                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#555', fontFamily: 'inherit' }}>✕</button>
            </>
          ) : (
            <>
              <div style={{ background: '#fff5f5', border: '1.5px solid #CA0B0B', borderRadius: 8, padding: '4px 12px', textAlign: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#CA0B0B' }}>{tiempoEspera}</span>
                <span style={{ fontSize: 11, color: '#CA0B0B', marginLeft: 4 }}>min</span>
              </div>
              <button onClick={() => setEditandoTiempo(true)} style={{ background: '#f7f8fd', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#555', fontWeight: 600, fontFamily: 'inherit' }}>✏️ Cambiar</button>
            </>
          )}
        </div>
      </div>

      {/* Stats — 3 tarjetas principales */}
      <div className="stats-grid">
        <TarjetaStat icono="💰" color="#16a34a" titulo="Ingresos hoy"       valor={`$${Number(stats.ingresos_hoy || 0).toLocaleString()}`} sub="Efectivo neto + transferencia" />
        <TarjetaStat icono="🛒" color="#3b82f6" titulo="Ventas hoy"         valor={stats.ventas_hoy ?? 0}                                  sub="Pedidos del día" />
        <TarjetaStat icono="🚴" color="#ca8a04" titulo="Domicilios activos" valor={stats.domicilios_activos ?? 0}                          sub="En camino" />
      </div>

      {/* Cards financieras — grid de 3 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20, marginTop: -8 }}>
        <TarjetaFinanciera icono="💵" titulo="Efectivo del día (neto)"  valor={`$${Number(stats.total_efectivo || 0).toLocaleString()}`}      color="#16a34a" />
        <TarjetaFinanciera icono="📱" titulo="Transferencia del día"     valor={`$${Number(stats.total_transferencia || 0).toLocaleString()}`}  color="#3b82f6" />
        <TarjetaFinanciera icono="🛵" titulo="Total domicilios"          valor={`$${Number(stats.total_domicilios || 0).toLocaleString()}`}     color="#ca8a04" />
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

      {/* Fila 2 — Domiciliarios del día */}
      <div className="dash-fila-media">
        <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
          <div className="dash-card-header">
            <span className="dash-card-titulo">Domiciliarios del día</span>
          </div>
          {domiciliarios.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>Sin entregas registradas hoy</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                    {['Domiciliario','Entregas','Efectivo','Transferencia','Total'].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#888', fontWeight: 700, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {domiciliarios.map((d) => (
                    <tr key={d.nombre} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{d.nombre}</td>
                      <td style={{ padding: '10px 12px', color: '#3b82f6', fontWeight: 700 }}>{d.entregas}</td>
                      <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 700 }}>${Number(d.efectivo).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', color: '#7c3aed', fontWeight: 700 }}>${Number(d.transferencia).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', color: '#CA0B0B', fontWeight: 800 }}>${Number(d.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {resumenResenas && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #f0f0f0', marginTop: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#1a1a1a', margin: 0 }}>⭐ Reseñas de clientes</h3>
            <button onClick={() => navigate('/admin/resenas')} style={{ padding: '6px 14px', borderRadius: 8, background: '#CA0B0B', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
              Ver todas
            </button>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Total reseñas', valor: resumenResenas.total, color: '#3b82f6' },
              { label: 'Prom. atención', valor: `${resumenResenas.promAtencion}★`, color: '#f59e0b' },
              { label: 'Prom. producto', valor: `${resumenResenas.promProducto}★`, color: '#CA0B0B' },
            ].map(({ label, valor, color }) => (
              <div key={label} style={{ flex: 1, minWidth: 120, background: '#fafafa', borderRadius: 10, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontWeight: 800, fontSize: 22, color }}>{valor}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </AdminLayout>
  );
}