import React from 'react';
import '../../css/Login.css';
import logo from '../../assets/logo-uleam.png';

function LoginView({ formData, onChange, onSubmit, mensaje, errores = [], onOpenReset, showReset = false, resetEmail = '', onResetEmailChange, resetPassword = '', resetConfirm = '', onResetPasswordChange, onResetConfirmChange, onSimpleResetSubmit, onCloseReset }) {
  const __props = arguments[0] || {};
  const onOpenRegister = __props.onOpenRegister;
  const showRegister = __props.showRegister;
  const safeMensaje = mensaje || { texto: '', tipo: '' };
  const safeFormData = formData || { rol: '', usuario: '', contrasena: '' };
  const regRol = __props.regRol;
  const regEmail = __props.regEmail;
  const regPassword = __props.regPassword;
  const regConfirm = __props.regConfirm;
  const onRegRolChange = __props.onRegRolChange;
  const onRegEmailChange = __props.onRegEmailChange;
  const onRegPasswordChange = __props.onRegPasswordChange;
  const onRegConfirmChange = __props.onRegConfirmChange;
  const onRegisterSubmit = __props.onRegisterSubmit;
  const onCloseRegister = __props.onCloseRegister;

  return (
    <div className="login-container">
      {safeMensaje.texto && (
        <div className={`mensaje-validacion mostrar ${safeMensaje.tipo}`}>
          <span className="mensaje-texto">{safeMensaje.texto}</span>
        </div>
      )}
      {Array.isArray(errores) && errores.length > 0 && (
        <div className="errores-lista" style={{ marginBottom: 12 }}>
          <ul>
            {errores.map((e, i) => <li key={i} style={{ color: '#8b0000' }}>{e}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit}>
        <img src={logo} alt="Logo ULEAM" className="logo-uleam-login" />
        <h2>Iniciar Sesión</h2>

        <div className="input-group">
          <select 
            name="rol" 
            value={safeFormData.rol}
            onChange={onChange}
            required
          >
            <option value="">Seleccione su rol</option>
            <option value="admin">Administrador</option>
            <option value="medico">Médico</option>
            <option value="enfermera">Enfermera</option>
          </select>
        </div>

        <div className="input-group">
          <input 
            type="text" 
            name="usuario"
            value={safeFormData.usuario}
            onChange={onChange}
            placeholder="Usuario o Correo Electrónico"
          />
          {safeFormData.rol && (
            <small style={{ display: 'block', marginTop: 6, color: 'var(--gris)' }}>
              {safeFormData.rol === 'admin' && 'El correo debe terminar en @adm.uleam.edu.ec'}
              {safeFormData.rol === 'medico' && 'El correo debe terminar en @med.uleam.edu.ec'}
              {safeFormData.rol === 'enfermera' && 'El correo debe terminar en @enf.uleam.edu.ec'}
            </small>
          )}
        </div>

        <div className="input-group">
          <input 
            type="password" 
            name="contrasena"
            value={safeFormData.contrasena}
            onChange={onChange}
            placeholder="Contraseña"
          />
        </div>

        <button type="submit">Ingresar</button>

        <div className="links">
          <a href="#" onClick={(e) => { e.preventDefault(); if (onOpenRegister) onOpenRegister(); }}>Crear cuenta</a>
          <a href="#" style={{ marginLeft: 12 }} onClick={(e) => { e.preventDefault(); if (onOpenReset) onOpenReset(); }}>¿Olvidó su contraseña?</a>
        </div>

        {showReset && (
          <div className="reset-modal" role="dialog" aria-modal="true">
            <div className="reset-box">
              <h3>Restablecer contraseña</h3>
              <input
                type="email"
                name="resetEmail"
                value={resetEmail}
                onChange={onResetEmailChange}
                placeholder="Correo institucional (ej: nombre@uleam.edu.ec)"
              />
              <input
                type="password"
                name="resetPassword"
                value={resetPassword}
                onChange={onResetPasswordChange}
                placeholder="Nueva contraseña"
              />
              <input
                type="password"
                name="resetConfirm"
                value={resetConfirm}
                onChange={onResetConfirmChange}
                placeholder="Confirmar contraseña"
              />
              <div className="reset-actions">
                <button type="button" onClick={onSimpleResetSubmit}>Restablecer contraseña</button>
                <button type="button" onClick={() => onCloseReset && onCloseReset()}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {showRegister && (
          <div className="reset-modal" role="dialog" aria-modal="true">
            <div className="reset-box">
              <h3>Crear cuenta</h3>
              <select name="regRol" value={regRol} onChange={onRegRolChange}>
                <option value="">Seleccione rol</option>
                <option value="admin">Administrador</option>
                <option value="medico">Médico</option>
                <option value="enfermera">Enfermera</option>
              </select>
              <input
                type="email"
                name="regEmail"
                value={regEmail}
                onChange={onRegEmailChange}
                placeholder="Correo (ej: nombre@med.uleam.edu.ec)"
              />
              <input
                type="password"
                name="regPassword"
                value={regPassword}
                onChange={onRegPasswordChange}
                placeholder="Contraseña"
              />
              <input
                type="password"
                name="regConfirm"
                value={regConfirm}
                onChange={onRegConfirmChange}
                placeholder="Confirmar contraseña"
              />
              <div className="reset-actions">
                <button type="button" onClick={onRegisterSubmit}>Crear cuenta</button>
                <button type="button" onClick={() => onCloseRegister && onCloseRegister()}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default LoginView;
