import { useNavigate } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-contenido">
        <div className="hero-tag">🍫 Artesanal y con amor</div>
        <h1 className="hero-titulo">
          El sabor que<br />
          <span className="hero-titulo-rojo">te enamora</span>
        </h1>
        <p className="hero-subtitulo">
          Helados, waffles y crepes artesanales hechos con los mejores ingredientes.
          Directo a tu puerta en Medellín.
        </p>
        <div className="hero-botones">
          <button className="hero-btn-primario" onClick={() => navigate('/catalogo')}>
            Ver catálogo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <a href="#conocenos" className="hero-btn-secundario">Conocernos</a>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-valor">500+</span>
            <span className="hero-stat-label">Clientes felices</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-valor">20+</span>
            <span className="hero-stat-label">Productos únicos</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-valor">4.9★</span>
            <span className="hero-stat-label">Calificación</span>
          </div>
        </div>
      </div>

      <div className="hero-imagen">
        <div className="hero-imagen-wrap">
          <div className="hero-imagen-placeholder">
            <span className="hero-emoji">🍫</span>
            <span className="hero-emoji-sub">Tu imagen aquí</span>
          </div>
          <div className="hero-badge hero-badge-1">🔥 Más pedido hoy</div>
          <div className="hero-badge hero-badge-2">⚡ Envío en 30 min</div>
        </div>
      </div>

      <div className="hero-fondo">
        <div className="hero-deco hero-deco-1" />
        <div className="hero-deco hero-deco-2" />
        <div className="hero-deco hero-deco-3" />
      </div>
    </section>
  );
}