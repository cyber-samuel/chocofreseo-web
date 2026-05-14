import { ShoppingBag, MapPin, CreditCard, Bike } from 'lucide-react';
import './ComoFunciona.css';

const pasos = [
  { num: '01', icono: <ShoppingBag size={28} />, titulo: 'Elige tu antojo',     desc: 'Explora el catálogo y selecciona tus productos con toppings y adiciones a tu gusto.' },
  { num: '02', icono: <MapPin      size={28} />, titulo: 'Ingresa tu dirección', desc: 'Dinos dónde estás y nos encargamos del resto. Cubrimos toda el área metropolitana.' },
  { num: '03', icono: <CreditCard  size={28} />, titulo: 'Elige cómo pagar',    desc: 'Paga en efectivo o por transferencia. Seguro y sin complicaciones.' },
  { num: '04', icono: <Bike        size={28} />, titulo: 'Recibe en casa',      desc: 'Tu pedido llega fresco y delicioso en menos de 40 minutos.' },
];

export default function ComoFunciona() {
  return (
    <section className="como-funciona">
      <div className="como-wrap">
        <div className="como-header">
          <h2 className="landing-seccion-titulo">¿Cómo funciona?</h2>
          <span className="landing-seccion-tag">Simple y rápido</span>
        </div>
        <div className="como-grid">
          {pasos.map((paso, i) => (
            <div key={paso.num} className="como-card">
              <div className="como-num">{paso.num}</div>
              <div className="como-icono">{paso.icono}</div>
              <h3 className="como-titulo">{paso.titulo}</h3>
              <p className="como-desc">{paso.desc}</p>
              {i < pasos.length - 1 && <div className="como-flecha">→</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
