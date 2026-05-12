import { useState } from 'react';
import './CtaFinal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Estrellas({ valor, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} onClick={() => onChange(n)}
          style={{ fontSize: 24, cursor: 'pointer', color: n <= valor ? '#f59e0b' : '#d1d5db', lineHeight: 1 }}>★</span>
      ))}
    </div>
  );
}

const INICIAL = {
  sede: '', frecuencia: '', calificacion_atencion: 0, calificacion_producto: 0,
  recomendaria: '', tiempo_adecuado: '', lo_que_gusto: '', producto_deseado: '', mejora: '',
};

export default function CtaFinal() {
  const [form,     setForm]     = useState(INICIAL);
  const [enviado,  setEnviado]  = useState(false);
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
    padding: '8px 12px', borderRadius: 8, border: `2px solid ${activo ? '#CA0B0B' : '#e5e7eb'}`,
    background: activo ? '#fff5f5' : '#fff', color: activo ? '#CA0B0B' : '#555',
    fontWeight: activo ? 700 : 400, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
  });

  return (
    <section id="resenas" style={{ background: '#f8f9fb', padding: '60px 16px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ background: '#fff5f5', color: '#CA0B0B', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Tu opinión importa</span>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a1a1a', margin: '10px 0 6px' }}>¿Cómo fue tu experiencia?</h2>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Tu reseña nos ayuda a mejorar y a seguir sorprendiéndote</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          {enviado ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <p style={{ fontWeight: 800, color: '#166534', fontSize: 18, margin: 0 }}>¡Gracias por tu reseña!</p>
              <p style={{ color: '#555', fontSize: 14, marginTop: 6 }}>Tu opinión es muy valiosa para nosotros.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Fila 1: Sede + Frecuencia */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#333' }}>¿Qué sede visitaste?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      { v: 'Aranjuez', label: '🏪 Aranjuez' },
                      { v: 'Laureles', label: '🏪 Laureles' },
                      { v: 'WhatsApp', label: '📱 WhatsApp' },
                    ].map(({ v, label }) => (
                      <button key={v} onClick={() => set('sede', v)} style={btnSel(form.sede === v)}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#333' }}>¿Con qué frecuencia?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      { v: 'primera_vez',       label: 'Primera vez' },
                      { v: 'de_vez_en_cuando',  label: 'De vez en cuando' },
                      { v: 'casi_siempre',      label: 'Casi siempre' },
                    ].map(({ v, label }) => (
                      <button key={v} onClick={() => set('frecuencia', v)} style={btnSel(form.frecuencia === v)}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fila 2: Calificaciones */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#333' }}>Atención recibida</p>
                  <Estrellas valor={form.calificacion_atencion} onChange={(n) => set('calificacion_atencion', n)} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#333' }}>Calidad del producto</p>
                  <Estrellas valor={form.calificacion_producto} onChange={(n) => set('calificacion_producto', n)} />
                </div>
              </div>

              {/* Fila 3: ¿Recomiendas? + ¿Tiempo adecuado? */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#333' }}>¿Nos recomendarías?</p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {[{ v: 'si', label: '✅ Sí' }, { v: 'tal_vez', label: '🤔 Tal vez' }, { v: 'no', label: '❌ No' }].map(({ v, label }) => (
                      <button key={v} onClick={() => set('recomendaria', v)} style={btnSel(form.recomendaria === v)}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#333' }}>¿Tiempo de espera?</p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {[{ v: 'si', label: '✅ Adecuado' }, { v: 'no', label: '❌ No' }, { v: 'podria_mejorar', label: '🔄 Regular' }].map(({ v, label }) => (
                      <button key={v} onClick={() => set('tiempo_adecuado', v)} style={btnSel(form.tiempo_adecuado === v)}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fila 4: Textareas opcionales */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { key: 'lo_que_gusto',     label: '¿Qué te gustó más?' },
                  { key: 'producto_deseado', label: '¿Postre deseado?' },
                  { key: 'mejora',           label: '¿En qué mejorar?' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, color: '#666' }}>{label} <span style={{ color: '#bbb' }}>(opc.)</span></p>
                    <textarea rows={2} placeholder="Cuéntanos..."
                      value={form[key]} onChange={(e) => set(key, e.target.value)}
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb', padding: '6px 10px', fontSize: 12, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>

              <button onClick={enviar}
                disabled={cargando || !form.sede || !form.frecuencia || !form.calificacion_atencion || !form.calificacion_producto || !form.recomendaria || !form.tiempo_adecuado}
                style={{ padding: '12px 24px', borderRadius: 10, background: '#CA0B0B', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', opacity: (cargando || !form.sede || !form.frecuencia || !form.calificacion_atencion || !form.calificacion_producto || !form.recomendaria || !form.tiempo_adecuado) ? 0.5 : 1 }}>
                {cargando ? 'Enviando...' : 'Enviar reseña 🎉'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
