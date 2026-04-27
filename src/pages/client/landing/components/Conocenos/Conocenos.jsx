import './Conocenos.css';

const valores = ['Ingredientes frescos', 'Recetas artesanales', 'Entrega rápida', 'Calidad garantizada'];

export default function Conocenos() {
  return (
    <section className="conocenos" id="conocenos">
      <div className="conocenos-wrap">
        <div className="conocenos-imagen">
          <div className="conocenos-img-placeholder">
            <span className="conocenos-img-texto">Video o imagen promocional</span>
          </div>
          <div className="conocenos-badge">Hecho con amor desde 2020</div>
        </div>

        <div className="conocenos-contenido">
          <span className="landing-seccion-tag">Nuestra historia</span>
          <h2 className="conocenos-titulo">Somos ChocoFreseo</h2>
          <p className="conocenos-texto">
            Nacimos con una sola misión: llevar felicidad a cada hogar de Medellín a través de postres artesanales únicos. Cada helado, waffle y crepe es preparado con ingredientes frescos y mucho amor.
          </p>
          <p className="conocenos-texto">
            Más de 4 años llevando sonrisas a nuestros clientes, siempre buscando innovar y sorprenderte con nuevos sabores y combinaciones irresistibles.
          </p>
          <div className="conocenos-valores">
            {valores.map((v) => (
              <div key={v} className="conocenos-valor">
                <div className="conocenos-check">✓</div>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}