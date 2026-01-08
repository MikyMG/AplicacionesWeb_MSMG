import React, { useState } from 'react';
import ResetPasswordView from '../presentational/ResetPasswordView';
import { validarEmailInstitucional, validarPassword, evaluarPassword } from '../../services/validators';

function ResetPasswordContainer({ onVolver }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [errores, setErrores] = useState([]);
  const mostrarErrores = (arr) => { setErrores(Array.isArray(arr) ? arr : [String(arr)]); if (arr && arr.length) setTimeout(() => setErrores([]), 6000); }; 

  // Autoprefill desde querystring (permite abrir enlace con token)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('resetToken') || params.get('token') || '';
      const e = params.get('resetEmail') || params.get('email') || '';
      if (t) setToken(t);
      if (e) setEmail(decodeURIComponent(e));
    } catch (err) {
      // noop
    }
  }, []);

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validarEmailInstitucional(email)) { mostrarErrores(['Ingrese un correo institucional válido']); mostrarMensaje('Ingrese un correo institucional válido', 'error'); return; }
    if (!token) { mostrarErrores(['Ingrese el token recibido']); mostrarMensaje('Ingrese el token recibido', 'error'); return; }
    if (!validarPassword(password)) { const ev = evaluarPassword(password); mostrarErrores(ev.reasons && ev.reasons.length ? ev.reasons : ['La contraseña no cumple requisitos']); mostrarMensaje('Contraseña inválida', 'error'); return; }
    if (password !== confirm) { mostrarErrores(['Las contraseñas no coinciden']); mostrarMensaje('Las contraseñas no coinciden', 'error'); return; }

    const resets = JSON.parse(localStorage.getItem('passwordResets') || '[]');
    const foundIndex = resets.findIndex(r => r.email.toLowerCase() === email.toLowerCase() && r.token.toUpperCase() === token.toUpperCase());
    if (foundIndex === -1) {
      mostrarMensaje('Token o correo inválido', 'error');
      return;
    }

    // verificar antigüedad (24 horas)
    const found = resets[foundIndex];
    const creado = new Date(found.creado);
    const ahora = new Date();
    const horas = (ahora - creado) / (1000 * 60 * 60);
    if (horas > 24) {
      mostrarMensaje('El token ha expirado', 'error');
      return;
    }

    // guardar contraseña en localStorage (simulación)
    const users = JSON.parse(localStorage.getItem('userPasswords') || '{}');
    users[email.toLowerCase()] = password;
    localStorage.setItem('userPasswords', JSON.stringify(users));

    // eliminar la solicitud de reset
    resets.splice(foundIndex, 1);
    localStorage.setItem('passwordResets', JSON.stringify(resets));

    // limpiar querystring para seguridad/UX
    try {
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);
    } catch (err) {
      // noop
    }

    mostrarMensaje('Contraseña restablecida correctamente. Redirigiendo al login...', 'exito');
    setTimeout(() => {
      if (onVolver) onVolver();
    }, 2000);
  };

  return (
    <ResetPasswordView
      email={email}
      token={token}
      password={password}
      confirm={confirm}
      onEmailChange={(e) => setEmail(e.target.value)}
      onTokenChange={(e) => setToken(e.target.value)}
      onPasswordChange={(e) => setPassword(e.target.value)}
      onConfirmChange={(e) => setConfirm(e.target.value)}
      onSubmit={handleSubmit}
      mensaje={mensaje}
      errores={errores}
      onVolver={onVolver}
    />
  );
}

export default ResetPasswordContainer;