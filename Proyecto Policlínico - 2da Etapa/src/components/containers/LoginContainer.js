import React, { useState } from "react";
import LoginView from "../presentational/LoginView";
import useLocalStorage from "../../hooks/useLocalStorage";
import {
  validarEmailInstitucional,
  validarPassword,
  evaluarPassword,
  validarEmailPorRol,
  isEmailInUse,
} from "../../services/validators";

function LoginContainer({ onLogin: onLoginFromApp, onGoToResetPage }) {
  const [formData, setFormData] = useState({
    rol: "",
    usuario: "",
    contrasena: "",
  });
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [errores, setErrores] = useState([]);
  const [usuarioActivo, setUsuarioActivo] = useLocalStorage(
    "sesionUsuario",
    null
  );

  const mostrarErrores = (arr) => {
    setErrores(Array.isArray(arr) ? arr : [String(arr)]);
    if (arr && arr.length) setTimeout(() => setErrores([]), 6000);
  };

  // --- Forgot password (modo simple: restablecer nueva contraseña desde modal) ---
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");

  const handleOpenReset = () => setShowReset(true);
  const handleCloseReset = () => {
    setShowReset(false);
    setResetEmail("");
    setResetPassword("");
    setResetConfirm("");
  };
  const handleResetEmailChange = (e) => setResetEmail(e.target.value);
  const handleResetPasswordChange = (e) => setResetPassword(e.target.value);
  const handleResetConfirmChange = (e) => setResetConfirm(e.target.value);

  // --- Registro / Crear cuenta (modal similar a restablecer) ---
  const [showRegister, setShowRegister] = useState(false);
  const [regRol, setRegRol] = useState(formData.rol || "");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const handleOpenRegister = () => setShowRegister(true);
  const handleCloseRegister = () => {
    setShowRegister(false);
    setRegEmail("");
    setRegPassword("");
    setRegConfirm("");
    setRegRol(formData.rol || "");
  };
  const handleRegRolChange = (e) => {
    setRegRol(e.target.value);
  };
  const handleRegEmailChange = (e) => setRegEmail(e.target.value);
  const handleRegPasswordChange = (e) => setRegPassword(e.target.value);
  const handleRegConfirmChange = (e) => setRegConfirm(e.target.value);

  const handleSimpleResetSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validarEmailInstitucional(resetEmail)) {
      mostrarMensaje("Ingrese un correo institucional válido", "error");
      return;
    }
    if (!validarPassword(resetPassword)) {
      const ev = evaluarPassword(resetPassword);
      mostrarMensaje(
        "Contraseña inválida: " +
          (ev.reasons && ev.reasons.length
            ? ev.reasons.join(", ")
            : "no cumple requisitos"),
        "error"
      );
      return;
    }
    if (resetPassword !== resetConfirm) {
      mostrarMensaje("Las contraseñas no coinciden", "error");
      return;
    }

    // Guardar contraseña en localStorage (simulación)
    const users = JSON.parse(localStorage.getItem("userPasswords") || "{}");
    users[resetEmail.toLowerCase()] = resetPassword;
    localStorage.setItem("userPasswords", JSON.stringify(users));

    // Registrar correo conocido para evitar que sea usado por otra cuenta en el futuro
    try {
      const known = JSON.parse(localStorage.getItem("knownEmails") || "[]");
      const norm = resetEmail.toLowerCase();
      if (!known.some((k) => k === norm)) {
        known.push(norm);
        localStorage.setItem("knownEmails", JSON.stringify(known));
      }
    } catch (err) {
      // noop
    }

    mostrarMensaje("Contraseña restablecida correctamente", "exito");
    handleCloseReset();
  };

  const handleRegisterSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // Validaciones
    if (!regRol) {
      mostrarMensaje("Seleccione un rol para la nueva cuenta", "error");
      return;
    }
    if (!validarEmailPorRol(regEmail, regRol)) {
      mostrarErrores(["Correo no válido para el rol seleccionado"]);
      mostrarMensaje("Correo no válido para el rol seleccionado", "error");
      return;
    }
    if (isEmailInUse(regEmail)) {
      mostrarErrores(["El correo ya está en uso"]);
      mostrarMensaje("El correo ya está en uso", "error");
      return;
    }
    if (!validarPassword(regPassword)) {
      const ev = evaluarPassword(regPassword);
      mostrarMensaje(
        "Contraseña inválida: " +
          (ev.reasons && ev.reasons.length
            ? ev.reasons.join(", ")
            : "no cumple requisitos"),
        "error"
      );
      return;
    }
    if (regPassword !== regConfirm) {
      mostrarMensaje("Las contraseñas no coinciden", "error");
      return;
    }

    // Guardar usuario
    const users = JSON.parse(localStorage.getItem("userPasswords") || "{}");
    users[regEmail.toLowerCase()] = regPassword;
    localStorage.setItem("userPasswords", JSON.stringify(users));

    try {
      const known = JSON.parse(localStorage.getItem("knownEmails") || "[]");
      const norm = regEmail.toLowerCase();
      if (!known.some((k) => k === norm)) {
        known.push(norm);
        localStorage.setItem("knownEmails", JSON.stringify(known));
      }
    } catch (err) {
      /* noop */
    }

    // Auto-login tras registro
    const rolTexto =
      regRol === "admin"
        ? "Administrador"
        : regRol === "medico"
        ? "Médico"
        : "Enfermera";
    const usuario = {
      usuario: regEmail,
      rol: rolTexto,
      ultimoAcceso: new Date().toISOString(),
    };
    setUsuarioActivo(usuario);
    if (onLoginFromApp) onLoginFromApp(usuario);

    mostrarMensaje("Cuenta creada y sesión iniciada", "exito");
    handleCloseRegister();
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setErrores([]);
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.rol || !formData.usuario || !formData.contrasena) {
      mostrarMensaje("Todos los campos son obligatorios", "error");
      return;
    }

    const passRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passRegex.test(formData.contrasena)) {
      mostrarMensaje(
        "La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas, números y caracteres especiales",
        "error"
      );
      return;
    }

    // Validación estricta por dominio según rol (solo esta regla)
    if (!validarEmailPorRol(formData.usuario, formData.rol)) {
      mostrarErrores(["Correo no válido para el rol seleccionado"]);
      mostrarMensaje("Correo no válido para el rol seleccionado", "error");
      return;
    }

    // Verificar credenciales contra almacenamiento simulado
    const users = JSON.parse(localStorage.getItem("userPasswords") || "{}");
    const normUsuario = String(formData.usuario).toLowerCase();
    const stored = users[normUsuario];
    if (!stored) {
      // Si la cuenta no existe, abrimos el modal de registro y prellenamos el correo/rol
      setRegEmail(formData.usuario);
      setRegRol(formData.rol || "");
      setRegPassword("");
      setRegConfirm("");
      setShowRegister(true);
      mostrarMensaje(
        "Cuenta no encontrada. Abriendo formulario de creación de cuenta para ese correo.",
        "error"
      );
      return;
    }
    if (stored !== formData.contrasena) {
      mostrarErrores(["Usuario o contraseña incorrectos"]);
      mostrarMensaje("Usuario o contraseña incorrectos", "error");
      return;
    }

    const rolTexto =
      formData.rol === "admin"
        ? "Administrador"
        : formData.rol === "medico"
        ? "Médico"
        : "Enfermera";

    const usuario = {
      usuario: formData.usuario,
      rol: rolTexto,
      ultimoAcceso: new Date().toISOString(),
    };
    setUsuarioActivo(usuario);
    if (onLoginFromApp) onLoginFromApp(usuario);

    mostrarMensaje(`¡Bienvenido ${rolTexto}!`, "exito");
  };

  return (
    <LoginView
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      mensaje={mensaje}
      errores={errores}
      // reset (oculto por defecto en UI)
      onOpenReset={handleOpenReset}
      showReset={showReset}
      resetEmail={resetEmail}
      onResetEmailChange={handleResetEmailChange}
      resetPassword={resetPassword}
      resetConfirm={resetConfirm}
      onResetPasswordChange={handleResetPasswordChange}
      onResetConfirmChange={handleResetConfirmChange}
      onSimpleResetSubmit={handleSimpleResetSubmit}
      onCloseReset={handleCloseReset}
      // registro (nuevo)
      onOpenRegister={handleOpenRegister}
      showRegister={showRegister}
      regRol={regRol}
      regEmail={regEmail}
      regPassword={regPassword}
      regConfirm={regConfirm}
      onRegRolChange={handleRegRolChange}
      onRegEmailChange={handleRegEmailChange}
      onRegPasswordChange={handleRegPasswordChange}
      onRegConfirmChange={handleRegConfirmChange}
      onRegisterSubmit={handleRegisterSubmit}
      onCloseRegister={handleCloseRegister}
    />
  );
}

export default LoginContainer;
