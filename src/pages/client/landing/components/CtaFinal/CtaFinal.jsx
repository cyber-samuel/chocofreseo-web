import { useState } from 'react';
import './CtaFinal.css';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + '/api';

export default function CtaFinal() {
  const [sede,            setSede]            = useState('');
  const [frecuencia,      setFrecuencia]      = useState('');
  const [califAtencion,   setCalifAtencion]   = useState(0);
  const [califProducto,   setCalifProducto]   = useState(0);
  const [recomendaria,    setRecomendaria]    = useState('');
  const [tiempoAdecuado,  setTiempoAdecuado]  = useState('');
  const [loQueGusto,      setLoQueGusto]      = useState('');
  const [productoDeseado, setProductoDeseado] = useState('');
  const [mejora,          setMejora]          = useState('');
  const [enviandoResena,  setEnviandoResena]  = useState(false);
  const [enviado,         setEnviado]         = useState(false);

  const handleEnviarResena = async () => {
    if (!sede || !frecuencia || !califAtencion || !califProducto || !recomendaria || !tiempoAdecuado) return;
    setEnviandoResena(true);
    try {
      await fetch(`${API_URL}/resenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sede, frecuencia,
          calificacion_atencion: califAtencion,
          calificacion_producto: califProducto,
          recomendaria,
          tiempo_adecuado: tiempoAdecuado,
          lo_que_gusto:     loQueGusto,
          producto_deseado: productoDeseado,
          mejora,
        }),
      });
      setEnviado(true);
      setSede(''); setFrecuencia(''); setCalifAtencion(0); setCalifProducto(0);
      setRecomendaria(''); setTiempoAdecuado('');
      setLoQueGusto(''); setProductoDeseado(''); setMejora('');
      setTimeout(() => setEnviado(false), 5000);
    } catch (e) { console.error(e); }
    finally { setEnviandoResena(false); }
  };

  return (
    <section id="resenas" style={{ padding: '60px 20px', background: '#f7f8fd' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 4, color: '#CA0B0B', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>TU OPINIÓN IMPORTA</span>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a1a1a', margin: '0 0 8px' }}>¿Cómo fue tu experiencia?</h2>
          <p style={{ fontSize: 14, color: '#888', margin: '0 0 32px' }}>Tu reseña nos ayuda a mejorar y a otros clientes a conocernos</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          {enviado ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <p style={{ fontWeight: 800, color: '#166534', fontSize: 18, margin: 0 }}>¡Gracias por tu reseña!</p>
              <p style={{ color: '#555', fontSize: 14, marginTop: 6 }}>Tu opinión es muy valiosa para nosotros.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              maxWidth: 900,
              margin: '0 auto',
            }} className="resenas-grid">

              {/* COLUMNA IZQUIERDA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Sede */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                    ¿En qué sede nos visitaste?
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Aranjuez', 'Buenos Aires', 'WhatsApp'].map(s => (
                      <button key={s} type="button"
                        onClick={() => setSede(s)}
                        style={{
                          padding: '8px 14px', borderRadius: 20,
                          border: sede === s ? '2px solid #CA0B0B' : '1px solid #e5e7eb',
                          background: sede === s ? '#fff5f5' : 'white',
                          color: sede === s ? '#CA0B0B' : '#555',
                          fontWeight: sede === s ? 700 : 400,
                          cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                        }}>
                        {s === 'WhatsApp' ? 'Cocina Oculta (WhatsApp)' : 'Sede ' + s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frecuencia */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                    ¿Con qué frecuencia nos visitas?
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { v: 'primera_vez',      l: 'Primera vez' },
                      { v: 'de_vez_en_cuando', l: 'De vez en cuando' },
                      { v: 'casi_siempre',     l: 'Casi siempre' },
                    ].map(f => (
                      <button key={f.v} type="button"
                        onClick={() => setFrecuencia(f.v)}
                        style={{
                          padding: '8px 14px', borderRadius: 20,
                          border: frecuencia === f.v ? '2px solid #CA0B0B' : '1px solid #e5e7eb',
                          background: frecuencia === f.v ? '#fff5f5' : 'white',
                          color: frecuencia === f.v ? '#CA0B0B' : '#555',
                          fontWeight: frecuencia === f.v ? 700 : 400,
                          cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                        }}>
                        {f.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calificaciones */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                      Atención
                    </label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n}
                          onClick={() => setCalifAtencion(n)}
                          style={{ fontSize: 22, cursor: 'pointer', color: n <= califAtencion ? '#f59e0b' : '#d1d5db' }}>★</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                      Producto
                    </label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n}
                          onClick={() => setCalifProducto(n)}
                          style={{ fontSize: 22, cursor: 'pointer', color: n <= califProducto ? '#f59e0b' : '#d1d5db' }}>★</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ¿Recomendarías? */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                    ¿Nos recomendarías?
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { v: 'si',      l: 'Sí, claro' },
                      { v: 'tal_vez', l: 'Tal vez' },
                      { v: 'no',      l: 'No' },
                    ].map(r => (
                      <button key={r.v} type="button"
                        onClick={() => setRecomendaria(r.v)}
                        style={{
                          flex: 1, padding: '8px', borderRadius: 10,
                          border: recomendaria === r.v ? '2px solid #CA0B0B' : '1px solid #e5e7eb',
                          background: recomendaria === r.v ? '#fff5f5' : 'white',
                          color: recomendaria === r.v ? '#CA0B0B' : '#555',
                          fontWeight: recomendaria === r.v ? 700 : 400,
                          cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                        }}>
                        {r.l}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* COLUMNA DERECHA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ¿Tiempo adecuado? */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                    ¿El tiempo de entrega fue adecuado?
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { v: 'si',             l: 'Sí' },
                      { v: 'podria_mejorar', l: 'Podría mejorar' },
                      { v: 'no',             l: 'No' },
                    ].map(t => (
                      <button key={t.v} type="button"
                        onClick={() => setTiempoAdecuado(t.v)}
                        style={{
                          flex: 1, padding: '8px', borderRadius: 10,
                          border: tiempoAdecuado === t.v ? '2px solid #CA0B0B' : '1px solid #e5e7eb',
                          background: tiempoAdecuado === t.v ? '#fff5f5' : 'white',
                          color: tiempoAdecuado === t.v ? '#CA0B0B' : '#555',
                          fontWeight: tiempoAdecuado === t.v ? 700 : 400,
                          cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                        }}>
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ¿Qué te gustó? */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                    ¿Qué fue lo que más te gustó?
                  </label>
                  <textarea
                    rows={2}
                    value={loQueGusto}
                    onChange={e => setLoQueGusto(e.target.value)}
                    placeholder="Cuéntanos qué estuvo increíble..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* ¿Qué postre quisieras ver? */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                    ¿Qué postre quisieras ver próximamente?
                  </label>
                  <textarea
                    rows={2}
                    value={productoDeseado}
                    onChange={e => setProductoDeseado(e.target.value)}
                    placeholder="Dinos qué antojo nos falta..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* ¿En qué podríamos mejorar? */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                    ¿En qué podríamos mejorar?
                  </label>
                  <textarea
                    rows={2}
                    value={mejora}
                    onChange={e => setMejora(e.target.value)}
                    placeholder="Tu opinión nos ayuda a crecer..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Botón enviar */}
                <button
                  type="button"
                  onClick={handleEnviarResena}
                  disabled={enviandoResena}
                  style={{
                    width: '100%', padding: '14px',
                    borderRadius: 10, border: 'none',
                    background: enviandoResena ? '#e5e7eb' : '#CA0B0B',
                    color: enviandoResena ? '#aaa' : 'white',
                    fontWeight: 800, fontSize: 15, fontFamily: 'inherit',
                    cursor: enviandoResena ? 'not-allowed' : 'pointer',
                    marginTop: 'auto',
                  }}>
                  {enviandoResena ? 'Enviando...' : 'Enviar reseña'}
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
