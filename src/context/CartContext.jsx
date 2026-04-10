import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'chocofreseo_carrito';

// ID único por combinación producto + toppings + adiciones
function generarLineaId(item) {
  const toppingIds = [...(item.toppings ?? [])]
    .map((t) => t.id_topping)
    .sort((a, b) => a - b)
    .join(',');
  const adicionIds = [...(item.adiciones ?? [])]
    .map((a) => a.id_adicion)
    .sort((a, b) => a - b)
    .join(',');
  return `${item.id_producto}__t${toppingIds}__a${adicionIds}`;
}

function precioUnitario(item) {
  const base = item.precio ?? 0;
  const extras = (item.adiciones ?? []).reduce((acc, a) => acc + (a.precio ?? 0), 0);
  return base + extras;
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

  const subtotal   = carrito.reduce((a, x) => a + x.subtotal, 0);
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