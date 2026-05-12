import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'chocofreseo_carrito';

// ID único por combinación producto + toppings (con cantidades) + adiciones (con cantidades)
function generarLineaId(item) {
  const toppingStr = [...(item.toppings ?? [])]
    .sort((a, b) => a.id_topping - b.id_topping)
    .map((t) => `${t.id_topping}x${t.cantidad || 1}`)
    .join(',');
  const adicionStr = [...(item.adiciones ?? [])]
    .sort((a, b) => a.id_adicion - b.id_adicion)
    .map((a) => `${a.id_adicion}x${a.cantidad || 1}`)
    .join(',');
  return `${item.id_producto}__t${toppingStr}__a${adicionStr}`;
}

function precioUnitario(item) {
  const base = Number(item.precio ?? 0);
  const maxIncluidos = item.permite_toppings ? (item.max_toppings || 0) : 0;
  const totalTop = (item.toppings ?? []).reduce((s, t) => s + (t.cantidad || 1), 0);
  const toppingExtra = Math.max(0, totalTop - maxIncluidos) * 2000;
  const extras = (item.adiciones ?? []).reduce((acc, a) => acc + Number(a.precio ?? 0) * (a.cantidad || 1), 0);
  return base + toppingExtra + extras;
}

// Migra ítems viejos (sin lineaId) que puedan venir del localStorage
function migrarCarrito(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) =>
      item.lineaId ? item : { ...item, lineaId: generarLineaId(item) }
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      return guardado ? migrarCarrito(guardado) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    } catch { /* ignorar */ }
  }, [carrito]);

  const agregarItem = useCallback((item) => {
    const lineaId  = generarLineaId(item);
    const unitario = precioUnitario(item);
    setCarrito((prev) => {
      const existe = prev.find((x) => x.lineaId === lineaId);
      if (existe) {
        return prev.map((x) =>
          x.lineaId === lineaId
            ? { ...x, cantidad: x.cantidad + 1, subtotal: unitario * (x.cantidad + 1) }
            : x
        );
      }
      return [...prev, { ...item, lineaId, cantidad: 1, subtotal: unitario }];
    });
  }, []);

  const quitarItem = useCallback((lineaId) => {
    setCarrito((prev) => prev.filter((x) => x.lineaId !== lineaId));
  }, []);

  // SIEMPRE recibe lineaId — nunca id_producto
  const cambiarCantidad = useCallback((lineaId, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      setCarrito((prev) => prev.filter((x) => x.lineaId !== lineaId));
      return;
    }
    setCarrito((prev) =>
      prev.map((x) => {
        if (x.lineaId !== lineaId) return x;
        const unitario = precioUnitario(x);
        return { ...x, cantidad: nuevaCantidad, subtotal: unitario * nuevaCantidad };
      })
    );
  }, []);

  const limpiarCarrito = useCallback(() => {
    setCarrito([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignorar */ }
  }, []);

  const subtotal   = carrito.reduce((a, x) => a + Number(x.subtotal), 0);
  const totalItems = carrito.reduce((a, x) => a + x.cantidad, 0);

  return (
    <CartContext.Provider value={{
      carrito, agregarItem, quitarItem, cambiarCantidad, limpiarCarrito, subtotal, totalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};