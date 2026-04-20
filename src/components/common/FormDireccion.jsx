/**
 * FormDireccion — Formulario reutilizable de dirección con:
 *   - Tipo vía dropdown + campos estructurados → preview automático
 *   - Dropdown departamento / municipio (datos Colombia)
 *   - Barrio (texto libre) + Referencia
 *
 * Props:
 *   value   : { direccion_linea, barrio, ciudad, departamento, referencia }
 *   onChange: (field, value) => void
 *   errors  : { [field]: string }           (opcional)
 *   layout  : 'admin' | 'client'            (opcional, controla clases CSS)
 */
import { useState, useEffect } from 'react';
import { DEPARTAMENTOS, getMunicipios } from '../../utils/colombiaData';

const TIPOS_VIA = [
  'Calle', 'Carrera', 'Transversal', 'Diagonal',
  'Avenida', 'Avenida Calle', 'Avenida Carrera',
  'Circular', 'Circunvalar',
];

export default function FormDireccion({ value = {}, onChange, errors = {}, layout = 'admin' }) {
  const isAdmin  = layout === 'admin';
  const inputCls = isAdmin ? 'form-input'     : 'perfil-input';
  const labelCls = isAdmin ? 'form-label'     : 'perfil-label';
  const grupoCls = isAdmin ? 'form-grupo'     : 'perfil-campo';
  const filaCls  = isAdmin ? 'form-fila'      : 'perfil-form-fila';
  const errorCls = isAdmin ? 'form-error'     : 'perfil-alerta-err';

  // Descomponer direccion_linea guardada en partes estructuradas
  const parseDirLinea = (linea = '') => {
    // Formato: "<TipoVia> <nroVia> #<nro>-<comp>"  o  "<TipoVia> <nroVia> #<nro>"
    const match = linea.match(/^(\w[\w\s]*?)\s+([\w\d]+)\s*#([\w\d]+)(?:-([\w\d\s]*))?$/);
    if (match) {
      return {
        tipo: TIPOS_VIA.find((t) => t.toLowerCase() === match[1].toLowerCase().trim()) || match[1].trim(),
        nroVia: match[2],
        nro: match[3],
        comp: match[4] || '',
      };
    }
    return { tipo: 'Calle', nroVia: '', nro: '', comp: '' };
  };

  const parsed = parseDirLinea(value.direccion_linea);
  const [tipoVia,  setTipoVia]  = useState(parsed.tipo);
  const [nroVia,   setNroVia]   = useState(parsed.nroVia);
  const [nro,      setNro]      = useState(parsed.nro);
  const [comp,     setComp]     = useState(parsed.comp);
  const [municipios, setMunicipios] = useState([]);

  // Sync municipios when departamento changes
  useEffect(() => {
    if (value.departamento) {
      setMunicipios(getMunicipios(value.departamento));
    } else {
      setMunicipios([]);
    }
  }, [value.departamento]);

  // Rebuild direccion_linea and notify parent whenever structured parts change
  useEffect(() => {
    if (!nroVia) return;
    let dir = `${tipoVia} ${nroVia}`;
    if (nro) dir += ` #${nro}`;
    if (nro && comp) dir += `-${comp}`;
    onChange('direccion_linea', dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoVia, nroVia, nro, comp]);

  const preview = (() => {
    if (!nroVia) return '';
    let d = `${tipoVia} ${nroVia}`;
    if (nro) d += ` #${nro}`;
    if (nro && comp) d += `-${comp}`;
    return d;
  })();

  const handleDept = (dept) => {
    onChange('departamento', dept);
    onChange('ciudad', ''); // reset city
  };

  return (
    <>
      {/* ── Tipo Vía ── */}
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

      {/* ── Nro. vía + # número + complemento ── */}
      <div className={filaCls} style={{ gap: '8px' }}>
        <div className={grupoCls} style={{ flex: 2 }}>
          <label className={labelCls}>Nro. de vía *</label>
          <input
            className={`${inputCls}${errors.direccion_linea ? (isAdmin ? ' input-error' : '') : ''}`}
            placeholder="Ej: 10"
            value={nroVia}
            onChange={(e) => setNroVia(e.target.value)}
          />
        </div>
        <div className={grupoCls} style={{ flex: 2 }}>
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
            placeholder="Ej: 20"
            value={comp}
            onChange={(e) => setComp(e.target.value)}
          />
        </div>
      </div>

      {/* ── Preview ── */}
      {preview && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px',
          padding: '8px 12px', marginBottom: '12px', fontSize: '13px', color: '#166534',
        }}>
          <strong>Vista previa:</strong> {preview}
        </div>
      )}
      {errors.direccion_linea && <span className={errorCls}>{errors.direccion_linea}</span>}

      {/* ── Barrio ── */}
      <div className={grupoCls}>
        <label className={labelCls}>Barrio *</label>
        <input
          className={`${inputCls}${errors.barrio ? (isAdmin ? ' input-error' : '') : ''}`}
          placeholder="Ej: El Poblado"
          value={value.barrio || ''}
          onChange={(e) => onChange('barrio', e.target.value)}
        />
        {errors.barrio && <span className={errorCls}>{errors.barrio}</span>}
      </div>

      {/* ── Departamento + Ciudad ── */}
      <div className={filaCls}>
        <div className={grupoCls}>
          <label className={labelCls}>Departamento *</label>
          <select
            className={`${inputCls}${errors.departamento ? (isAdmin ? ' input-error' : '') : ''}`}
            value={value.departamento || ''}
            onChange={(e) => handleDept(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {DEPARTAMENTOS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.departamento && <span className={errorCls}>{errors.departamento}</span>}
        </div>
        <div className={grupoCls}>
          <label className={labelCls}>Ciudad / Municipio *</label>
          <select
            className={`${inputCls}${errors.ciudad ? (isAdmin ? ' input-error' : '') : ''}`}
            value={value.ciudad || ''}
            onChange={(e) => onChange('ciudad', e.target.value)}
            disabled={!value.departamento}
          >
            <option value="">
              {value.departamento ? 'Seleccionar…' : 'Primero selecciona dept.'}
            </option>
            {municipios.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {errors.ciudad && <span className={errorCls}>{errors.ciudad}</span>}
        </div>
      </div>

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
