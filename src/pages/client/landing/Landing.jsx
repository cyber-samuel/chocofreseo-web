import { useState, useEffect } from 'react';
import ClientLayout from '../../../components/layout/ClientLayout';
import Hero         from './components/Hero';
import Conocenos    from './components/Conocenos';
import CtaFinal     from './components/CtaFinal';
import { ShoppingBag, MapPin, CreditCard, Truck } from 'lucide-react';
import './Landing.css';

const IconoInstagram = ({ size = 20, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const IconoTikTok = ({ size = 20, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.28 8.28 0 004.84 1.56V6.78a4.85 4.85 0 01-1.07-.09z" />
  </svg>
);

const PRODUCTOS_ESTRELLA = [
  { nombre: 'Fresas con chocolate', keywords: ['fresa', 'chocolate'] },
  { nombre: 'ChocoBowls',           keywords: ['bowl', 'chocobowl'] },
  { nombre: 'ChocoNachos',          keywords: ['nacho', 'choconacho'] },
  { nombre: 'CherryCream',          keywords: ['cherry', 'cream'] },
  { nombre: 'KrispiCream',          keywords: ['krispi', 'krispi cream'] },
  { nombre: 'ChocoSpaguetis',       keywords: ['spagueti', 'spagheti'] },
  { nombre: 'Frappés',              keywords: ['frappe', 'frappé'] },
  { nombre: 'Crema Antigravedad®',  keywords: ['antigravedad', 'crema anti'] },
];

const PASOS = [
  { icono: <ShoppingBag size={28} />, numero: '01', titulo: 'Elige tu antojo',    desc: 'Explora el catálogo, personaliza con toppings, salsas y adiciones' },
  { icono: <MapPin      size={28} />, numero: '02', titulo: 'Marca tu ubicación', desc: 'Pon el pin en el mapa y calculamos el domicilio automáticamente' },
  { icono: <CreditCard  size={28} />, numero: '03', titulo: 'Elige cómo pagar',  desc: 'Efectivo, transferencia o mixto. Sin complicaciones' },
  { icono: <Truck       size={28} />, numero: '04', titulo: 'Recíbelo freseo',    desc: 'Tu pedido llega directo a tu puerta, fresquito y delicioso' },
];

export default function Landing() {
  const [productosDB, setProductosDB] = useState([]);

  useEffect(() => {
    document.title = 'ChocoFreseo | Chocolates, Fresas y Postres en Medellín';
  }, []);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/catalogo/productos`)
      .then(r => r.json())
      .then(d => setProductosDB(d.data || []))
      .catch(() => {});
  }, []);

  const getImgProducto = (keywords) => {
    const prod = productosDB.find(p =>
      keywords.some(k => p.nombre.toLowerCase().includes(k.toLowerCase()))
    );
    return prod?.img || null;
  };

  return (
    <ClientLayout>
      <Hero />

      {/* ── Sección de video ── */}
      <section style={{ padding: '60px 20px', background: 'white' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a1a1a', marginBottom: 8 }}>
            Míranos en acción 🎬
          </h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>
            Síguenos en TikTok e Instagram para ver nuestras creaciones
          </p>

          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: 20, overflow: 'hidden',
            aspectRatio: '16/9', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            maxWidth: 640, margin: '0 auto 24px',
          }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>▶️</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Video próximamente</div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>@chocofreseo en TikTok</div>
            </div>
            <div style={{
              position: 'absolute', top: 16, right: 16,
              background: '#CA0B0B', borderRadius: 6,
              padding: '4px 10px', fontSize: 11,
              color: 'white', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <IconoTikTok size={11} /> TikTok
            </div>
          </div>

          {/* Orden: TikTok @chocofreseo · Instagram @chocofreseo · TikTok @sorprendetupaladar */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://tiktok.com/@chocofreseo" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#1a1a1a', color: 'white',
                textDecoration: 'none', padding: '10px 20px',
                borderRadius: 10, fontWeight: 700, fontSize: 13,
              }}>
              <IconoTikTok size={16} /> @chocofreseo
            </a>
            <a href="https://instagram.com/chocofreseo" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                color: 'white', textDecoration: 'none',
                padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13,
              }}>
              <IconoInstagram size={16} /> @chocofreseo
            </a>
            <a href="https://tiktok.com/@sorprendetupaladar" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#1a1a1a', color: 'white',
                textDecoration: 'none', padding: '10px 20px',
                borderRadius: 10, fontWeight: 700, fontSize: 13,
              }}>
              <IconoTikTok size={16} /> @sorprendetupaladar
            </a>
          </div>
        </div>
      </section>

      {/* ── Productos estrella ── */}
      <section style={{ padding: '60px 20px', background: '#f7f8fd' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', marginBottom: 8 }}>
            Nuestros productos estrella ⭐
          </h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 40 }}>
            Creaciones únicas que no encontrarás en ningún otro lugar
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {PRODUCTOS_ESTRELLA.map(p => {
              const img = getImgProducto(p.keywords);
              return (
                <div key={p.nombre} style={{
                  borderRadius: 16, overflow: 'hidden',
                  background: img ? 'transparent' : 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(202,11,11,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
                }}>
                  <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
                    {img ? (
                      <img src={img} alt={p.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #CA0B0B22, #1a1a1a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{
                          fontSize: 32, fontWeight: 900,
                          color: 'rgba(255,255,255,0.15)',
                          textAlign: 'center', padding: '0 16px',
                          lineHeight: 1.2,
                        }}>
                          {p.nombre.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                      padding: '24px 14px 12px',
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                        {p.nombre}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 32 }}>
            <a href="/catalogo" style={{
              display: 'inline-block',
              background: '#CA0B0B', color: 'white',
              textDecoration: 'none', padding: '14px 36px',
              borderRadius: 10, fontWeight: 700, fontSize: 15,
            }}>Ver catálogo completo →</a>
          </div>
        </div>
      </section>

      {/* ── El proceso más freseo ── */}
      <section style={{ background: '#1a1a1a', padding: '70px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 300, height: 300, background: 'radial-gradient(circle, rgba(202,11,11,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(202,11,11,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 4, color: '#CA0B0B', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
              ASÍ DE SIMPLE
            </span>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: 'white', margin: '0 0 12px', lineHeight: 1.1 }}>
              El proceso más freseo
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
              De tu antojo a tu puerta en pocos pasos
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {PASOS.map((paso, i) => (
              <div key={i} style={{
                padding: '32px 28px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(202,11,11,0.08)',
                borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                position: 'relative',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(202,11,11,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(202,11,11,0.08)'; }}
              >
                <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 64, fontWeight: 900, color: 'rgba(255,255,255,0.04)', lineHeight: 1, userSelect: 'none' }}>
                  {paso.numero}
                </div>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(202,11,11,0.2)', border: '1px solid rgba(202,11,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CA0B0B', marginBottom: 20 }}>
                  {paso.icono}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#CA0B0B', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                  PASO {paso.numero}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.2 }}>
                  {paso.titulo}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  {paso.desc}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <a href="/catalogo" style={{ display: 'inline-block', background: '#CA0B0B', color: 'white', textDecoration: 'none', padding: '14px 40px', borderRadius: 10, fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>
              Pedir ahora
            </a>
          </div>
        </div>
      </section>

      <Conocenos />
      <CtaFinal />
    </ClientLayout>
  );
}
