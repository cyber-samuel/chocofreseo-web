import { useState, useEffect } from 'react';

export function useTiempoEspera() {
  const [minutos, setMinutos] = useState(30);
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/configuracion/tiempo-espera`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setMinutos(d.data.minutos); })
      .catch(() => {});
  }, []);
  return minutos;
}
