import { useNavigate } from 'react-router-dom';
import './Hero.css';

const estaAbierto = () => {
  const co = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const h = co.getUTCHours() + co.getUTCMinutes() / 60;
  return h >= 13 && h < 20;
};

const FresaSVG = ({ className }) => (
  <svg className={className} viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" fill="rgba(0,0,0,0.2)">
    <path d="M40 95 C20 95 8 75 8 58 C8 40 20 28 40 28 C60 28 72 40 72 58 C72 75 60 95 40 95Z"/>
    <path d="M40 28 C40 28 22 18 18 28 C28 32 40 28 40 28Z"/>
    <path d="M40 28 C40 28 58 18 62 28 C52 32 40 28 40 28Z"/>
    <rect x="38" y="8" width="4" height="22" rx="2"/>
  </svg>
);

const DuraznoSVG = ({ className }) => (
  <svg className={className} viewBox="0 0 90 105" xmlns="http://www.w3.org/2000/svg" fill="rgba(0,0,0,0.18)">
    <path d="M45 98 C20 98 10 78 10 60 C10 38 25 22 45 22 C65 22 80 38 80 60 C80 78 70 98 45 98Z"/>
    <path d="M45 22 C45 22 38 8 45 5 C52 8 45 22 45 22Z"/>
    <path d="M45 22 L45 65" stroke="rgba(0,0,0,0.12)" strokeWidth="3" fill="none"/>
  </svg>
);

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-contenido">
        <div className="hero-tag">Artesanal y con amor</div>
        {estaAbierto()
          ? <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-block', marginBottom: 8 }}>🟢 Abierto ahora</span>
          : <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-block', marginBottom: 8 }}>🔴 Cerrado · Abrimos 1PM</span>
        }
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
          <img
            src="https://images.unsplash.com/photo-1606312619070-d48b6de9bee7?w=500&q=80"
            alt="ChocoFreseo producto"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          />
          <div className="hero-badge hero-badge-1">Más pedido hoy</div>
          <div className="hero-badge hero-badge-2">Envíos rápidos</div>
        </div>
      </div>

      <div className="hero-fondo">
        <FresaSVG className="hero-fruta hero-fruta-1" />
        <FresaSVG className="hero-fruta hero-fruta-2" />
        <FresaSVG className="hero-fruta hero-fruta-3" />
        <DuraznoSVG className="hero-fruta hero-fruta-4" />
        <DuraznoSVG className="hero-fruta hero-fruta-5" />
      </div>
    </section>
  );
}