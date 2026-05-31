import { useState, useEffect } from 'react';
import { Bike } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
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
  'Copacabana',
  'Itagüí',
  'Envigado',
  'Sabaneta',
  'La Estrella',
  'Caldas',
];

const TIPOS_VIA = [
  'Calle', 'Carrera', 'Transversal', 'Diagonal',
  'Avenida', 'Avenida Calle', 'Avenida Carrera',
  'Circular', 'Circunvalar',
];

const ORIGEN = { lat: 6.2897, lng: -75.5557 };
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + '/api';

const iconoRojo = L?.icon ? L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
}) : null;

const CENTROS_CIUDAD = {
  'Medellín':             [6.2442, -75.5812],
  'Bello':                [6.3358, -75.5556],
  'Copacabana':           [6.3517, -75.5081],
  'Itagüí':               [6.1845, -75.5990],
  'Envigado':             [6.1752, -75.5920],
  'Sabaneta':             [6.1511, -75.6164],
  'La Estrella':          [6.1577, -75.6440],
  'Caldas':               [6.0938, -75.6368],
};

function PinMapa({ onCambio }) {
  useMapEvents({ click(e) { onCambio(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function RecentrarMapa({ ciudad }) {
  const map = useMap();
  useEffect(() => {
    console.log('RecentrarMapa - ciudad:', ciudad);
    console.log('Coords:', CENTROS_CIUDAD[ciudad]);
    if (ciudad && CENTROS_CIUDAD[ciudad]) {
      map.setView(CENTROS_CIUDAD[ciudad], 15);
      console.log('Recentrando a:', CENTROS_CIUDAD[ciudad]);
    }
  }, [ciudad, map]);
  return null;
}

export default function FormDireccion({ value = {}, onChange, errors = {}, layout = 'admin' }) {
  const isAdmin  = layout === 'admin';
  const inputCls = isAdmin ? 'form-input'  : 'perfil-input';
  const labelCls = isAdmin ? 'form-label'  : 'perfil-label';
  const grupoCls = isAdmin ? 'form-grupo'  : 'perfil-campo';
  const errorCls = isAdmin ? 'form-error'  : 'perfil-alerta-err';

  // ── Estado mapa ──────────────────────────────────────────
  const [pin, setPin] = useState({ lat: null, lng: null });
  const [costoDomicilioCalculado, setCostoDomicilioCalculado] = useState(null);
  const [calculando, setCalculando] = useState(false);

  // ── Los 4 campos que componen direccion_linea ─────────────
  const [tipoVia,     setTipoVia]     = useState('');
  const [numeroVia,   setNumeroVia]   = useState('');
  const [numeral,     setNumeral]     = useState('');
  const [complemento, setComplemento] = useState('');

  // Emitir departamento fijo
  useEffect(() => {
    if (value.departamento !== 'Antioquia') onChange('departamento', 'Antioquia');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Construir y emitir direccion_linea cuando cambia algún campo
  const direccionPreview = [
    tipoVia,
    numeroVia,
    numeral     ? `#${numeral}`     : '',
    complemento ? `-${complemento}` : '',
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (tipoVia || numeroVia || numeral) {
      onChange('direccion_linea', direccionPreview);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoVia, numeroVia, numeral, complemento]);

  // ── Geocerca ──────────────────────────────────────────────
  const calcularDomicilio = async (lat, lng) => {
    setCalculando(true);
    setCostoDomicilioCalculado(null);
    try {
      const resp = await fetch(`${API_BASE}/domicilio/calcular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, ciudad: value?.ciudad || '' }),
      });
      const data = await resp.json();
      if (data.success && data.data?.costo_domicilio) {
        setCostoDomicilioCalculado(data.data.costo_domicilio);
        if (onChange) onChange('costo_domicilio', data.data.costo_domicilio);
      } else {
        setCostoDomicilioCalculado(5500);
        if (onChange) onChange('costo_domicilio', 5500);
      }
    } catch (e) {
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

  // Estilo para inputs con prefijo
  const prefixWrap = { position: 'relative' };
  const prefixSpan = { position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 13, pointerEvents: 'none', fontWeight: 700 };

  return (
    <>
      {/* FILA 1: Departamento */}
      <div className={grupoCls}>
        <label className={labelCls}>Departamento</label>
        <input className={inputCls} value="Antioquia" readOnly
          style={{ background: '#f5f5f5', color: '#888', cursor: 'not-allowed' }} />
      </div>

      {/* FILA 2: Ciudad | Barrio */}
      <div className="direccion-grid" style={{ marginBottom: 12 }}>
        <div>
          <label className={labelCls}>Ciudad / Municipio *</label>
          <select
            className={inputCls}
            value={value.ciudad || ''}
            onChange={(e) => onChange('ciudad', e.target.value)}
            style={{ border: errors.ciudad ? '1px solid #CA0B0B' : '1px solid #e5e7eb' }}
          >
            <option value="">Seleccionar...</option>
            {MUNICIPIOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.ciudad && (
            <div style={{ fontSize: 11, color: '#CA0B0B', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ {errors.ciudad}
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>Barrio *</label>
          <input
            className={inputCls}
            placeholder="Ej: Laureles, Aranjuez..."
            value={value.barrio || ''}
            onChange={(e) => onChange('barrio', e.target.value)}
            style={{ border: errors.barrio ? '1px solid #CA0B0B' : '1px solid #e5e7eb' }}
          />
          {errors.barrio && (
            <div style={{ fontSize: 11, color: '#CA0B0B', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ {errors.barrio}
            </div>
          )}
        </div>
      </div>

      {/* FILA 3: Tipo vía | Número | #Numeral | -Complemento */}
      <div className="direccion-grid-4" style={{ marginBottom: 12 }}>
        <div>
          <label className={labelCls}>Tipo de vía *</label>
          <select
            className={inputCls}
            value={tipoVia}
            onChange={(e) => { setTipoVia(e.target.value); onChange('tipo_via', e.target.value); }}
            style={{ border: errors.tipo_via ? '1px solid #CA0B0B' : '1px solid #e5e7eb' }}
          >
            <option value="">Seleccionar tipo...</option>
            {TIPOS_VIA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.tipo_via && (
            <div style={{ fontSize: 11, color: '#CA0B0B', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ {errors.tipo_via}
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>Número *</label>
          <input
            className={inputCls}
            placeholder="55"
            value={numeroVia}
            onChange={(e) => { setNumeroVia(e.target.value); onChange('numero', e.target.value); }}
            style={{ border: errors.numero ? '1px solid #CA0B0B' : '1px solid #e5e7eb' }}
          />
          {errors.numero && (
            <div style={{ fontSize: 11, color: '#CA0B0B', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ {errors.numero}
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}># Numeral *</label>
          <div style={prefixWrap}>
            <span style={prefixSpan}>#</span>
            <input
              className={inputCls}
              placeholder="30"
              value={numeral}
              onChange={(e) => { setNumeral(e.target.value); onChange('numeral', e.target.value); }}
              style={{ paddingLeft: 22, border: errors.numeral ? '1px solid #CA0B0B' : '1px solid #e5e7eb' }}
            />
          </div>
          {errors.numeral && (
            <div style={{ fontSize: 11, color: '#CA0B0B', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ {errors.numeral}
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>Complemento</label>
          <div style={prefixWrap}>
            <span style={prefixSpan}>-</span>
            <input
              className={inputCls}
              placeholder="45"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              style={{ paddingLeft: 18 }}
            />
          </div>
        </div>
      </div>

      {/* FILA 4: Preview */}
      {direccionPreview && (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#555', fontStyle: 'italic' }}>
          📍 {direccionPreview}{value.barrio ? `, ${value.barrio}` : ''}{value.ciudad ? `, ${value.ciudad}` : ''}
        </div>
      )}
      {/* Mostrar dirección existente si viene precargada */}
      {!direccionPreview && value.direccion_linea && (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#555' }}>
          📍 Dirección actual: <strong>{value.direccion_linea}</strong>
        </div>
      )}
      {/* FILA 5: Referencia */}
      <div className={grupoCls}>
        <label className={labelCls}>Referencia / Indicaciones adicionales</label>
        <textarea
          className={inputCls}
          rows={1}
          placeholder="Ej: Casa esquinera, portón azul, frente al parque... (opcional)"
          value={value.referencia || ''}
          onChange={(e) => onChange('referencia', e.target.value)}
          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }}
          style={{ resize: 'none', overflow: 'hidden', fontFamily: 'inherit', minHeight: 36 }}
        />
      </div>

      {/* FILA 6: Mapa siempre visible en modo cliente */}
      {!isAdmin && (
        <div style={{ marginTop: 16 }}>
          <label className={labelCls}>
            📍 Confirma tu ubicación en el mapa
            <span style={{ color: '#888', fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
              (Toca el mapa para poner el pin en tu puerta)
            </span>
          </label>
          {/* z-index controlado para no tapar el header */}
          <div className="form-mapa-container" style={{ position: 'relative', zIndex: 1, borderRadius: 12, overflow: 'hidden', border: errors.mapa ? '1px solid #CA0B0B' : '1px solid #e5e7eb', marginTop: 8 }}>
            <MapContainer
              key={value.ciudad || 'default'}
              center={
                value.ciudad && CENTROS_CIUDAD[value.ciudad]
                  ? CENTROS_CIUDAD[value.ciudad]
                  : [pin.lat || ORIGEN.lat, pin.lng || ORIGEN.lng]
              }
              zoom={16}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
              />
              <RecentrarMapa ciudad={value.ciudad} />
              <PinMapa onCambio={handlePinCambio} />
              {pin.lat && <Marker position={[pin.lat, pin.lng]} icon={iconoRojo || undefined} />}
            </MapContainer>
          </div>
          {errors.mapa && (
            <div style={{ fontSize: 11, color: '#CA0B0B', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ {errors.mapa}
            </div>
          )}
          {calculando && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
              ⏳ Calculando costo de domicilio...
            </div>
          )}
          {!calculando && costoDomicilioCalculado && (
            <div style={{ marginTop: 8, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#166534', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{display:'flex',alignItems:'center',gap:6}}><Bike size={15}/>Costo de domicilio</span>
              <span style={{ fontSize: 16 }}>${costoDomicilioCalculado.toLocaleString('es-CO')}</span>
            </div>
          )}
          {!calculando && !costoDomicilioCalculado && (
            <div style={{ marginTop: 8, padding: '8px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
              💡 Toca el mapa para calcular el costo de domicilio a tu dirección
            </div>
          )}
        </div>
      )}
    </>
  );
}
