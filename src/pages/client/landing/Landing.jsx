import { useEffect } from 'react';
import ClientLayout from '../../../components/layout/ClientLayout';
import Hero         from './components/Hero';
import ComoFunciona from './components/ComoFunciona';
import Conocenos    from './components/Conocenos';
import CtaFinal     from './components/CtaFinal';
import './Landing.css';

const productosEstrella = [
  { emoji: '🍓', nombre: 'Fresas con chocolate', desc: 'El clásico que nunca falla' },
  { emoji: '🍫', nombre: 'ChocoBowls',           desc: 'Bowl de chocolate con toppings' },
  { emoji: '🌮', nombre: 'ChocoNachos',           desc: 'Lo salado versión postre' },
  { emoji: '🍒', nombre: 'CherryCream',           desc: 'Cremoso y delicioso' },
  { emoji: '🥐', nombre: 'KrispiCream',           desc: 'Crujiente y suave a la vez' },
  { emoji: '🍝', nombre: 'ChocoSpaguetis',        desc: 'Lo más viral de la carta' },
  { emoji: '☕', nombre: 'Frappés',               desc: 'Fríos y reconfortantes' },
  { emoji: '✨', nombre: 'Crema Antigravedad®',   desc: 'Nuestra creación especial' },
];

export default function Landing() {
  useEffect(() => {
    document.title = 'ChocoFreseo | Chocolates, Fresas y Postres en Medellín';
  }, []);

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
            }}>🎵 TikTok</div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://instagram.com/chocofreseo" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                color: 'white', textDecoration: 'none',
                padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13,
              }}>📸 @chocofreseo</a>
            <a href="https://tiktok.com/@chocofreseo" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#1a1a1a', color: 'white',
                textDecoration: 'none', padding: '10px 20px',
                borderRadius: 10, fontWeight: 700, fontSize: 13,
              }}>🎵 @chocofreseo</a>
            <a href="https://tiktok.com/@sorprendetupaladar" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#1a1a1a', color: 'white',
                textDecoration: 'none', padding: '10px 20px',
                borderRadius: 10, fontWeight: 700, fontSize: 13,
              }}>🎵 @sorprendetupaladar</a>
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
            {productosEstrella.map(p => (
              <div key={p.nombre} style={{
                background: 'white', borderRadius: 16,
                padding: '20px 16px', textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(202,11,11,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
              }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{p.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{p.nombre}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{p.desc}</div>
              </div>
            ))}
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

      <ComoFunciona />
      <Conocenos />
      <CtaFinal />

      {/* ── Footer ── */}
      <footer style={{ background: '#1a1a1a', color: 'white', padding: '48px 20px 24px' }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 32, marginBottom: 40,
        }}>

          <div>
            <img
              src="https://res.cloudinary.com/dnoxlv5kn/image/upload/v1778822634/logo_sin_fondo_remove_uuu8tt.png"
              alt="ChocoFreseo"
              style={{ height: 50, objectFit: 'contain', marginBottom: 12 }}
            />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Postres con estética juvenil y sabores únicos.
              Puro Freseo desde marzo 2024.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="https://instagram.com/chocofreseo" target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, textDecoration: 'none' }}>📸</a>
              <a href="https://tiktok.com/@chocofreseo" target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, textDecoration: 'none' }}>🎵</a>
              <a href="https://wa.me/573006083166" target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, textDecoration: 'none' }}>💬</a>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'white' }}>Nuestras sedes</h4>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#CA0B0B', fontWeight: 700, marginBottom: 4 }}>📍 Sede Buenos Aires</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                Carrera 29 #42-49<br />Buenos Aires, Medellín
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#CA0B0B', fontWeight: 700, marginBottom: 4 }}>📍 Sede Aranjuez</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                Calle 90 #50D-35<br />Aranjuez, Medellín
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'white' }}>Horario y contacto</h4>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 2 }}>
              <div>🕐 Lunes a domingo</div>
              <div style={{ fontWeight: 700, color: 'white' }}>1:00 PM - 8:00 PM</div>
              <div style={{ marginTop: 12 }}>
                <a href="https://wa.me/573006083166"
                  style={{ color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
                  💬 300-608-31-66
                </a>
              </div>
              <div style={{ marginTop: 4 }}>
                <a href="mailto:chocofreseo@gmail.com"
                  style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 12 }}>
                  ✉️ chocofreseo@gmail.com
                </a>
              </div>
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
            © 2024 ChocoFreseo · Todos los derechos reservados ·
            <span style={{ color: '#CA0B0B', marginLeft: 4 }}>Puro Freseo 🍓</span>
          </p>
        </div>
      </footer>
    </ClientLayout>
  );
}
