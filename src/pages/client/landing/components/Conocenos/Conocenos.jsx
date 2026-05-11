import { useState } from 'react';
import './Conocenos.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Estrellas({ valor, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} onClick={() => onChange(n)}
          style={{ fontSize: 28, cursor: 'pointer', color: n <= valor ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </div>
  );
}

const INICIAL = {
  sede: '', frecuencia: '', calificacion_atencion: 0, calificacion_producto: 0,
  recomendaria: '', tiempo_adecuado: '', lo_que_gusto: '', producto_deseado: '', mejora: '',
};

export default function Conocenos() {
  const [form,    setForm]    = useState(INICIAL);
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const enviar = async () => {
    if (!form.sede || !form.frecuencia || !form.calificacion_atencion || !form.calificacion_producto || !form.recomendaria || !form.tiempo_adecuado) return;
    setCargando(true);
    try {
      await fetch(`${API_URL}/resenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setEnviado(true);
      setForm(INICIAL);
      setTimeout(() => setEnviado(false), 5000);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const btnSel = (activo) => ({
    padding: '10px 16px', borderRadius: 10, border: `2px solid ${activo ? '#CA0B0B' : '#e5e7eb'}`,
    background: activo ? '#fff5f5' : '#fff', color: activo ? '#CA0B0B' : '#555',
    fontWeight: activo ? 700 : 400, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
  });

  return (
    <section className="conocenos" id="nosotros">
      <div className="conocenos-wrap">
        <div className="conocenos-imagen">
          <div className="conocenos-img-placeholder">
            <span className="conocenos-img-texto">Video o imagen promocional</span>
          </div>
          <div className="conocenos-badge">Hecho con amor desde 2020</div>
        </div>

        <div className="conocenos-contenido">
          <span className="landing-seccion-tag">Tu opinión importa</span>
          <h2 className="conocenos-titulo">¿Cómo fue tu experiencia?</h2>
          <p className="conocenos-texto" style={{ marginBottom: 24 }}>Tu opinión nos ayuda a mejorar y a seguir sorprendiéndote.</p>

          {enviado ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <p style={{ fontWeight: 700, color: '#166534', fontSize: 16 }}>¡Gracias por tu reseña!</p>
              <p style={{ color: '#4b7a5f', fontSize: 13 }}>Tu opinión es muy valiosa para nosotros.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* P1 - Sede */}
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1a1a1a' }}>¿Cuál sede visitaste?</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { v: 'Aranjuez', label: '🏪 Sede Aranjuez' },
                    { v: 'Laureles', label: '🏪 Sede Laureles' },
                    { v: 'WhatsApp', label: '📱 Cocina Oculta - WhatsApp' },
                  ].map(({ v, label }) => (
                    <button key={v} onClick={() => set('sede', v)} style={btnSel(form.sede === v)}>{label}</button>
                  ))}
                </div>
              </div>

              {/* P2 - Frecuencia */}
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1a1a1a' }}>¿Con qué frecuencia nos visitas?</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { v: 'primera_vez', label: 'Es mi primera vez' },
                    { v: 'de_vez_en_cuando', label: 'De vez en cuando' },
                    { v: 'casi_siempre', label: 'Casi todas las semanas' },
                  ].map(({ v, label }) => (
                    <button key={v} onClick={() => set('frecuencia', v)} style={btnSel(form.frecuencia === v)}>{label}</button>
                  ))}
                </div>
              </div>

              {/* P3 - Calificación atención */}
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1a1a1a' }}>¿Cómo calificarías la atención?</p>
                <Estrellas valor={form.calificacion_atencion} onChange={(n) => set('calificacion_atencion', n)} />
              </div>

              {/* P4 - Calificación producto */}
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1a1a1a' }}>¿Cómo calificarías nuestros productos?</p>
                <Estrellas valor={form.calificacion_producto} onChange={(n) => set('calificacion_producto', n)} />
              </div>

              {/* P5 - Recomendación */}
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1a1a1a' }}>¿Nos recomendarías?</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ v: 'si', label: '✅ Sí' }, { v: 'tal_vez', label: '🤔 Tal vez' }, { v: 'no', label: '❌ No' }].map(({ v, label }) => (
                    <button key={v} onClick={() => set('recomendaria', v)} style={btnSel(form.recomendaria === v)}>{label}</button>
                  ))}
                </div>
              </div>

              {/* P6 - Tiempo */}
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1a1a1a' }}>¿El tiempo de espera fue adecuado?</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[{ v: 'si', label: '✅ Sí' }, { v: 'no', label: '❌ No' }, { v: 'podria_mejorar', label: '🔄 Podría mejorar' }].map(({ v, label }) => (
                    <button key={v} onClick={() => set('tiempo_adecuado', v)} style={btnSel(form.tiempo_adecuado === v)}>{label}</button>
                  ))}
                </div>
              </div>

              {/* P7-9 - Textuales */}
              {[
                { key: 'lo_que_gusto',      label: '¿Qué fue lo que más te gustó?' },
                { key: 'producto_deseado',  label: '¿Qué postre te gustaría ver próximamente?' },
                { key: 'mejora',            label: '¿En qué podríamos mejorar?' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1a1a1a' }}>{label} <span style={{ color: '#888', fontWeight: 400, fontSize: 12 }}>(opcional)</span></p>
                  <textarea rows={2}
                    placeholder="Cuéntanos..."
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <button onClick={enviar} disabled={cargando || !form.sede || !form.frecuencia || !form.calificacion_atencion || !form.calificacion_producto || !form.recomendaria || !form.tiempo_adecuado}
                style={{ padding: '12px 24px', borderRadius: 10, background: '#CA0B0B', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Enviando...' : 'Enviar reseña 🎉'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
