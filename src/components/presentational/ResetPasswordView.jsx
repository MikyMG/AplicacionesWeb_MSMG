import React from 'react';
import '../../css/Login.css';

function ResetPasswordView({ email, token, password, confirm, onEmailChange, onTokenChange, onPasswordChange, onConfirmChange, onSubmit, mensaje, errores = [], onVolver }) {
  return (
    <div className="login-container">
      {mensaje.texto && (
        <div className={`mensaje-validacion mostrar ${mensaje.tipo}`}>
          <span className="mensaje-texto">{mensaje.texto}</span>
        </div>
      )}
      {Array.isArray(errores) && errores.length > 0 && (
        <div className="errores-lista" style={{ marginBottom: 12 }}>
          <ul>
            {errores.map((e, i) => <li key={i} style={{ color: '#8b0000' }}>{e}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit} className="reset-form">
        <img src="/" alt="" style={{ display: 'none' }} />
        <h2>Restablecer contraseña</h2>

        <div className="input-group">
          <input type="email" name="email" value={email} onChange={onEmailChange} placeholder="Correo institucional" />
        </div>

        <div className="input-group">
          <input type="text" name="token" value={token} onChange={onTokenChange} placeholder="Token recibido" />
        </div>

        <div className="input-group">
          <input type="password" name="password" value={password} onChange={onPasswordChange} placeholder="Nueva contraseña" />
        </div>

        <div className="input-group">
          <input type="password" name="confirm" value={confirm} onChange={onConfirmChange} placeholder="Confirmar contraseña" />
        </div>

        <button type="submit">Restablecer contraseña</button>
        <div className="links">
          <a href="#" onClick={(e) => { e.preventDefault(); if (onVolver) onVolver(); }}>Volver al login</a>
        </div>
      </form>
    </div>
  );
}

export default ResetPasswordView;