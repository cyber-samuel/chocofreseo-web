import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar/Navbar';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import * as api from '../../../services/api';
import './Catalogo.css';

function ModalToppings({ open, onNext, onClose, producto, toppingsDisponibles }) {
  const [toppings, setToppings] = useState([]);
  if (!open || !producto) return null;
  const maxTop = producto.max_toppings || 99;

  const toggleTopping = (t) => {
    const existe = toppings.find((x) => x.id_topping === t.id_topping);
    if (existe) setToppings((p) => p.filter((x) => x.id_topping !== t.id_topping));
    else {
      if (toppings.length >= maxTop) return;
      setToppings((p) => [...p, t]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-paso">
        <div className="modal-paso-header">
          <div>
            <h3 className="modal-paso-titulo">{producto.nombre}</h3>
            <p className="modal-paso-sub">
              Elige tus toppings
              <span className="modal-paso-contador"> {toppings.length}/{maxTop}</span>
            </p>
          </div>
          <button className="modal-cerrar-x" onClick={() => { setToppings([]); onClose(); }}>✕</button>
        </div>
        <div className="modal-items-grid">
          {toppingsDisponibles.map((t) => {
            const sel      = toppings.find((x) => x.id_topping === t.id_topping);
            const disabled = !sel && toppings.length >= maxTop;
            return (
              <button
                key={t.id_topping}
                className={`modal-item-card ${sel ? 'activo' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && toggleTopping(t)}
              >
                <div className="modal-item-img">🍫</div>
                <span className="modal-item-nombre">{t.nombre}</span>
                {sel && <div className="modal-item-check">✓</div>}
              </button>
            );
          })}
        </div>
        <div className="modal-paso-footer">
          <button className="modal-btn-sec" onClick={() => { setToppings([]); onClose(); }}>Cancelar</button>
          <button className="modal-btn-pri" onClick={() => { onNext(toppings); setToppings([]); }}>
            Continuar
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalAdiciones({ open, onConfirmar, onClose, producto, toppingsSeleccionados, adicionesDisponibles }) {
  const [adiciones, setAdiciones] = useState([]);
  if (!open || !producto) return null;

  const toggleAdicion = (a) => {
    const existe = adiciones.find((x) => x.id_adicion === a.id_adicion);
    if (existe) setAdiciones((p) => p.filter((x) => x.id_adicion !== a.id_adicion));
    else        setAdiciones((p) => [...p, a]);
  };

  const subtotal = Number(producto.precio) + adiciones.reduce((acc, a) => acc + Number(a.precio), 0);

  return (
    <div className="modal-overlay">
      <div className="modal-paso">
        <div className="modal-paso-header">
          <div>
            <h3 className="modal-paso-titulo">{producto.nombre}</h3>
            <p className="modal-paso-sub">Agrega algo extra <span className="modal-paso-opcional">— Opcional</span></p>
          </div>
          <button className="modal-cerrar-x" onClick={() => { setAdiciones([]); onClose(); }}>✕</button>
        </div>
        {toppingsSeleccionados.length > 0 && (
          <div className="modal-toppings-resumen">
            <span className="modal-toppings-label">Toppings:</span>
            {toppingsSeleccionados.map((t) => (
              <span key={t.id_topping} style={{ background: '#1a1a1a', color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{t.nombre}</span>
            ))}
          </div>
        )}
        <div className="modal-items-grid">
          {adicionesDisponibles.map((a) => {
            const sel = adiciones.find((x) => x.id_adicion === a.id_adicion);
            return (
              <button
                key={a.id_adicion}
                className={`modal-item-card ${sel ? 'activo' : ''}`}
                onClick={() => toggleAdicion(a)}
              >
                <div className="modal-item-img">🍯</div>
                <span className="modal-item-nombre">{a.nombre}</span>
                <span className="modal-item-precio">+${Number(a.precio).toLocaleString()}</span>
                {sel && <div className="modal-item-check">✓</div>}
              </button>
            );
          })}
        </div>
        <div className="modal-subtotal-row">
          <span className="modal-subtotal-label">Subtotal</span>
          <span className="modal-subtotal-valor">${subtotal.toLocaleString()}</span>
        </div>
        <div className="modal-paso-footer">
          <button className="modal-btn-sec" onClick={() => { setAdiciones([]); onClose(); }}>Cancelar</button>
          <button className="modal-btn-pri" onClick={() => {
            onConfirmar({ ...producto, toppings: toppingsSeleccionados, adiciones, subtotal, cantidad: 1 });
            setAdiciones([]);
          }}>
            Agregar al carrito
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalLoginRequerido({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-login-req">
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h3 className="modal-login-titulo">Inicia sesión para continuar</h3>
        <p className="modal-login-desc">Necesitas una cuenta para agregar productos al carrito.</p>
        <div className="modal-login-botones">
          <button className="btn-login-req-sec" onClick={onClose}>Cancelar</button>
          <a href="/login" className="btn-login-req-pri">Iniciar sesión</a>
        </div>
        <p className="modal-login-registro">
          ¿No tienes cuenta? <a href="/registro" className="modal-login-link">Regístrate gratis</a>
        </p>
      </div>
    </div>
  );
}

function CarritoBottom({ carrito, subtotal, totalItems, onCambiarCantidad, onQuitar, onIrCheckout }) {
  const [expandido, setExpandido] = useState(false);

  if (carrito.length === 0) {
    return (
      <div className="carrito-bottom carrito-bottom--vacio">
        <div className="carrito-vacio-msg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span>Tu carrito está vacío — agrega productos para comenzar</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {expandido && <div className="carrito-backdrop" onClick={() => setExpandido(false)} />}
      <div className={`carrito-bottom ${expandido ? 'carrito-bottom--expandido' : ''}`}>
        <div className={`carrito-panel ${expandido ? 'carrito-panel--visible' : ''}`}>
          <div className="carrito-drag-handle" onClick={() => setExpandido(false)}>
            <div className="carrito-drag-pill" />
          </div>
          <div className="carrito-layout">
            <div className="carrito-col-items">
              <h3 className="carrito-col-titulo">Tu pedido</h3>
              <div className="carrito-items-lista">
                {carrito.map((item) => (
                  <div key={item.lineaId} className="carrito-item">
                    <div className="carrito-item-thumb">🍫</div>
                    <div className="carrito-item-info">
                      <span className="carrito-item-nombre">{item.nombre}</span>
                      {(item.toppings?.length > 0 || item.adiciones?.length > 0) && (
                        <div className="carrito-item-extras">
                          {item.toppings?.map((t) => (
                            <span key={t.id_topping} style={{ background: '#1a1a1a', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{t.nombre}</span>
                          ))}
                          {item.adiciones?.map((a) => (
                            <span key={a.id_adicion} style={{ background: '#d97706', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>+{a.nombre}</span>
                          ))}
                        </div>
                      )}
                      <span className="carrito-item-precio-unit">
                        ${(item.subtotal / item.cantidad).toLocaleString()} c/u
                      </span>
                    </div>
                    <div className="carrito-controles">
                      <button className="carrito-ctrl-btn" onClick={() => onCambiarCantidad(item.lineaId, item.cantidad - 1)}>−</button>
                      <span className="carrito-ctrl-num">{item.cantidad}</span>
                      <button className="carrito-ctrl-btn" onClick={() => onCambiarCantidad(item.lineaId, item.cantidad + 1)}>+</button>
                    </div>
                    <span className="carrito-item-precio-total">${item.subtotal.toLocaleString()}</span>
                    <button className="carrito-item-quitar" onClick={() => onQuitar(item.lineaId)} title="Quitar">×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="carrito-col-resumen">
              <h3 className="carrito-resumen-titulo">Resumen</h3>
              <div className="carrito-resumen-fila">
                <span>Total productos</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="carrito-resumen-fila">
                <span>Domicilio</span>
                <span className="carrito-domicilio-badge">Por confirmar</span>
              </div>
              <div className="carrito-resumen-divisor" />
              <div className="carrito-resumen-fila carrito-resumen-fila--total">
                <span>Subtotal</span>
                <strong>${subtotal.toLocaleString()}</strong>
              </div>
              <button className="carrito-btn-checkout" onClick={onIrCheckout}>Hacer pedido</button>
              <p className="carrito-resumen-items-count">{totalItems} {totalItems === 1 ? 'ítem' : 'ítems'} en el carrito</p>
            </div>
          </div>
        </div>
        <div className="carrito-barra">
          <div className="carrito-barra-izq" onClick={() => setExpandido((v) => !v)}>
            <div className="carrito-barra-badge">{totalItems}</div>
            <div className="carrito-barra-sep" />
            <span className="carrito-barra-label">Ver pedido</span>
            {!expandido && (
              <div className="carrito-barra-resumen">
                {carrito.slice(0, 2).map((item) => (
                  <span key={item.lineaId} className="carrito-barra-chip">{item.cantidad}× {item.nombre}</span>
                ))}
                {carrito.length > 2 && <span className="carrito-barra-chip carrito-barra-chip--mas">+{carrito.length - 2} más</span>}
              </div>
            )}
            <svg className={`carrito-barra-chevron ${expandido ? 'carrito-barra-chevron--arriba' : ''}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </div>
          <div className="carrito-barra-der">
            <span className="carrito-barra-subtotal">${subtotal.toLocaleString()}</span>
            <button className="carrito-barra-btn-checkout" onClick={(e) => { e.stopPropagation(); onIrCheckout(); }}>
              Hacer pedido
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Catalogo() {
  const { carrito, agregarItem, quitarItem, cambiarCantidad, subtotal, totalItems } = useCart();
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  const [productos,       setProductos]       = useState([]);
  const [categorias,      setCategorias]      = useState([{ id_categoria: 0, nombre: 'Todos' }]);
  const [toppings,        setToppings]        = useState([]);
  const [adiciones,       setAdiciones]       = useState([]);
  const [cargando,        setCargando]        = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState(0);
  const [busqueda,        setBusqueda]        = useState('');
  const [productoActual,  setProductoActual]  = useState(null);
  const [toppingsSelec,   setToppingsSelec]   = useState([]);
  const [modalToppings,   setModalToppings]   = useState(false);
  const [modalAdiciones,  setModalAdiciones]  = useState(false);
  const [modalLogin,      setModalLogin]      = useState(false);

  useEffect(() => {
    Promise.all([
      api.catalogoProductos(),
      api.catalogoCategorias(),
      api.catalogoToppings(),
      api.catalogoAdiciones(),
    ]).then(([prods, cats, tops, adics]) => {
      setProductos(prods || []);
      setCategorias([{ id_categoria: 0, nombre: 'Todos' }, ...(cats || [])]);
      setToppings(tops || []);
      setAdiciones(adics || []);
    }).catch(console.error).finally(() => setCargando(false));
  }, []);

  const filtrados = productos.filter((p) => {
    const matchCat  = categoriaActiva === 0 || p.id_categoria === categoriaActiva;
    const matchBusc = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusc;
  });

  const handleAgregar = (producto) => {
    if (!usuario) { setModalLogin(true); return; }
    setProductoActual(producto);
    if (producto.permite_toppings === 1 && toppings.length > 0) setModalToppings(true);
    else setModalAdiciones(true);
  };

  const handleSiguienteToppings = (tops) => {
    setToppingsSelec(tops);
    setModalToppings(false);
    setModalAdiciones(true);
  };

  const handleConfirmarAdiciones = (item) => {
    agregarItem(item);
    setModalAdiciones(false);
    setProductoActual(null);
    setToppingsSelec([]);
  };

  const cerrarTodo = () => {
    setModalToppings(false);
    setModalAdiciones(false);
    setProductoActual(null);
    setToppingsSelec([]);
  };

  return (
    <div className="catalogo-wrapper">
      <Navbar />
      <div className="catalogo-page">
        <div className="catalogo-top">
          <div className="catalogo-categorias">
            {categorias.map((cat) => (
              <button
                key={cat.id_categoria ?? cat.id}
                className={`cat-pill ${categoriaActiva === (cat.id_categoria ?? cat.id) ? 'activo' : ''}`}
                onClick={() => setCategoriaActiva(cat.id_categoria ?? cat.id)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
          <div className="catalogo-buscador">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </div>

        {cargando ? (
          <div className="catalogo-vacio"><p>Cargando productos...</p></div>
        ) : filtrados.length === 0 ? (
          <div className="catalogo-vacio">
            <span style={{ fontSize: 40 }}>🔍</span>
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div className="productos-grid">
            {filtrados.map((p) => (
              <div key={p.id_producto} className="producto-card">
                <div className="producto-card-img">
                  {p.img
                    ? <img src={p.img} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span className="producto-card-emoji">🍫</span>
                  }
                </div>
                <div className="producto-card-body">
                  <h3 className="producto-card-nombre">{p.nombre}</h3>
                  <p className="producto-card-desc">{p.descripcion}</p>
                  <div className="producto-card-footer">
                    <span className="producto-card-precio">${Number(p.precio).toLocaleString()}</span>
                    <button className="producto-card-btn" onClick={() => handleAgregar(p)}>+ Agregar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CarritoBottom
        carrito={carrito}
        subtotal={subtotal}
        totalItems={totalItems}
        onCambiarCantidad={cambiarCantidad}
        onQuitar={quitarItem}
        onIrCheckout={() => navigate('/checkout')}
      />

      <ModalToppings
        open={modalToppings}
        onClose={cerrarTodo}
        onNext={handleSiguienteToppings}
        producto={productoActual}
        toppingsDisponibles={toppings}
      />
      <ModalAdiciones
        open={modalAdiciones}
        onClose={cerrarTodo}
        onConfirmar={handleConfirmarAdiciones}
        producto={productoActual}
        toppingsSeleccionados={toppingsSelec}
        adicionesDisponibles={adiciones}
      />
      <ModalLoginRequerido open={modalLogin} onClose={() => setModalLogin(false)} />
    </div>
  );
}
