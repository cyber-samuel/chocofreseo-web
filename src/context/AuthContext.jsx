import { createContext, useContext, useState } from 'react';
import * as api from '../services/api';

const AuthContext = createContext();

// Normaliza el rol: el API devuelve { nombre, ... }, el frontend espera string
const normalizarRol = (rol) => (typeof rol === 'object' && rol !== null ? rol.nombre : rol);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('usuario');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  // login desde el servidor
  const loginConAPI = async (email, contrasena) => {
    const data = await api.login({ email, contrasena });
    const { token, usuario: u } = data;
    localStorage.setItem('token', token);
    let normalizado = {
      ...u,
      rol:         normalizarRol(u.rol),
      id_cliente:  u.cliente?.id_cliente  || null,
      id_empleado: u.empleado?.id_empleado || null,
      telefono:    u.cliente?.telefono    || u.telefono || null,
    };
    // Fetch perfil completo para asegurar que telefono y datos de cliente estén presentes
    try {
      const perfil = await api.getPerfil();
      normalizado = {
        ...normalizado,
        telefono:   perfil.telefono   ?? normalizado.telefono,
        ciudad:     perfil.ciudad     ?? null,
        barrio:     perfil.barrio     ?? null,
        id_cliente: perfil.id_cliente ?? normalizado.id_cliente,
      };
    } catch (_) { /* best-effort */ }
    localStorage.setItem('usuario', JSON.stringify(normalizado));
    setUsuario(normalizado);
    return normalizado;
  };

  // login manual (fallback para registro sin token)
  const login = (datos) => {
    const normalizado = { ...datos, rol: normalizarRol(datos.rol) };
    localStorage.setItem('usuario', JSON.stringify(normalizado));
    setUsuario(normalizado);
  };

  const actualizarUsuario = (nuevosDatos) => {
    const actualizado = { ...usuario, ...nuevosDatos };
    localStorage.setItem('usuario', JSON.stringify(actualizado));
    setUsuario(actualizado);
  };

  const logout = async () => {
    try { await api.logout(); } catch { /* silencioso */ }
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, loginConAPI, logout, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
