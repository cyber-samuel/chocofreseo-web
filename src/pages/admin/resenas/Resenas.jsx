import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const Estrellas = ({ valor }) => (
  <span style={{ color: '#f59e0b' }}>{'★'.repeat(valor)}{'☆'.repeat(5 - valor)}</span>
);

const SEDES = ['Todas', 'Aranjuez', 'Laureles', 'WhatsApp'];

export default function Resenas() {
  const [lista,       setLista]       = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [filtroSede,  setFiltroSede]  = useState('Todas');
  const [filtroFecha, setFiltroFecha] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('chocofreseo_token');
    fetch(`${API_URL}/resenas`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setLista(d.data || []); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const filtradas = lista.filter((r) => {
    const matchSede = filtroSede === 'Todas' || r.sede === filtroSede;
    const matchFecha = !filtroFecha || r.fecha?.startsWith(filtroFecha);
    return matchSede && matchFecha;
  });

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-titulo">Reseñas</h1>
          <p className="page-subtitulo">{lista.length} reseñas registradas</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {SEDES.map((s) => (
            <button key={s} onClick={() => setFiltroSede(s)} style={{
              padding: '6px 14px', borderRadius: 8, border: `1px solid ${filtroSede === s ? '#CA0B0B' : '#e5e7eb'}`,
              background: filtroSede === s ? '#fff5f5' : '#fff', color: filtroSede === s ? '#CA0B0B' : '#555',
              fontWeight: filtroSede === s ? 700 : 400, cursor: 'pointer', fontSize: 13,
            }}>{s}</button>
          ))}
        </div>
        <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
        {filtroFecha && <button onClick={() => setFiltroFecha('')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13 }}>✕ Limpiar fecha</button>}
      </div>

      {cargando ? (
        <p style={{ color: '#888', fontSize: 14 }}>Cargando reseñas...</p>
      ) : filtradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No hay reseñas con estos filtros</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtradas.map((r) => (
            <div key={r.id_resena} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #f0f0f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: '#fff5f5', color: '#CA0B0B', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{r.sede}</span>
                  <span style={{ background: '#f5f5f5', color: '#555', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
                    {{primera_vez: 'Primera vez', de_vez_en_cuando: 'De vez en cuando', casi_siempre: 'Habitual'}[r.frecuencia] || r.frecuencia}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#aaa' }}>{new Date(r.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 10 }}>
                <div><span style={{ fontSize: 12, color: '#888' }}>Atención: </span><Estrellas valor={r.calificacion_atencion} /></div>
                <div><span style={{ fontSize: 12, color: '#888' }}>Producto: </span><Estrellas valor={r.calificacion_producto} /></div>
                <div><span style={{ fontSize: 12, color: '#888' }}>¿Recomienda? </span><strong style={{ fontSize: 13 }}>{{si: '✅ Sí', tal_vez: '🤔 Tal vez', no: '❌ No'}[r.recomendaria] || r.recomendaria}</strong></div>
                <div><span style={{ fontSize: 12, color: '#888' }}>Tiempo: </span><strong style={{ fontSize: 13 }}>{{si: '✅ Adecuado', no: '❌ No', podria_mejorar: '🔄 Podría mejorar'}[r.tiempo_adecuado] || r.tiempo_adecuado}</strong></div>
              </div>
              {r.lo_que_gusto && <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><strong>Lo que más gustó:</strong> {r.lo_que_gusto}</p>}
              {r.producto_deseado && <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><strong>Postre deseado:</strong> {r.producto_deseado}</p>}
              {r.mejora && <p style={{ fontSize: 13, color: '#555', marginBottom: 0 }}><strong>Mejoras:</strong> {r.mejora}</p>}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
