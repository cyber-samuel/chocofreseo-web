import './Conocenos.css';

const valores = [
  { icono: '🍫', titulo: 'Calidad', desc: 'Ingredientes frescos seleccionados cada día para garantizar el mejor sabor.' },
  { icono: '✨', titulo: 'Sabor', desc: 'Recetas artesanales únicas que no encontrarás en ningún otro lugar de Medellín.' },
  { icono: '🛵', titulo: 'Rapidez', desc: 'Domicilio a todo el Valle de Aburrá en menos de 40 minutos.' },
];

export default function Conocenos() {
  return (
    <section className="conocenos" id="nosotros">
      <div className="conocenos-wrap">
        <div className="conocenos-imagen">
          <div className="conocenos-img-placeholder">
            <span className="conocenos-img-texto">📍 Sede Aranjuez, Medellín</span>
          </div>
          <div className="conocenos-badge">Hecho con amor desde 2020</div>
        </div>

        <div className="conocenos-contenido">
          <span className="landing-seccion-tag">Nuestra historia</span>
          <h2 className="conocenos-titulo">Conócenos</h2>
          <p className="conocenos-texto">
            Somos ChocoFreseo, una chocolatería artesanal ubicada en el corazón de Aranjuez, Medellín.
            Nació con una misión: llevar felicidad a cada hogar a través de postres únicos preparados con los mejores ingredientes.
          </p>
          <p className="conocenos-texto">
            Hacemos domicilios a todo el Valle de Aburrá — Medellín, Bello, Itagüí, Envigado, Sabaneta, La Estrella y más.
          </p>

          {/* Info operativa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#555' }}>
              <span style={{ fontSize: 18 }}>🕐</span>
              <span><strong>Horario:</strong> Lunes a domingo · 1:00 PM – 8:00 PM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#555' }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <span><strong>Dirección:</strong> Cl. 90 #50d-35, Aranjuez, Medellín</span>
            </div>
          </div>

          {/* Cards de valores */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            {valores.map((v) => (
              <div key={v.titulo} style={{
                flex: 1, minWidth: 130, background: '#fff', borderRadius: 12, padding: '16px 14px',
                border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{v.icono}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a1a', marginBottom: 4 }}>{v.titulo}</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
