import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email,      setEmail]      = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error,      setError]      = useState('');
  const [cargando,   setCargando]   = useState(false);
  const navigate        = useNavigate();
  const { loginConAPI } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !contrasena.trim()) {
      setError('Por favor completa todos los campos'); return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Ingresa un correo electrónico válido'); return;
    }
    setCargando(true);
    setError('');
    try {
      const usuario = await loginConAPI(email, contrasena);
      if (usuario.rol === 'admin' || usuario.rol === 'Administrador') {
        navigate('/admin/dashboard');
      } else if (usuario.rol === 'domiciliario' || usuario.rol === 'Domiciliario') {
        navigate('/domiciliario/pedidos');
      } else {
        navigate('/landing');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Email o contraseña incorrectos');
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
        <h1 className="login-titulo">El sabor que<br />te enamora</h1>
        <p className="login-subtitulo">Helados, waffles y crepes artesanales hechos con amor para ti.</p>
        <div className="login-decoracion">
          <div className="deco-circulo deco-1" />
          <div className="deco-circulo deco-2" />
          <div className="deco-circulo deco-3" />
        </div>
      </div>

      <div className="login-derecha">
        <div className="login-caja">
          <div className="login-caja-header">
            <h2 className="login-caja-titulo">Bienvenido de nuevo</h2>
            <p className="login-caja-sub">Ingresa tus datos para continuar</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="lf-grupo">
              <label className="lf-label">Correo electrónico</label>
              <input
                className="lf-input"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
              />
            </div>
            <div className="lf-grupo">
              <div className="lf-label-fila">
                <label className="lf-label">Contraseña</label>
                <Link to="/recuperar" className="lf-link">¿Olvidaste tu contraseña?</Link>
              </div>
              <input
                className="lf-input"
                type="password"
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => { setContrasena(e.target.value); setError(''); }}
              />
            </div>
            {error && <div className="lf-error">{error}</div>}
            <button className="lf-btn-primario" type="submit" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
            <div className="lf-divisor"><span>o</span></div>
            <p className="lf-registro">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="lf-link-bold">Regístrate gratis</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
