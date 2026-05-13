import { useState, useEffect } from 'react';

export function useTiempoEspera() {
  const [minutos, setMinutos] = useState(30);

  const cargar = () => {
    const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + '/api';
    fetch(`${apiUrl}/configuracion/tiempo-espera?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data?.minutos) setMinutos(d.data.minutos); })
      .catch(() => {});
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 120000); // refrescar cada 2 minutos
    return () => clearInterval(interval);
  }, []);

  return minutos;
}
