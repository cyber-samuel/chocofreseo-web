import { useState, useEffect } from 'react';
import { getHorario } from '../services/api';

export function useHorario() {
  const [horario, setHorario] = useState({ hora_apertura: 13, hora_cierre: 20, estado_tienda: 'schedule' });

  useEffect(() => {
    getHorario().then(setHorario).catch(() => {});
  }, []);

  return horario;
}

// Función pura para calcular si está abierto dado un horario
export function calcularAbierto({ hora_apertura, hora_cierre, estado_tienda }) {
  if (estado_tienda === 'open')   return true;
  if (estado_tienda === 'closed') return false;
  const co = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const horaDecimal = co.getUTCHours() + co.getUTCMinutes() / 60;
  return horaDecimal >= hora_apertura && horaDecimal < hora_cierre;
}
