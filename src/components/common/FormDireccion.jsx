import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MUNICIPIOS = [
  'Medellín',
  'Bello',
  'Itagüí',
  'Envigado',
  'Sabaneta',
  'La Estrella',
];

const TIPOS_VIA = [
  'Calle', 'Carrera', 'Transversal', 'Diagonal',
  'Avenida', 'Avenida Calle', 'Avenida Carrera',
  'Circular', 'Circunvalar',
];

const ORIGEN = { lat: 6.2897, lng: -75.5557 };
// REACT_APP_API_URL viene sin /api (ej: https://mi-api-qpjo.onrender.com)
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + '/api';

const iconoRojo = L?.icon ? L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
}) : null;

const CENTROS_CIUDAD = {
  'Medellín':    [6.2442, -75.5812],
  'Bello':       [6.3358, -75.5556],
  'Itagüí':      [6.1845, -75.5990],
  'Envigado':    [6.1752, -75.5920],
  'Sabaneta':    [6.1511, -75.6164],
  'La Estrella': [6.1577, -75.6440],
};

function PinMapa({ onCambio }) {
  useMapEvents({
    click(e) { onCambio(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

export default function FormDireccion({ value = {}, onChange, errors = {}, layout = 'admin' }) {
  const isAdmin  = layout === 'admin';
  const inputCls = isAdmin ? 'form-input'   : 'perfil-input';
  const labelCls = isAdmin ? 'form-label'   : 'perfil-label';
  const grupoCls = isAdmin ? 'form-grupo'   : 'perfil-campo';
  const errorCls = isAdmin ? 'form-error'   : 'perfil-alerta-err';

  const [pin, setPin] = useState({ lat: null, lng: null });
  const [costoDomicilioCalculado, setCostoDomicilioCalculado] = useState(null);
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    if (value.departamento !== 'Antioquia') {
      onChange('departamento', 'Antioquia');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseDirLinea = (linea = '') => {
    const match = linea.match(/^(\w[\w\s]*?)\s+([\w\d]+)\s*#([\w\d]+)(?:-([\w\d\s]*))?$/);
    if (match) {
      return {
        tipo:   TIPOS_VIA.find((t) => t.toLowerCase() === match[1].toLowerCase().trim()) || match[1].trim(),
        nroVia: match[2],
        nro:    match[3],
        comp:   match[4] || '',
      };
    }
    return { tipo: 'Calle', nroVia: '', nro: '', comp: '' };
  };

  const parsed = parseDirLinea(value.direccion_linea);
  const [tipoVia, setTipoVia] = useState(parsed.tipo);
  const [nroVia,  setNroVia]  = useState(parsed.nroVia);
  const [nro,     setNro]     = useState(parsed.nro);
  const [comp,    setComp]    = useState(parsed.comp);

  useEffect(() => {
    if (!nroVia) return;
    let dir = `${tipoVia} ${nroVia}`;
    if (nro)        dir += ` #${nro}`;
    if (nro && comp) dir += `-${comp}`;
    onChange('direccion_linea', dir);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoVia, nroVia, nro, comp]);

  const preview = (() => {
    if (!nroVia) return '';
    let d = `${tipoVia} ${nroVia}`;
    if (nro)        d += ` #${nro}`;
    if (nro && comp) d += `-${comp}`;
    const extras = [value.barrio, value.ciudad, 'Antioquia'].filter(Boolean);
    if (extras.length) d += `, ${extras.join(', ')}`;
    return d;
  })();

  const calcularDomicilio = async (lat, lng) => {
    setCalculando(true);
    setCostoDomicilioCalculado(null);
    try {
      console.log('Calculando domicilio:', { lat, lng, API_BASE, ciudad: value?.ciudad });
      const resp = await fetch(`${API_BASE}/domicilio/calcular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, ciudad: value?.ciudad || '' }),
      });
      console.log('Respuesta status:', resp.status);
      const data = await resp.json();
      console.log('Respuesta data:', data);
      if (data.success && data.data?.costo_domicilio) {
        setCostoDomicilioCalculado(data.data.costo_domicilio);
        if (onChange) onChange('costo_domicilio', data.data.costo_domicilio);
      } else {
        console.error('Sin costo en respuesta:', data);
        setCostoDomicilioCalculado(5500);
        if (onChange) onChange('costo_domicilio', 5500);
      }
    } catch (e) {
      console.error('Error calculando domicilio:', e.message);
      setCostoDomicilioCalculado(5500);
      if (onChange) onChange('costo_domicilio', 5500);
    } finally {
      setCalculando(false);
    }
  };

  const handlePinCambio = (lat, lng) => {
    setPin({ lat, lng });
    onChange('lat', lat);
    onChange('lng', lng);
    calcularDomicilio(lat, lng);
  };

  return (
    <>
      {/* ── FILA 1: Departamento ── */}
      <div className={grupoCls}>
        <label className={labelCls}>Departamento</label>
        <input
          className={inputCls}
          value="Antioquia"
          readOnly
          style={{ background: '#f5f5f5', color: '#888', cursor: 'not-allowed' }}
        />
      </div>

      {/* ── FILA 2: Ciudad | Barrio ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label className={labelCls}>Ciudad / Municipio *</label>
          <select
            className={`${inputCls}${errors.ciudad ? (isAdmin ? ' input-error' : '') : ''}`}
            value={value.ciudad || ''}
            onChange={(e) => onChange('ciudad', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {MUNICIPIOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {errors.ciudad && <span className={errorCls}>{errors.ciudad}</span>}
        </div>
        <div>
          <label className={labelCls}>Barrio *</label>
          <input
            className={`${inputCls}${errors.barrio ? (isAdmin ? ' input-error' : '') : ''}`}
            placeholder="Ej: Laureles, Aranjuez..."
            value={value.barrio || ''}
            onChange={(e) => onChange('barrio', e.target.value)}
          />
          {errors.barrio && <span className={errorCls}>{errors.barrio}</span>}
        </div>
      </div>

      {/* ── FILA 3: Tipo vía | Nro vía | # Casa/Apto ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '35fr 20fr 45fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label className={labelCls}>Tipo de vía *</label>
          <select
            className={inputCls}
            value={tipoVia}
            onChange={(e) => setTipoVia(e.target.value)}
          >
            {TIPOS_VIA.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Número *</label>
          <input
            className={`${inputCls}${errors.direccion_linea ? (isAdmin ? ' input-error' : '') : ''}`}
            placeholder="Ej: 10"
            value={nroVia}
            onChange={(e) => setNroVia(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}># Casa/Apto (opcional)</label>
          <input
            className={inputCls}
            placeholder="Ej: 301, Casa 5, Apto 2B"
            value={`${nro}${comp ? `-${comp}` : ''}`}
            onChange={(e) => {
              const val = e.target.value;
              const dash = val.indexOf('-');
              if (dash >= 0) { setNro(val.slice(0, dash)); setComp(val.slice(dash + 1)); }
              else { setNro(val); setComp(''); }
            }}
          />
        </div>
      </div>

      {/* ── FILA 4: Vista previa ── */}
      {preview && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6,
          padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#166534',
        }}>
          <strong>Vista previa:</strong> {preview}
        </div>
      )}
      {errors.direccion_linea && <span className={errorCls}>{errors.direccion_linea}</span>}

      {/* ── FILA 5: Referencia ── */}
      <div className={grupoCls}>
        <label className={labelCls}>Referencia / Indicaciones adicionales</label>
        <textarea
          className={inputCls}
          rows={1}
          placeholder="Ej: Casa esquinera, portón azul, frente al parque..."
          value={value.referencia || ''}
          onChange={(e) => onChange('referencia', e.target.value)}
          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
          style={{ resize: 'none', overflow: 'hidden', fontFamily: 'inherit' }}
        />
      </div>

      {/* ── Mapa para confirmar ubicación (solo cliente) ── */}
      {!isAdmin && (
        <div style={{ marginTop: 16 }}>
          <label className={labelCls}>
            📍 Confirma tu ubicación en el mapa
            <span style={{ color: '#888', fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
              (Toca el mapa para poner el pin en tu puerta)
            </span>
          </label>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: 8, height: 260 }}>
            <MapContainer
              key={value.ciudad || 'default'}
              center={value.ciudad && CENTROS_CIUDAD[value.ciudad] ? CENTROS_CIUDAD[value.ciudad] : [pin.lat || ORIGEN.lat, pin.lng || ORIGEN.lng]}
              zoom={value.ciudad ? 14 : 13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=4b4fb7c5-2da3-4787-b727-b52ebb09e307"
                attribution='© <a href="https://stadiamaps.com/">Stadia Maps</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={20}
              />
              <PinMapa onCambio={handlePinCambio} />
              {pin.lat && <Marker position={[pin.lat, pin.lng]} icon={iconoRojo || undefined} />}
            </MapContainer>
          </div>
          {calculando && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
              ⏳ Calculando costo de domicilio...
            </div>
          )}
          {!calculando && costoDomicilioCalculado && (
            <div style={{ marginTop: 8, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#166534', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🛵 Costo de domicilio estimado</span>
              <span style={{ fontSize: 16 }}>${costoDomicilioCalculado.toLocaleString('es-CO')}</span>
            </div>
          )}
          {!calculando && !costoDomicilioCalculado && (
            <div style={{ marginTop: 8, padding: '8px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
              💡 Toca el mapa para calcular el costo de domicilio
            </div>
          )}
        </div>
      )}
    </>
  );
}
