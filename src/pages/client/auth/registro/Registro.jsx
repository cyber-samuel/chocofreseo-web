import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import * as api from '../../../../services/api';
import './Registro.css';

export default function Registro() {
  const [nombre,     setNombre]     = useState('');
  const [email,      setEmail]      = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar,  setConfirmar]  = useState('');
  const [error,      setError]      = useState('');
  const [cargando,   setCargando]   = useState(false);
  const navigate        = useNavigate();
  const { loginConAPI } = useAuth();

  const handleRegistro = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !contrasena.trim() || !confirmar.trim()) {
      setError('Por favor completa todos los campos'); return;
    }
    if (contrasena !== confirmar) { setError('Las contraseñas no coinciden'); return; }
    if (contrasena.length < 6)    { setError('Mínimo 6 caracteres'); return; }

    setCargando(true);
    setError('');
    try {
      await api.register({ nombre, email, contrasena, id_rol: 2 });
      // Auto-login tras registro
      await loginConAPI(email, contrasena);
      navigate('/landing');
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al crear la cuenta');
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
        <h1 className="login-titulo">Únete a la<br />familia</h1>
        <p className="login-subtitulo">Regístrate y disfruta de los mejores helados y waffles artesanales a domicilio.</p>
        <div className="login-decoracion">
          <div className="deco-circulo deco-1" />
          <div className="deco-circulo deco-2" />
          <div className="deco-circulo deco-3" />
        </div>
      </div>

      <div className="login-derecha">
        <div className="login-caja">
          <h2 className="login-caja-titulo">Crear cuenta</h2>
          <p className="login-caja-sub">Solo te tomará un momento</p>
          <form onSubmit={handleRegistro} className="login-form">
            <div className="lf-grupo">
              <label className="lf-label">Nombre completo</label>
              <input className="lf-input" type="text" placeholder="Ej: Ana Gómez" value={nombre} onChange={(e) => { setNombre(e.target.value); setError(''); }} />
            </div>
            <div className="lf-grupo">
              <label className="lf-label">Correo electrónico</label>
              <input className="lf-input" type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
            </div>
            <div className="lf-grupo">
              <label className="lf-label">Contraseña</label>
              <input className="lf-input" type="password" placeholder="Mínimo 6 caracteres" value={contrasena} onChange={(e) => { setContrasena(e.target.value); setError(''); }} />
            </div>
            <div className="lf-grupo">
              <label className="lf-label">Confirmar contraseña</label>
              <input className="lf-input" type="password" placeholder="Repite tu contraseña" value={confirmar} onChange={(e) => { setConfirmar(e.target.value); setError(''); }} />
            </div>
            {error && <div className="lf-error">{error}</div>}
            <button className="lf-btn-primario" type="submit" disabled={cargando}>
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
            <p className="lf-registro">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="lf-link-bold">Inicia sesión</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
