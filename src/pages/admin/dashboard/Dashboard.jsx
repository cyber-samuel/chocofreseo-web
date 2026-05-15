import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingCart, Truck, Clock, TrendingUp, RefreshCw, Star, Power, CalendarClock } from 'lucide-react';
import AdminLayout from '../../../components/layout/AdminLayout';
import * as api from '../../../services/api';
import './Dashboard.css';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + '/api';

function TarjetaFinanciera({ icono, titulo, valor, color }) {
  return (
    <div className="stat-card" style={{ flex: 1, minWidth: 140 }}>
      <div className="stat-icono" style={{ background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icono}</div>
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
      <div className="stat-icono" style={{ background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icono}</div>
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
                  ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
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
  const [horario,          setHorario]          = useState({ hora_apertura: 13, hora_cierre: 20, estado_tienda: 'schedule' });
  const [editandoHorario,  setEditandoHorario]  = useState(false);
  const [nuevoHorario,     setNuevoHorario]     = useState({ hora_apertura: 13, hora_cierre: 20 });

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
    api.getHorario().then((h) => { setHorario(h); setNuevoHorario({ hora_apertura: h.hora_apertura, hora_cierre: h.hora_cierre }); }).catch(() => {});
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
            <RefreshCw size={12} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats — 4 tarjetas: 3 métricas + tiempo estimado editable */}
      <div className="stats-grid">
        <TarjetaStat icono={<DollarSign size={20} />} color="#059669" titulo="Ingresos hoy"       valor={`$${Number(stats.ingresos_hoy || 0).toLocaleString()}`} sub="Efectivo neto + transferencia" />
        <TarjetaStat icono={<ShoppingCart size={20} />} color="#2563eb" titulo="Ventas hoy"       valor={stats.ventas_hoy ?? 0}                                  sub="Pedidos del día" />
        <TarjetaStat icono={<Truck size={20} />} color="#7c3aed" titulo="Domicilios activos"      valor={stats.domicilios_activos ?? 0}                          sub="En camino" />
        {/* Card tiempo estimado editable */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => !editandoTiempo && setEditandoTiempo(true)}>
          <div className="stat-icono" style={{ background: '#37415118', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div className="stat-info">
            {editandoTiempo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <input type="number" value={nuevoTiempo} onChange={(e) => setNuevoTiempo(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()} min={1} max={180} autoFocus
                  style={{ width: 46, padding: '1px 4px', borderRadius: 5, border: '2px solid #374151', fontSize: 15, fontWeight: 800, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
                <span style={{ fontSize: 10, color: '#666' }}>min</span>
                <button onClick={async (e) => { e.stopPropagation(); try { await api.setTiempoEspera(nuevoTiempo); setTiempoEspera(nuevoTiempo); setEditandoTiempo(false); } catch { alert('Error'); } }}
                  style={{ background: '#374151', color: 'white', border: 'none', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>✓</button>
                <button onClick={(e) => { e.stopPropagation(); setEditandoTiempo(false); setNuevoTiempo(tiempoEspera); }}
                  style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '1px 4px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>✕</button>
              </div>
            ) : (
              <div className="stat-valor">{tiempoEspera} min</div>
            )}
            <div className="stat-titulo">Tiempo estimado</div>
            {!editandoTiempo && (
              <div style={{ fontSize: 10, color: 'white', marginTop: 3, background: '#2563eb', padding: '2px 8px', borderRadius: 6, display: 'inline-block', fontWeight: 600, cursor: 'pointer' }}>
                ✏️ Editar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards horario + toggle apertura */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Horario configurable */}
        <div className="stat-card" style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}
          onClick={() => !editandoHorario && setEditandoHorario(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <div className="stat-icono" style={{ background: '#1e3a5f18', color: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarClock size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="stat-titulo" style={{ marginBottom: 2 }}>Horario de atención</div>
              {!editandoHorario && (
                <div className="stat-valor" style={{ fontSize: 15 }}>
                  {horario.hora_apertura}:00 – {horario.hora_cierre}:00
                </div>
              )}
            </div>
          </div>
          {editandoHorario ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', width: '100%' }} onClick={e => e.stopPropagation()}>
              <label style={{ fontSize: 11, color: '#666', fontWeight: 700 }}>Abre</label>
              <input type="number" min={0} max={23} value={nuevoHorario.hora_apertura}
                onChange={e => setNuevoHorario(p => ({ ...p, hora_apertura: Number(e.target.value) }))}
                style={{ width: 44, padding: '2px 4px', borderRadius: 5, border: '2px solid #1e3a5f', fontSize: 14, fontWeight: 800, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
              <label style={{ fontSize: 11, color: '#666', fontWeight: 700 }}>Cierra</label>
              <input type="number" min={0} max={23} value={nuevoHorario.hora_cierre}
                onChange={e => setNuevoHorario(p => ({ ...p, hora_cierre: Number(e.target.value) }))}
                style={{ width: 44, padding: '2px 4px', borderRadius: 5, border: '2px solid #1e3a5f', fontSize: 14, fontWeight: 800, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={async () => { try { const h = await api.setHorario(nuevoHorario); setHorario(h); setEditandoHorario(false); } catch { alert('Error'); } }}
                style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 700 }}>Guardar</button>
              <button onClick={() => { setEditandoHorario(false); setNuevoHorario({ hora_apertura: horario.hora_apertura, hora_cierre: horario.hora_cierre }); }}
                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 5, padding: '2px 6px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Cancelar</button>
            </div>
          ) : (
            <div style={{ fontSize: 10, color: '#fff', background: '#1e3a5f', padding: '2px 10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>✏ Editar horario</div>
          )}
        </div>

        {/* Toggle apertura manual */}
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <div className="stat-icono" style={{
              background: horario.estado_tienda === 'open' ? '#16a34a18' : horario.estado_tienda === 'closed' ? '#CA0B0B18' : '#f59e0b18',
              color:      horario.estado_tienda === 'open' ? '#16a34a'   : horario.estado_tienda === 'closed' ? '#CA0B0B'   : '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Power size={20} />
            </div>
            <div>
              <div className="stat-titulo" style={{ marginBottom: 2 }}>Estado de la tienda</div>
              <div className="stat-valor" style={{ fontSize: 14,
                color: horario.estado_tienda === 'open' ? '#16a34a' : horario.estado_tienda === 'closed' ? '#CA0B0B' : '#f59e0b' }}>
                {horario.estado_tienda === 'open' ? 'Abierta ahora' : horario.estado_tienda === 'closed' ? 'Cerrada' : 'Por horario'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, width: '100%' }}>
            {[
              { key: 'open',     label: 'Forzar abierta', color: '#16a34a' },
              { key: 'schedule', label: 'Por horario',     color: '#f59e0b' },
              { key: 'closed',   label: 'Cerrar ahora',   color: '#CA0B0B' },
            ].map(({ key, label, color }) => (
              <button key={key} onClick={async () => {
                try {
                  const h = await api.setHorario({ estado_tienda: key });
                  setHorario(h);
                } catch { alert('Error'); }
              }} style={{
                flex: 1, padding: '6px 4px', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 8,
                cursor: 'pointer', fontFamily: 'inherit',
                background: horario.estado_tienda === key ? color : '#f5f5f5',
                color: horario.estado_tienda === key ? '#fff' : '#888',
                transition: 'all .15s',
              }}>{label}</button>
            ))}
          </div>
        </div>

      </div>

      {/* Cards financieras */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20, marginTop: -8 }}>
        <TarjetaFinanciera icono={<DollarSign size={18} />} titulo="Efectivo del día (neto)"  valor={`$${Number(stats.total_efectivo || 0).toLocaleString()}`}      color="#065f46" />
        <TarjetaFinanciera icono={<TrendingUp size={18} />} titulo="Transferencia del día"     valor={`$${Number(stats.total_transferencia || 0).toLocaleString()}`}  color="#1e40af" />
        <TarjetaFinanciera icono={<Truck size={18} />}      titulo="Total domicilios"          valor={`$${Number(stats.total_domicilios || 0).toLocaleString()}`}     color="#5b21b6" />
      </div>

      {/* Fila 1 — Gráfica 65% + Productos 35% */}
      <div className="dash-fila-top" style={{ display: 'grid', gridTemplateColumns: '65fr 35fr', gap: 16, marginBottom: 20 }}>

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
                    <div className="producto-barra" style={{ width: `${p.porcentaje}%`, background: '#2563eb' }} />
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
            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#1a1a1a', margin: 0, display:'flex', alignItems:'center', gap:6 }}><Star size={15} color="#f59e0b"/>Reseñas de clientes</h3>
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