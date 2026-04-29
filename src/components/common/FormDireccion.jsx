/**
 * FormDireccion — Formulario de dirección Valle de Aburrá (Antioquia).
 *
 * Props:
 *   value   : { direccion_linea, barrio, ciudad, departamento, referencia }
 *   onChange: (field, value) => void
 *   errors  : { [field]: string }  (opcional)
 *   layout  : 'admin' | 'client'   (opcional)
 */
import { useState, useEffect } from 'react';

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

export default function FormDireccion({ value = {}, onChange, errors = {}, layout = 'admin' }) {
  const isAdmin  = layout === 'admin';
  const inputCls = isAdmin ? 'form-input'   : 'perfil-input';
  const labelCls = isAdmin ? 'form-label'   : 'perfil-label';
  const grupoCls = isAdmin ? 'form-grupo'   : 'perfil-campo';
  const filaCls  = isAdmin ? 'form-fila'    : 'perfil-form-fila';
  const errorCls = isAdmin ? 'form-error'   : 'perfil-alerta-err';

  // Emitir departamento fijo en el primer render si aún no está seteado
  useEffect(() => {
    if (value.departamento !== 'Antioquia') {
      onChange('departamento', 'Antioquia');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Descomponer direccion_linea en partes estructuradas
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

  // Reconstruir y notificar al padre cuando cambia alguna parte estructurada
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
    </>
  );
}
