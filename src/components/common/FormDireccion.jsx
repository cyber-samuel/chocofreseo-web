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
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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
  const filaCls  = isAdmin ? 'form-fila'    : 'perfil-form-fila';
  const errorCls = isAdmin ? 'form-error'   : 'perfil-alerta-err';

  const [pin, setPin] = useState({ lat: null, lng: null });
  const [costoDomicilioCalculado, setCostoDomicilioCalculado] = useState(null);

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
    try {
      const resp = await fetch(`${API_URL}/domicilio/calcular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, ciudad: value.ciudad || '' }),
      });
      const data = await resp.json();
      if (data.success) {
        setCostoDomicilioCalculado(data.data.costo_domicilio);
        onChange('costo_domicilio', data.data.costo_domicilio);
      }
    } catch (e) {
      console.error('Error calculando domicilio:', e);
    }
  };

  const handlePinCambio = (lat, lng) => {
    setPin({ lat, lng });
    onChange('latitud', lat);
    onChange('longitud', lng);
    calcularDomicilio(lat, lng);
  };

  return (
    <>
      {/* ── Departamento — fijo Antioquia ── */}
      <div className={grupoCls}>
        <label className={labelCls}>Departamento</label>
        <input
          className={inputCls}
          value="Antioquia"
          readOnly
          style={{ background: '#f5f5f5', color: '#888', cursor: 'not-allowed' }}
        />
      </div>

      {/* ── Ciudad / Municipio ── */}
      <div className={grupoCls}>
        <label className={labelCls}>Ciudad / Municipio *</label>
        <select
          className={`${inputCls}${errors.ciudad ? (isAdmin ? ' input-error' : '') : ''}`}
          value={value.ciudad || ''}
          onChange={(e) => onChange('ciudad', e.target.value)}
        >
          <option value="">Seleccionar municipio...</option>
          {MUNICIPIOS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {errors.ciudad && <span className={errorCls}>{errors.ciudad}</span>}
      </div>

      {/* ── Barrio ── */}
      <div className={grupoCls}>
        <label className={labelCls}>Barrio *</label>
        <input
          className={`${inputCls}${errors.barrio ? (isAdmin ? ' input-error' : '') : ''}`}
          placeholder="Ej: El Poblado, Laureles, Sabaneta centro..."
          value={value.barrio || ''}
          onChange={(e) => onChange('barrio', e.target.value)}
        />
        {errors.barrio && <span className={errorCls}>{errors.barrio}</span>}
      </div>

      {/* ── Tipo de vía ── */}
      <div className={grupoCls}>
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

      {/* ── Número de vía ── */}
      <div className={grupoCls}>
        <label className={labelCls}>Número de vía *</label>
        <input
          className={`${inputCls}${errors.direccion_linea ? (isAdmin ? ' input-error' : '') : ''}`}
          placeholder="Ej: 10"
          value={nroVia}
          onChange={(e) => setNroVia(e.target.value)}
        />
      </div>

      {/* ── # Número + Complemento ── */}
      <div className={filaCls} style={{ gap: '8px' }}>
        <div className={grupoCls} style={{ flex: 1 }}>
          <label className={labelCls}># Número</label>
          <input
            className={inputCls}
            placeholder="Ej: 5"
            value={nro}
            onChange={(e) => setNro(e.target.value)}
          />
        </div>
        <div className={grupoCls} style={{ flex: 2 }}>
          <label className={labelCls}>Complemento</label>
          <input
            className={inputCls}
            placeholder="Ej: 20 Apto 301"
            value={comp}
            onChange={(e) => setComp(e.target.value)}
          />
        </div>
      </div>

      {/* ── Vista previa ── */}
      {preview && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6,
          padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#166534',
        }}>
          <strong>Vista previa:</strong> {preview}
        </div>
      )}
      {errors.direccion_linea && <span className={errorCls}>{errors.direccion_linea}</span>}

      {/* ── Referencia ── */}
      <div className={grupoCls}>
        <label className={labelCls}>Referencia / Indicaciones adicionales</label>
        <input
          className={inputCls}
          placeholder="Ej: Casa de la esquina, frente al parque"
          value={value.referencia || ''}
          onChange={(e) => onChange('referencia', e.target.value)}
        />
      </div>

      {/* ── Mapa para confirmar ubicación (solo cliente) ── */}
      {!isAdmin && (
        <div style={{ marginTop: 16 }}>
          <label className={labelCls}>
            📍 Confirma tu ubicación en el mapa
            <span style={{ color: '#888', fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
              (Toca el mapa para mover el pin a tu dirección exacta)
            </span>
          </label>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: 8, height: 250 }}>
            <MapContainer
              center={[pin.lat || ORIGEN.lat, pin.lng || ORIGEN.lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <PinMapa onCambio={handlePinCambio} />
              {pin.lat && <Marker position={[pin.lat, pin.lng]} />}
            </MapContainer>
          </div>
          {costoDomicilioCalculado && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#166534', fontWeight: 700 }}>
              🛵 Costo de domicilio estimado: ${costoDomicilioCalculado.toLocaleString('es-CO')}
            </div>
          )}
        </div>
      )}
    </>
  );
}
