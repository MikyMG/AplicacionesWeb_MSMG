// Validadores de datos comunes
import { safeParseItem } from '../utils/storage';
export function validarCedula(cedula) {
  // Validación completa para cédula ecuatoriana (10 dígitos)
  if (!cedula || typeof cedula !== 'string') return false;
  const c = cedula.trim();
  if (!/^\d{10}$/.test(c)) return false;

  const provincia = Number(c.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;

  const tercer = Number(c.charAt(2));
  if (tercer >= 6) return false; // no corresponde a persona natural

  const digits = c.split('').map(d => Number(d));
  const coef = [2,1,2,1,2,1,2,1,2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    const prod = digits[i] * coef[i];
    suma += prod >= 10 ? prod - 9 : prod;
  }
  const modulo = suma % 10;
  const check = modulo === 0 ? 0 : 10 - modulo;
  return check === digits[9];
}

export function validarEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const e = email.trim();
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(e);
}

export function validarEmailPorRol(email, rol) {
  if (!validarEmail(email) || !rol) return false;
  const domainMap = {
    admin: 'adm.uleam.edu.ec',
    medico: 'med.uleam.edu.ec',
    enfermera: 'enf.uleam.edu.ec'
  };
  const required = domainMap[rol];
  if (!required) return false;
  const re = new RegExp('^[A-Za-z0-9._%+-]+@' + required.replace('.', '\\.' ) + '$', 'i');
  return re.test(email.trim());
}

export function validarEmailInstitucional(email) {
  if (!validarEmail(email)) return false;
  const domain = String(email).trim().split('@')[1] || '';
  const allowed = ['uleam.edu.ec', 'live.uleam.edu.ec'];
  return allowed.some(a => domain.toLowerCase().endsWith(a));
}

export function validarTelefonoEstricto(telefono) {
  if (!telefono) return false;
  const t = String(telefono).trim();
  // Aceptar formato local 09xxxxxxxx o internacional +5939xxxxxxxx
  return /^(09\d{8}|\+5939\d{8})$/.test(t);
}

// Compatibilidad: validarTelefono (acepta espacios y guiones como en '+593 9 123 4567')
export function validarTelefono(telefono) {
  if (!telefono) return false;
  const t = String(telefono).replace(/[\s-]/g, '');
  return validarTelefonoEstricto(t);
} 

export function validarNombre(nombre) {
  if (!nombre || typeof nombre !== 'string') return false;
  const n = nombre.trim();
  if (n.length < 2) return false;
  return /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s.'-]+$/.test(n);
}

export function validarFechaISO(fecha) {
  if (!fecha) return false;
  const d = new Date(fecha);
  return !Number.isNaN(d.getTime());
}

export function validarFechaNacimientoPasada(fecha) {
  if (!fecha) return false;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return false;
  const hoy = new Date();
  if (d >= hoy) return false;
  const edad = hoy.getFullYear() - d.getFullYear() - ( (hoy.getMonth() < d.getMonth() || (hoy.getMonth() === d.getMonth() && hoy.getDate() < d.getDate())) ? 1 : 0 );
  if (edad < 0 || edad > 130) return false;
  return true;
}

export function fechaNoPasada(fecha) {
  if (!fecha) return false;
  const d = new Date(fecha);
  const ahora = new Date();
  return !Number.isNaN(d.getTime()) && d >= new Date(ahora.getTime() - 60000);
}

export function validarNumeroPositivo(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return false;
  const n = Number(String(valor).replace(',', '.'));
  return Number.isFinite(n) && n > 0;
}

export function validarNumeroRango(valor, min, max) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return false;
  const n = Number(String(valor).replace(',', '.'));
  if (!Number.isFinite(n)) return false;
  if (min !== null && min !== undefined && n < min) return false;
  if (max !== null && max !== undefined && n > max) return false;
  return true;
}

export function validarPassword(pass) {
  if (!pass || typeof pass !== 'string') return false;
  // al menos 8 y con variedad de caracteres
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pass);
}

export function evaluarPassword(pass) {
  const reasons = [];
  if (!pass || typeof pass !== 'string') {
    reasons.push('Contraseña vacía');
    return { valid: false, score: 0, reasons };
  }
  let score = 0;
  if (pass.length >= 8) score += 1; else reasons.push('Debe tener al menos 8 caracteres');
  if (pass.length >= 12) score += 1;
  if (/[a-z]/.test(pass)) score += 1; else reasons.push('Debe incluir minúsculas');
  if (/[A-Z]/.test(pass)) score += 1; else reasons.push('Debe incluir mayúsculas');
  if (/\d/.test(pass)) score += 1; else reasons.push('Debe incluir números');
  if (/[@$!%*?&]/.test(pass)) score += 1; else reasons.push('Debe incluir caracteres especiales (ej: @$!%*?&)');
  const valid = score >= 4; // umbral
  return { valid, score, reasons };
}

export function validarSeleccion(valor) {
  return valor !== null && valor !== undefined && String(valor).trim() !== '';
}

export function validarCamposRequeridos(obj, campos = []) {
  const faltantes = [];
  campos.forEach(c => {
    const v = obj[c];
    if (v === null || v === undefined || String(v).trim() === '') faltantes.push(c);
  });
  return faltantes; // array de nombres de campo faltantes
}

export function validarRangoFechas(inicio, fin) {
  if (!inicio || !fin) return true; // no validar si falta alguno
  const di = new Date(inicio);
  const df = new Date(fin);
  if (Number.isNaN(di.getTime()) || Number.isNaN(df.getTime())) return false;
  return di <= df;
}

// Clasifica un IMC numérico
export function clasificarIMC(imc) {
  if (imc === null || imc === undefined || String(imc).trim() === '') return { label: '', variant: '' };
  const v = Number(String(imc).replace(',', '.'));
  if (!Number.isFinite(v)) return { label: '', variant: '' };
  if (v < 18.5) return { label: 'Bajo peso', variant: 'bajo' };
  if (v < 25) return { label: 'Normal', variant: 'normal' };
  if (v < 30) return { label: 'Sobrepeso', variant: 'sobrepeso' };
  if (v < 35) return { label: 'Obesidad I', variant: 'obesidad1' };
  if (v < 40) return { label: 'Obesidad II', variant: 'obesidad2' };
  return { label: 'Obesidad III', variant: 'obesidad3' };
}

// Revisa si un correo ya está en uso en el sistema (pacientes, médicos o listados conocidos)
export function isEmailInUse(email, baseDatos = {}, { excludeType = null, excludeId = null } = {}) {
  if (!email || !String(email).trim()) return false;
  const e = String(email).trim().toLowerCase();

  // Pacientes
  const pacientes = baseDatos.pacientes || [];
  for (const p of pacientes) {
    if (!p || !p.email) continue;
    if (String(p.email).trim().toLowerCase() === e) {
      if (excludeType === 'paciente' && p.id === excludeId) continue;
      return true;
    }
  }

  // Medicos (campo correo)
  const medicos = baseDatos.medicos || [];
  for (const m of medicos) {
    if (!m || !m.correo) continue;
    if (String(m.correo).trim().toLowerCase() === e) {
      if (excludeType === 'medico' && m.id === excludeId) continue;
      return true;
    }
  }

  // Listados conocidos (localStorage)
  const known = safeParseItem('knownEmails', []);
  if (Array.isArray(known) && known.some(k => String(k).trim().toLowerCase() === e)) return true;

  return false;
}