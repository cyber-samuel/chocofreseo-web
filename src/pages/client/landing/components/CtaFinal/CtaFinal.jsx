import { useNavigate } from 'react-router-dom';
import './CtaFinal.css';

export default function CtaFinal() {
  const navigate = useNavigate();
  return (
    <section className="cta-final">
      <div className="cta-deco cta-deco-1" />
      <div className="cta-deco cta-deco-2" />
      <div className="cta-contenido">
        <span className="cta-tag">🛵 Envíos todos los días</span>
        <h2 className="cta-titulo">¿Listo para el mejor antojo?</h2>
        <p className="cta-subtitulo">
          Pide ahora y recibe en menos de 40 minutos directo en tu puerta.
        </p>
        <button className="cta-btn" onClick={() => navigate('/catalogo')}>
          Pedir ahora
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </section>
  );
}