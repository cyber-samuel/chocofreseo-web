import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../../../services/api';
import './Recuperar.css';

export default function Recuperar() {
  const [email,   setEmail]   = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error,   setError]   = useState('');
  const [cargando,setCargando]= useState(false);

  const handleRecuperar = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Ingresa tu correo electrónico'); return; }
    setCargando(true);
    setError('');
    try {
      await api.recuperarContrasena({ email });
      setEnviado(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo procesar la solicitud');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-izquierda">
        <div className="login-marca">
          <div className="login-logo">CF</div>
          <span className="login-nombre">ChocoFreseo</span>
        </div>
        <h1 className="login-titulo">No te<br />preocupes</h1>
        <p className="login-subtitulo">Te ayudamos a recuperar el acceso a tu cuenta en segundos.</p>
        <div className="login-decoracion">
          <div className="deco-circulo deco-1" />
          <div className="deco-circulo deco-2" />
          <div className="deco-circulo deco-3" />
        </div>
      </div>

      <div className="login-derecha">
        <div className="login-caja">
          {!enviado ? (
            <>
              <h2 className="login-caja-titulo">Recuperar contraseña</h2>
              <p className="login-caja-sub">Ingresa tu correo y te enviaremos las instrucciones</p>
              <form onSubmit={handleRecuperar} className="login-form">
                <div className="lf-grupo">
                  <label className="lf-label">Correo electrónico</label>
                  <input className="lf-input" type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
                </div>
                {error && <div className="lf-error">{error}</div>}
                <button className="lf-btn-primario" type="submit" disabled={cargando}>
                  {cargando ? 'Enviando...' : 'Enviar instrucciones'}
                </button>
                <p className="lf-registro">
                  <Link to="/login" className="lf-link-bold">← Volver al inicio de sesión</Link>
                </p>
              </form>
            </>
          ) : (
            <div className="recuperar-exito">
              <div className="recuperar-icono">📧</div>
              <h2 className="login-caja-titulo">Solicitud enviada</h2>
              <p className="login-caja-sub">Se procesó la solicitud para <strong>{email}</strong></p>
              <Link to="/login" className="lf-btn-primario" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 24 }}>
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
