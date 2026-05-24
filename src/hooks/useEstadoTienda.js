import { useState, useEffect } from 'react';

export function useEstadoTienda() {
  const [estado, setEstado] = useState({
    abierto:       true,
    estado:        'schedule',
    hora_apertura: 13,
    hora_cierre:   20,
    horario:       '13:00 - 20:00',
    cargando:      true,
  });

  const cargar = () => {
    const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + '/api';
    fetch(`${apiUrl}/configuracion/estado-tienda?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setEstado({ ...d.data, cargando: false });
      })
      .catch(() => {
        setEstado(prev => ({ ...prev, cargando: false }));
      });
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 120000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return estado;
}
