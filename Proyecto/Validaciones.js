// Parte 1. Variables de almacenamiento y configuración
// Esta parte funciona como una base de datos en localstore, aunque no es una base de datos como tal pero cumple con la de guardar datos
const baseDatos = {
    pacientes: [],
    citas: [],
    medicos: [],
    especialidades: [],
    facturas: []
};
// Configuración para PDFs y reportes
const PDF_CONFIG = {
    pageSize: 'a4', 
    margin: {
        top: 30, // espacio del encabezado
        right: 20, // espacio derecho
        bottom: 30, // espacio del pie de página
        left: 20 // espacio izquierdo
    },
    colors: {
        primary: [180, 0, 0],
        secondary: [128, 0, 0]
    },
    fonts: { 
        header: { size: 18, style: 'bold' }, 
        subheader: { size: 14, style: 'normal' },
        body: { size: 12, style: 'normal' },
        small: { size: 10, style: 'normal' }
    }
};
// Variables para el sistema de reportes
let lastReportResults = []; 
let lastReportType = ''; 
let lastSavedFacturaId = null; 
// Asegurar que las funciones de PDF estén disponibles globalmente
if (typeof window !== 'undefined') { 
    window.PDF_CONFIG = PDF_CONFIG;
}

// Parte 2. Validaciones reutilizables que compruebas datos comunes
// Objeto de validaciones
const validaciones = { 
    validarCampoVacio(valor, nombreCampo) { 
        if (!valor || valor.trim() === '') { 
            mostrarMensaje(`El campo "${nombreCampo}" es obligatorio`, 'error');
            return false;
        }
        return true; // Si tiene contenido devuelve verdadero
    },
    validarLongitudMinima(valor, minimo, nombreCampo) { // Verifica los caracteres minimos
        if (valor.length < minimo) {
            mostrarMensaje(`${nombreCampo} debe tener al menos ${minimo} caracteres`, 'error');
            return false;
        }
        return true; // Si cumple la longitud devuelve verdadero
    },
    validarSoloLetras(valor, nombreCampo) {
        const regex = /^[A-Za-záéíóúÁÉÍÓÚñÑ]+(\s+[A-Za-záéíóúÁÉÍÓÚñÑ]+)*$/;
        if (!regex.test(valor)) {
            mostrarMensaje(`${nombreCampo} debe contener solo letras y espacios`, 'error');
            return false;
        }
        return true;
    },
    validarEmail(email) {
        const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!regex.test(email)) {
            mostrarMensaje('Formato de correo electrónico inválido', 'error');
            return false;
        }
        return true;
    }
};
// Exportar funciones de validación, hace que sean accesibles globalmente sin escribir validaciones
const { validarCampoVacio, validarLongitudMinima, validarSoloLetras, validarEmail } = validaciones;

// Parte 3. Guardamos y cargamos datos
// Funciones de persistencia, esto asegura que no se borren los datos al recargar la página 
function guardarDatos() {
    try {
        localStorage.setItem('policlinico_datos', JSON.stringify(baseDatos));
        return true;
    } catch (error) {
        console.error('Error guardando datos:', error);
        mostrarMensaje('Error al guardar los datos', 'error');
        return false;
    }
}
function cargarDatos() {
    try {
        const raw = localStorage.getItem('policlinico_datos');
        if (raw) {
            const parsed = JSON.parse(raw);
            baseDatos.pacientes = parsed.pacientes || [];
            baseDatos.citas = parsed.citas || [];
            baseDatos.medicos = parsed.medicos || [];
            baseDatos.especialidades = parsed.especialidades || [];
            baseDatos.facturas = parsed.facturas || [];
            
            sanitizeEspecialidades();
            
            setTimeout(() => {
                cargarOpcionesPacientes(); // llena los selectores de pacientes
                cargarOpcionesMedicos(); // llena los selectores de médicos
                actualizarTodoTrasCarga(); // actualiza las listas y vistas
            }, 0);
        }
    } catch (e) {
        console.error('Error cargando datos desde localStorage', e);
    }
}
// Parte 4. Limpieza de datos y helpers de seguridad
// Inicialización y limpieza de datos para evitar duplicados en especialidades
function sanitizeEspecialidades() {
    if (!Array.isArray(baseDatos.especialidades)) {
        baseDatos.especialidades = [];
    }
    const seen = new Set();
    const cleaned = [];

    baseDatos.especialidades.forEach(e => {
        if (!e || !e.especialidad) return;
        const id = String(e.id || '');
        if (id && !seen.has(id)) {
            seen.add(id);
            cleaned.push(e);
        }
    });
    
    baseDatos.especialidades = cleaned;
}

// Muestra notificaciones temporales (éxito, error, info) en pantalla
// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo = 'error') {
    const mensajeAnterior = document.querySelector('.mensaje-validacion');
    if (mensajeAnterior) mensajeAnterior.remove();

    const div = document.createElement('div');
    div.className = `mensaje-validacion ${tipo}`;
    div.innerHTML = `<div class="mensaje-contenido"><span class="mensaje-texto">${mensaje}</span></div>`;
    div.setAttribute('role', 'alert');
    div.setAttribute('aria-live', 'assertive');

    document.body.appendChild(div);
    requestAnimationFrame(() => div.classList.add('mostrar'));

    setTimeout(() => {
        div.classList.remove('mostrar');
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// Horarios recurrentes, se covierten a texto legible
function formatHorario(horario) {
    if (!horario) return '-';
    const diasMap = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' };
    const parts = [];
    for (const d of Object.keys(horario)) {
        const franjas = horario[d];
        if (!franjas || !franjas.length) continue;
        const fstr = franjas.map(f => `${f.desde}–${f.hasta}`).join(', ');
        parts.push(`${diasMap[d] || d}: ${fstr}`);
    }
    return parts.join('; ');
}

// Maneja dos formatos de horarios (nuevo y viejo) y los convierte a texto legible
function formatHorarioRecurrente(schedule) {
    if (!schedule) return 'No especificado';
    // Si vienen en formato {recurrente: [...]}
    if (Array.isArray(schedule.recurrente)) {
        const diasMap = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' };
        const parts = schedule.recurrente.map(entry => {
            const dias = (entry.dias || []).map(d => diasMap[d] || d).join(', ');
            const franjas = (entry.franjas || []).map(f => `${f.desde}–${f.hasta}`).join(', ');
            return `${dias}: ${franjas}`;
        }).filter(Boolean);
        if (parts.length === 0) return 'No especificado';
        return parts.join('; ');
    }
    // Si viene en formato viejo (objeto por día), reutilizar formatHorario
    if (typeof schedule === 'object') {
        try { return formatHorario(schedule); } catch (e) { return JSON.stringify(schedule); }
    }
    return String(schedule);
}

function checkFranjasValidas(franjas) {
    // franjas: array of {desde: 'HH:MM', hasta: 'HH:MM'}
    if (!Array.isArray(franjas)) return false;
    const toMinutes = t => {
        const [hh, mm] = (t || '').split(':').map(Number);
        if (isNaN(hh) || isNaN(mm)) return NaN;
        return hh * 60 + mm;
    };
    const ranges = franjas.map(f => ({
        desde: toMinutes(f.desde),
        hasta: toMinutes(f.hasta)
    }));
    for (const r of ranges) {
        if (isNaN(r.desde) || isNaN(r.hasta) || r.hasta <= r.desde) return false;
    }
    // comprobar solapamientos
    ranges.sort((a,b) => a.desde - b.desde);
    for (let i = 1; i < ranges.length; i++) {
        if (ranges[i].desde < ranges[i-1].hasta) return false;
    }
    return true;
}

// Añadir franja a la UI
function addFranjaUI(dia, desde = '', hasta = '') {
    const franjasContainer = document.querySelector('#franjasPorDia');
    if (!franjasContainer) return;
    const area = franjasContainer.querySelector(`[data-dia="${dia}"]`);
    if (!area) return;
    const list = area.querySelector('.franjas-list');
    const item = document.createElement('div');
    item.className = 'franja-item';
    item.style.display = 'flex';
    item.style.gap = '8px';
    item.style.alignItems = 'center';
    item.innerHTML = `
        <input type="time" class="franja-desde" value="${desde}" />
        <span style="font-weight:600">→</span>
        <input type="time" class="franja-hasta" value="${hasta}" />
        <button type="button" class="btn-eliminar-franja" aria-label="Eliminar franja" title="Eliminar" style="margin-left:6px;padding:6px 8px">Eliminar</button>
    `;
    list.appendChild(item);
    item.querySelector('.btn-eliminar-franja').addEventListener('click', () => item.remove());
}

function collectHorarioFromDOM() {
    const container = document.getElementById('horarioRecurrente');
    if (!container) return null;
    const diasInputs = Array.from(container.querySelectorAll('input[name="dias"]'));
    const result = {};
    diasInputs.forEach(inp => {
        if (!inp.checked) return;
        const dia = inp.value;
        const area = container.querySelector(`#franjasPorDia [data-dia="${dia}"]`);
        if (!area) return;
        const franjas = [];
        const items = Array.from(area.querySelectorAll('.franja-item'));
        items.forEach(it => {
            const desde = it.querySelector('.franja-desde')?.value;
            const hasta = it.querySelector('.franja-hasta')?.value;
            if (desde && hasta) franjas.push({ desde, hasta });
        });
        if (franjas.length) result[dia] = franjas;
    });
    return result;
}

// Función auxiliar para escapar HTML
// Convierte caracteres especiales para evitar ataques XSS 
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// Funciones de carga de opciones
// Llena todos los menús desplegables de pacientes con los nombres actualizados
function cargarOpcionesPacientes() {
    const pacienteSelects = document.querySelectorAll('select#paciente, select[name="paciente"]');
    pacienteSelects.forEach(select => {
        if (!select) return;
        const valorSeleccionado = select.value;
        select.innerHTML = '';
        
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Seleccione un paciente';
        select.appendChild(defaultOpt);
        
        const pacientesOrdenados = [...baseDatos.pacientes].sort((a, b) => 
            a.nombres.localeCompare(b.nombres)
        );
        
        pacientesOrdenados.forEach(p => {
            const opt = document.createElement('option');
            opt.value = String(p.id);
            opt.textContent = p.nombres;
            select.appendChild(opt);
        });

        if (valorSeleccionado) {
            select.value = valorSeleccionado;
        }
    });
}
// Inicializar UI de horario recurrente para médicos
// Configura la interfaz para que al marcar días (Lunes, Martes...) aparezcan campos para horarios
// Permite agregar/eliminar franjas horarias dinámicamente
function initHorarioRecurrente() {
    const container = document.getElementById('horarioRecurrente');
    if (!container) return;

    const franjasWrapper = document.getElementById('franjasPorDia');
    const dias = ['lun','mar','mie','jue','vie','sab','dom'];
    // cuando cambie un checkbox de día, añadir o quitar su bloque de franjas
    const checkboxList = container.querySelectorAll('input[name="dias"]');
    checkboxList.forEach(cb => {
        cb.addEventListener('change', function() {
            const day = this.value;
            if (this.checked) {
                // crear bloque de franjas para el día si no existe
                if (!franjasWrapper.querySelector(`[data-day="${day}"]`)) {
                    const dayBlock = document.createElement('div');
                    dayBlock.className = 'day-franjas';
                    dayBlock.setAttribute('data-day', day);
                    dayBlock.innerHTML = `
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
                            <strong style="min-width:48px;text-transform:capitalize">${day}</strong>
                            <button type="button" class="add-franja" data-day="${day}">Agregar franja</button>
                        </div>
                        <div class="franjas" data-day="${day}"></div>
                    `;
                    franjasWrapper.appendChild(dayBlock);
                    // agregar una franja por defecto
                    addFranjaToDay(day);
                }
            } else {
                const existing = franjasWrapper.querySelector(`[data-day="${day}"]`);
                if (existing) existing.remove();
            }
        });
    });
    // Usa "delegación de eventos" para manejar botones creados dinámicamente
    // Delegación para botones agregar/eliminar franjas
    franjasWrapper.addEventListener('click', function(e) {
        const addBtn = e.target.closest('.add-franja');
        if (addBtn) {
            const day = addBtn.getAttribute('data-day');
            addFranjaToDay(day);
            return;
        }

        const rem = e.target.closest('.remove-franja');
        if (rem) {
            const fr = rem.closest('.franja');
            if (fr) fr.remove();
            return;
        }
    });
}
// Agrega visualmente una franja horaria (08:00 → 12:00) a un día específico
function addFranjaToDay(day, desde = '', hasta = '') {
    const container = document.querySelector(`.franjas[data-day="${day}"]`);
    if (!container) return;
    const fr = document.createElement('div');
    fr.className = 'franja';
    fr.style.display = 'flex';
    fr.style.gap = '8px';
    fr.style.alignItems = 'center';
    fr.style.marginBottom = '6px';
    fr.innerHTML = `
        <input type="time" class="fr-desde" value="${desde}">
        <span style="font-size:0.95rem">→</span>
        <input type="time" class="fr-hasta" value="${hasta}">
        <button type="button" class="remove-franja" aria-label="Eliminar franja" style="background:#eee;border:none;padding:6px;border-radius:6px;cursor:pointer">✕</button>
    `;
    container.appendChild(fr);
}
// Llena los menús desplegables de médicos, mostrando "Nombre - Especialidad"
function cargarOpcionesMedicos() {
    const medicoSelects = document.querySelectorAll('select#medico, select[name="medico"]');
    medicoSelects.forEach(select => {
        if (!select) return;
        select.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Seleccione un médico';
        select.appendChild(defaultOpt);

        const medicosOrdenados = [...baseDatos.medicos].sort((a, b) => 
            a.especialidad.localeCompare(b.especialidad)
        );
        medicosOrdenados.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.nombre;
            opt.textContent = `${m.nombre} - ${m.especialidad}`;
            select.appendChild(opt);
        });
    });
}
// Validaciones específicas
function validarCedulaEcuatoriana(cedula) {
    cedula = cedula?.trim() || '';
    if (cedula.length !== 10) {
        mostrarMensaje('La cédula debe tener 10 dígitos', 'error');
        return false;
    }
    if (!/^\d+$/.test(cedula)) {
        mostrarMensaje('La cédula solo debe contener números', 'error');
        return false;
    }
    const provincia = parseInt(cedula.substring(0, 2));
    if (provincia < 1 || provincia > 24) {
        mostrarMensaje('Código de provincia inválido en la cédula', 'error');
        return false;
    }
    const digitoVerificador = parseInt(cedula.charAt(9));
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let valor = parseInt(cedula.charAt(i)) * coeficientes[i];
        if (valor >= 10) valor -= 9;
        suma += valor;
    } 
    const resultado = suma % 10;
    const digitoEsperado = resultado === 0 ? 0 : 10 - resultado;
    if (digitoVerificador !== digitoEsperado) {
        mostrarMensaje('Número de cédula inválido', 'error');
        return false;
    }
    return true;
}
// Verifica que no se registre dos veces la misma cédula.
function cedulaYaExiste(cedula) {
    return baseDatos.pacientes.some(p => p.cedula === cedula);
}
// Verifica que no se registre dos veces el mismo correo electrónico
function emailYaExiste(email) {
    if (!email) return false;
    return baseDatos.pacientes.some(p => 
        p.email && p.email.toLowerCase() === email.toLowerCase()
    );
}
// Verifica que el número de teléfono celular es válido
function validarTelefono(telefono) {
    telefono = telefono?.trim() || '';
    // Definimos las validaciones en un array para facilitar la lectura
    const validaciones = [
        {
            condicion: telefono.length === 10,
            mensaje: 'El teléfono celular debe tener 10 dígitos'
        },
        {
            condicion: telefono.startsWith('09'),
            mensaje: 'El celular debe comenzar con 09'
        },
        {
            condicion: /^\d+$/.test(telefono),
            mensaje: 'El teléfono solo debe contener números'
        }
    ];
    // Recorremos las validaciones y mostramos el primer error que encontremos
    for (const v of validaciones) {
        if (!v.condicion) {
            mostrarMensaje(v.mensaje, 'error');
            return false;
        }
    }
    // Si pasa todas las validaciones, devolvemos verdadero
    return true;
}
// Valida fechas según el tipo (nacimiento o cita)
function validarFecha(fecha, tipo = 'nacimiento') {
    if (!fecha) {
        mostrarMensaje('Debe seleccionar una fecha', 'error');
        return false;
    }
    // Determinar si la fecha es válida
    const fechaSeleccionada = new Date(fecha);
    if (isNaN(fechaSeleccionada.getTime())) {
        mostrarMensaje('Formato de fecha inválido', 'error');
        return false;
    }
    // Obtener la fecha actual para comparaciones
    const fechaActual = new Date();
    // Validaciones específicas según el tipo de fecha
    switch (tipo) {
        case 'nacimiento':
            if (fechaSeleccionada > fechaActual) {
                mostrarMensaje('La fecha de nacimiento no puede ser futura', 'error');
                return false;
            }
            // Calcular edad 
            const edad = fechaActual.getFullYear() - fechaSeleccionada.getFullYear();
            const mesActual = fechaActual.getMonth();
            const mesNacimiento = fechaSeleccionada.getMonth();
            const diaActual = fechaActual.getDate();
            const diaNacimiento = fechaSeleccionada.getDate();
            // Ajustar edad si no ha cumplido años este año
            const edadAjustada = edad - (
                (mesActual < mesNacimiento || 
                 (mesActual === mesNacimiento && diaActual < diaNacimiento)) ? 1 : 0
            );
            // Verificar rango de edad
            if (edadAjustada > 120) {
                mostrarMensaje('La edad máxima permitida es 120 años', 'error');
                return false;
            }
            break;
        // Validaciones para fechas de citas médicas  
        case 'cita':
            const hoyMismo = new Date(fechaActual.setHours(0, 0, 0, 0));
            if (fechaSeleccionada < hoyMismo) {
                mostrarMensaje('La fecha de la cita no puede ser en el pasado', 'error');
                return false;
            }
            // Verificar que no sea más de 6 meses en el futuro
            const seisMesesDespues = new Date(fechaActual);
            seisMesesDespues.setMonth(seisMesesDespues.getMonth() + 6);
            if (fechaSeleccionada > seisMesesDespues) {
                mostrarMensaje('No se pueden agendar citas con más de 6 meses de anticipación', 'error');
                return false;
            }
            break;
        default:
            console.error(`Tipo de fecha no soportado: ${tipo}`);
            return false;
    }
    // Si pasa todas las validaciones, devolvemos verdadero
    return true;
}
// Calcula la edad en años a partir de la fecha de nacimiento
function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    // Ajustar si no ha cumplido años este año
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}
// Calcula el IMC y devuelve la clasificación
function calcularIMC(peso, estatura) {
    if (!peso || !estatura) return '';
    // Convertir a números
    peso = parseFloat(peso);
    estatura = parseFloat(estatura);
    // Validar rangos razonables
    if (peso <= 0 || peso > 500) return '';
    if (estatura <= 0 || estatura > 3) return '';
    // Calcular IMC
    const imc = peso / Math.pow(estatura, 2);
    // Definir rangos de IMC
    const rangosIMC = [
        { max: 18.5, descripcion: 'Bajo peso' },
        { max: 25, descripcion: 'Normal' },
        { max: 30, descripcion: 'Sobrepeso' },
        { max: Infinity, descripcion: 'Obesidad' }
    ];
    // Encontrar la clasificación correspondiente
    const clasificacion = rangosIMC.find(rango => imc < rango.max)?.descripcion || 'Obesidad';
    // Devolver resultado
    return `${imc.toFixed(2)} - ${clasificacion}`;
}

// Validaciones de formularios
// Valida el formulario de login
function validarLogin(event) {
    event.preventDefault();
    // Recoger datos del formulario
    const datos = {
        rol: document.getElementById('rol')?.value.trim(),
        usuario: document.getElementById('usuario')?.value.trim(),
        contrasena: document.getElementById('contrasena')?.value
    };
    // Validaciones basicas
    if (!datos.rol || !datos.usuario || !datos.contrasena) {
        mostrarMensaje('Todos los campos son obligatorios', 'error');
        return false;
    }
    // Validar formato de correo institucional
    const correoRegex = /^[^\s@]+@(uleam\.edu\.ec|live\.uleam\.edu\.ec)$/i;
    if (!correoRegex.test(datos.usuario)) {
        mostrarMensaje('Solo se permiten correos institucionales (@uleam.edu.ec o @live.uleam.edu.ec)', 'error');
        return false;
    }
    // Validar complejidad de la contraseña
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passRegex.test(datos.contrasena)) {
        mostrarMensaje('La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas, números y caracteres especiales', 'error');
        return false;
    }
    // Validar rol seleccionado
    const rolesValidos = ['admin', 'medico', 'enfermera'];
    if (!rolesValidos.includes(datos.rol)) {
        mostrarMensaje('Rol no válido', 'error');
        return false;
    }
    // Simular autenticación exitosa
    const rolTexto = document.querySelector(`#rol option[value="${datos.rol}"]`)?.textContent || datos.rol;
    const tiempoLogin = new Date().toISOString();
    // Guardar sesión activa en variable global y localStorage
    window.sesionActiva = {
        usuario: datos.usuario,
        rol: rolTexto,
        activa: true,
        ultimoAcceso: tiempoLogin
    };
    // Guardar en localStorage
    try {
        const sesionData = {
            usuario: datos.usuario,
            rol: rolTexto,
            ultimoAcceso: tiempoLogin
        };
        localStorage.setItem('sesionUsuario', JSON.stringify(sesionData));
        localStorage.setItem('rolActivo', rolTexto);
    } catch (e) {
        console.warn('No se pudo guardar la sesión en localStorage');
    }
    // Mostrar mensaje de bienvenida
    mostrarMensaje(`¡Bienvenido ${rolTexto}!`, 'exito');
    // Redirigir a la página principal después de un breve retraso
    setTimeout(() => {
        // Redirigir siempre a la página principal tras iniciar sesión
        window.location.href = 'PagPrincipal.html';
    }, 500);
    // Evita el envío del formulario
    return false;
}
// Obtiene la ruta de destino según el rol seleccionado
function obtenerRutaDestino(rol) {
    if (!rol) {
        mostrarMensaje('Debe seleccionar un rol', 'error');
        return 'Inicio.html';
    }
// Mapeo de roles a rutas
    const rutas = {
        admin: 'PagPrincipal.html',
        medico: 'Pacientes.html',
        enfermera: 'Citas.html'
    };
    // Devolver la ruta correspondiente o la página de inicio por defecto
    return rutas[rol] || 'Inicio.html';
}
// Valida el formulario de olvido de contraseña
function validarOlvidoContrasena(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    // Recoger el correo ingresado
    const ingreso = prompt('Ingrese su correo institucional para recuperar la contraseña:');
    if (ingreso === null) return false;
    // Validar el correo ingresado
    const correo = ingreso.trim();
    if (!correo) {
        mostrarMensaje('Debe ingresar un correo electrónico', 'error');
        return false;
    }
    // Validar formato de correo institucional
    const correoRegex = /^[^\s@]+@(uleam\.edu\.ec|live\.uleam\.edu\.ec)$/i;
    if (!correoRegex.test(correo)) {
        mostrarMensaje('Sólo se permiten correos institucionales (@uleam.edu.ec o @live.uleam.edu.ec)', 'error');
        return false;
    }
    // Verificar si el correo existe en la "base de datos"
    const existePaciente = baseDatos.pacientes.some(p => p.email && p.email.toLowerCase() === correo.toLowerCase());
    const existeMedico = baseDatos.medicos.some(m => m.correo && m.correo.toLowerCase() === correo.toLowerCase());
    // Si no existe, mostrar mensaje de error
    if (!existePaciente && !existeMedico) {
        mostrarMensaje('El correo no está registrado en el sistema', 'error');
        return false;
    }
    // Simular envío de correo de recuperación
    mostrarMensaje(`Si el correo existe, se ha enviado un enlace de recuperación a ${correo}`, 'exito');
    return false;
}
// Valida el formulario de registro de pacientes
function validarPacientes() {
    const datos = {
        nombres: document.getElementById('nombres')?.value.trim() || '',
        cedula: document.getElementById('cedula')?.value.trim() || '',
        fechaNacimiento: document.getElementById('fechaNacimiento')?.value || '',
        sexo: document.getElementById('sexo')?.value || '',
        estadoCivil: document.getElementById('estadoCivil')?.value || '',
        tipoSangre: document.getElementById('tipoSangre')?.value || '',
        email: document.getElementById('email')?.value.trim() || ''
    };
    // Validaciones
    if (!validarCampoVacio(datos.nombres, 'Nombres y Apellidos')) return false;
    if (!validarLongitudMinima(datos.nombres, 5, 'Nombres y Apellidos')) return false;
    if (!validarSoloLetras(datos.nombres, 'Nombres y Apellidos')) return false;
    if (!validarCedulaEcuatoriana(datos.cedula)) return false;
    if (cedulaYaExiste(datos.cedula)) {
        mostrarMensaje('Esta cédula ya está registrada en el sistema', 'error');
        return false;
    }
    // Validar fecha de nacimiento
    if (!validarFecha(datos.fechaNacimiento, 'nacimiento')) return false;
    // Validar campos de selección
    const camposSeleccion = [
        { valor: datos.sexo, nombre: 'sexo' },
        { valor: datos.estadoCivil, nombre: 'estado civil' },
        { valor: datos.tipoSangre, nombre: 'tipo de sangre' }
    ];
    // Validar cada campo de selección
    for (const campo of camposSeleccion) {
        if (!validarCampoVacio(campo.valor, campo.nombre)) return false;
    }
    // Validar correo electrónico si se proporcionó
    if (datos.email) {
        if (!validarEmail(datos.email)) return false;
        if (emailYaExiste(datos.email)) {
            mostrarMensaje('Este correo ya está registrado en el sistema', 'error');
            return false;
        }
    }
    // Si pasa todas las validaciones, guardar el paciente
    const paciente = {
        id: Date.now().toString(),
        nombres: datos.nombres,
        cedula: datos.cedula,
        fechaNacimiento: datos.fechaNacimiento,
        edad: calcularEdad(datos.fechaNacimiento),
        sexo: datos.sexo,
        estadoCivil: datos.estadoCivil,
        tipoSangre: datos.tipoSangre,
        email: datos.email || '',
        fechaRegistro: new Date().toLocaleString()
    };
    // Guardar en "base de datos"
    baseDatos.pacientes.push(paciente);
    guardarDatos();
    mostrarMensaje('Paciente registrado exitosamente', 'exito');
    renderListaPacientes();
    cargarOpcionesPacientes();
    actualizarTodoTrasCarga();
    // Mostrar resumen del paciente registrado después de un breve retraso
    setTimeout(() => {
        mostrarMensaje(`Paciente: ${datos.nombres} | Cédula: ${datos.cedula}`, 'info');
    }, 2000);

    return false;
}
// Valida el formulario de registro de citas médicas
function validarCitas() {
    let pacienteCampo = document.getElementById('paciente');
    let paciente = '';
    let cedula = document.getElementById('cedula')?.value.trim();
    // Obtener el nombre del paciente según el tipo de campo (select o input)
    if (pacienteCampo) {
        if (pacienteCampo.tagName === 'SELECT') {
            const selectedId = pacienteCampo.value;
            const pObj = baseDatos.pacientes.find(p => String(p.id) === String(selectedId));
            paciente = pObj ? pObj.nombres : '';
            if (pObj) cedula = pObj.cedula || cedula;
        } else {
            paciente = pacienteCampo.value.trim();
        }
    }
    const medico = document.getElementById('medico')?.value.trim();
    const fecha = document.getElementById('fecha')?.value;
    const consultorio = document.getElementById('consultorio')?.value.trim();
    const estado = document.getElementById('estado')?.value;
    if (!paciente) {
        mostrarMensaje('Debe seleccionar un paciente', 'error');
        return false;
    }
    if (!cedula) {
        mostrarMensaje('La cédula del paciente es requerida', 'error');
        return false;
    }
    const pacienteExiste = baseDatos.pacientes.find(p => p.cedula === cedula);
    if (!pacienteExiste) {
        mostrarMensaje('Esta cédula no está registrada. Debe registrar al paciente primero.', 'error');
        return false;
    }
    if (!medico) {
        mostrarMensaje('Debe seleccionar un médico', 'error');
        return false;
    }
    if (!fecha) {
        mostrarMensaje('Debe seleccionar fecha y hora de la cita', 'error');
        return false;
    }
    if (!validarCampoVacio(consultorio, 'Consultorio Asignado')) return false;
    if (!estado) {
        mostrarMensaje('Debe seleccionar el estado de la cita', 'error');
        return false;
    }
    // Validar cita
    const cita = {
        id: Date.now().toString(),
        paciente,
        cedula,
        medico,
        fecha,
        consultorio,
        estado,
        observaciones: document.getElementById('observaciones')?.value.trim() || '',
        fechaRegistro: new Date().toLocaleString()
    };
    // Guardar en "base de datos"
    baseDatos.citas.push(cita);
    guardarDatos();
    mostrarMensaje('Cita médica registrada exitosamente', 'exito');
    actualizarTodoTrasCarga();
    // Mostrar resumen de la cita registrada después de un breve retraso
    setTimeout(() => {
        mostrarMensaje(`Cita para ${paciente} | Fecha: ${new Date(fecha).toLocaleString()}`, 'info');
    }, 2000);
    // Evita el envío del formulario
    return false;
}
// Valida el formulario de registro de médicos
function validarMedicos() {
    const nombre = document.getElementById('nombre')?.value.trim();
    const especialidad = document.getElementById('especialidad')?.value.trim();
    const telefono = document.getElementById('telefono')?.value.trim();
    const correo = document.getElementById('correo')?.value.trim();
    // El horario ahora se recoge desde la UI de horario recurrente (por días y franjas)
    if (!validarCampoVacio(nombre, 'Nombres y Apellidos')) return false;
    const regexMedico = /^(Dr\.|Dra\.)?\s*[A-Za-záéíóúÁÉÍÓÚñÑ]+(\s+[A-Za-záéíóúÁÉÍÓÚñÑ]+)*$/;
    
    if (!regexMedico.test(nombre)) {
        mostrarMensaje('Ingrese un nombre válido. Ejemplo: "Dr. Juan Pérez" o "Dra. María González"', 'error');
        return false;
    }
    
    if (!validarCampoVacio(especialidad, 'Especialidad')) return false;
    if (telefono && !validarTelefono(telefono)) return false;
    if (!validarEmail(correo)) return false;
    
    const emailExiste = baseDatos.medicos.some(m => m.correo === correo);
    if (emailExiste) {
        mostrarMensaje('Este correo ya está registrado', 'error');
        return false;
    }
    
    // Construir el objeto de horario recurrente
    const diasOrder = ['lun','mar','mie','jue','vie','sab','dom'];
    const franjasWrapper = document.getElementById('franjasPorDia');
    const schedule = { recurrente: [], excepciones: [] };
    // Recorrer cada día y recoger sus franjas
    diasOrder.forEach(day => {
        const dayContainer = franjasWrapper.querySelector(`.franjas[data-day="${day}"]`);
        if (!dayContainer) return;
        const franjas = [];
        dayContainer.querySelectorAll('.franja').forEach(fr => {
            const desde = fr.querySelector('.fr-desde')?.value;
            const hasta = fr.querySelector('.fr-hasta')?.value;
            if (desde && hasta) {
                if (desde >= hasta) {
                    mostrarMensaje(`En ${day.toUpperCase()} una franja tiene desde >= hasta`, 'error');
                    throw new Error('Franja inválida');
                }
                franjas.push({ desde, hasta });
            }
        });
        if (franjas.length) {
            schedule.recurrente.push({ dias: [day], franjas });
        }
    });
    // Validar que al menos un día tenga franjas
    if (schedule.recurrente.length === 0) {
        mostrarMensaje('Debe definir al menos una franja de atención en algún día', 'error');
        return false;
    }
    // Validar solapamientos en franjas
    const medico = {
        id: Date.now().toString(),
        nombre: nombre.startsWith('Dr.') || nombre.startsWith('Dra.') ? nombre : `Dr${nombre.includes('María') || nombre.includes('Ana') ? 'a' : ''}. ${nombre}`,
        especialidad,
        telefono,
        correo,
    horario: schedule,
        fechaRegistro: new Date().toLocaleString()
    };
    // Guardar en "base de datos"
    baseDatos.medicos.push(medico);
    guardarDatos();
    mostrarMensaje('Médico registrado exitosamente', 'exito');
    cargarOpcionesMedicos();
    actualizarTodoTrasCarga();
    
    setTimeout(() => {
        mostrarMensaje(`Dr(a). ${nombre} | Especialidad: ${especialidad}`, 'info');
    }, 1000);
    // Evita el envío del formulario
    return false;
}
// Valida el formulario de registro de especialidades médicas
function validarEspecialidad() {
    const especialidad = document.getElementById('especialidad')?.value;
    const descripcion = document.getElementById('descripcion')?.value.trim();
    const area = document.getElementById('area')?.value.trim();
    const horario = document.getElementById('horario')?.value.trim();
    const responsable = document.getElementById('responsable')?.value.trim();
    
    if (!especialidad) {
        mostrarMensaje('Debe seleccionar una especialidad', 'error');
        return false;
    }
    if (!validarCampoVacio(descripcion, 'Descripción')) return false;
    if (!validarLongitudMinima(descripcion, 10, 'Descripción')) return false;
    if (!validarCampoVacio(area, 'Área o Departamento')) return false;
    if (!validarCampoVacio(horario, 'Horario de Atención')) return false;
    if (!validarCampoVacio(responsable, 'Médico Responsable')) return false;
    if (!validarSoloLetras(responsable, 'Médico Responsable')) return false;
    
    const nuevaEspecialidad = {
        id: Date.now(),
        especialidad,
        descripcion,
        area,
        horario,
        responsable
    };
    
    baseDatos.especialidades.push(nuevaEspecialidad);
    guardarDatos();
    
    document.getElementById('formEspecialidad')?.reset();
    renderListaEspecialidades();
    
    mostrarMensaje('Especialidad guardada correctamente', 'exito');
    sanitizeEspecialidades();
    guardarDatos();
    return true;
}
// Valida el formulario de facturación
function validarFacturacion() {
    let pacienteCampo = document.getElementById('paciente');
    let paciente = '';
    let cedula = document.getElementById('cedula')?.value.trim();
    // Obtener el nombre del paciente según el tipo de campo (select o input)
    if (pacienteCampo) {
        if (pacienteCampo.tagName === 'SELECT') {
            const selId = pacienteCampo.value;
            const pObj = baseDatos.pacientes.find(p => String(p.id) === String(selId));
            paciente = pObj ? pObj.nombres : '';
            if (pObj) cedula = pObj.cedula || cedula;
        } else {
            paciente = pacienteCampo.value.trim();
        }
    } 
    const medico = document.getElementById('medico')?.value;
    const servicio = document.getElementById('servicio')?.value;
    const costo = document.getElementById('costo')?.value;
    const metodoPago = document.getElementById('metodoPago')?.value;
    const fecha = document.getElementById('fecha')?.value;
    
    if (!validarCampoVacio(paciente, 'Nombre del Paciente')) return false;
    if (!validarSoloLetras(paciente, 'Nombre del Paciente')) return false;
    if (!validarCedulaEcuatoriana(cedula)) return false;
    if (!medico) {
        mostrarMensaje('Debe seleccionar un médico', 'error');
        return false;
    }
    if (!servicio) {
        mostrarMensaje('Debe seleccionar un servicio', 'error');
        return false;
    }
    if (!costo || parseFloat(costo) <= 0) {
        mostrarMensaje('El costo debe ser mayor a 0', 'error');
        return false;
    }
    if (!metodoPago) {
        mostrarMensaje('Debe seleccionar un método de pago', 'error');
        return false;
    }
    if (!fecha) {
        mostrarMensaje('Debe seleccionar la fecha de emisión', 'error');
        return false;
    }
    // Crear objeto de factura
    const factura = {
        id: Date.now(),
        numeroFactura: 'FACT-' + Date.now(),
        paciente,
        cedula,
        medico,
        servicio,
        costo: parseFloat(costo),
        metodoPago,
        fecha,
        fechaRegistro: new Date().toLocaleString()
    };
    // Guardar en "base de datos"
    baseDatos.facturas.push(factura);
    guardarDatos();
    mostrarMensaje('✓ Factura generada exitosamente', 'exito');
    actualizarTodoTrasCarga();
    // Mostrar resumen de la factura generada después de un breve retraso
    window.lastSavedFacturaId = factura.id;
    localStorage.setItem('lastSavedFacturaId', factura.id);
    setTimeout(() => {
        mostrarMensaje(`Factura ${factura.numeroFactura} | Total: ${costo}`, 'info');
    }, 1000);
    // Evita el envío del formulario
    return false;
}
// Valida el formulario de generación de reportes
function validarReportes() {
    const fechaInicio = document.getElementById('fechaInicio')?.value;
    const fechaFin = document.getElementById('fechaFin')?.value;
    const tipoReporte = document.getElementById('tipoReporte')?.value;
    let pacienteCampo = document.getElementById('paciente');
    let paciente = '';
    let pacienteId = '';
    if (pacienteCampo) {
        if (pacienteCampo.tagName === 'SELECT') {
            pacienteId = pacienteCampo.value;
            const pObj = baseDatos.pacientes.find(p => String(p.id) === String(pacienteId));
            paciente = pObj ? pObj.nombres : '';
        } else {
            paciente = pacienteCampo.value.trim();
        }
    }
    const medico = document.getElementById('medico')?.value.trim();
    if (!paciente && !medico && !fechaInicio && !fechaFin && !tipoReporte) {
        mostrarMensaje('Debe seleccionar al menos un criterio de búsqueda', 'error');
        return false;
    }
    if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        if (inicio > fin) {
            mostrarMensaje('La fecha de inicio no puede ser mayor a la fecha final', 'error');
            return false;
        }
    }
    // Filtrar resultados según los criterios
    let resultados = [];
    const inicio = fechaInicio ? new Date(fechaInicio) : null;
    const fin = fechaFin ? new Date(fechaFin) : null;
    
    const incluyeTexto = (valor, texto) => {
        if (!texto) return true;
        if (!valor) return false;
        return String(valor).toLowerCase().includes(texto.toLowerCase());
    };

    if (pacienteId) {
        const nombrePaciente = paciente;
        let todos = [];
        const cedulaPaciente = baseDatos.pacientes.find(p => String(p.id) === String(pacienteId))?.cedula;
        // Buscar en todas las colecciones relacionadas con el paciente
        todos = todos.concat((baseDatos.citas || []).filter(c => String(c.cedula) === String(cedulaPaciente)));
        todos = todos.concat((baseDatos.facturas || []).filter(f => String(f.cedula) === String(cedulaPaciente)));
        // Agregar más colecciones si es necesario
        const pObj = baseDatos.pacientes.find(p => String(p.id) === String(pacienteId));
        if (pObj) todos.push(pObj);
        // Filtrar por médico y fechas
        resultados = todos.filter(r => {
            if (medico) {
                if (r.medico && !incluyeTexto(r.medico, medico)) return false;
                if (r.responsable && !incluyeTexto(r.responsable, medico)) return false;
            }
            // Filtrar por fechas
            if (inicio || fin) {
                const fechaStr = r.fecha || r.fechaRegistro;
                if (!fechaStr) return false;
                const f = new Date(fechaStr);
                if (isNaN(f)) return false;
                if (inicio && f < inicio) return false;
                if (fin && f > (new Date(fin.getFullYear(), fin.getMonth(), fin.getDate(), 23, 59, 59))) return false;
            }
            return true; // Si pasa todos los filtros, incluir el registro
        });
        // Mostrar resultados
        mostrarMensaje(`Reporte generado: ${resultados.length} resultado(s)`, 'exito');
        lastReportResults = resultados;
        lastReportType = tipoReporte;
        renderListaReportes(resultados, tipoReporte);
        return false;
    }
    // Seleccionar la colección según el tipo de reporte
    if (!tipoReporte || tipoReporte === 'consultas') {
        resultados = [...baseDatos.citas];
    } else if (tipoReporte === 'especialidades') {
        resultados = [...baseDatos.especialidades];
    } else if (tipoReporte === 'facturacion') {
        resultados = [...baseDatos.facturas];
    } else if (tipoReporte === 'pacientes') {
        resultados = [...baseDatos.pacientes];
    }
    // Aplicar filtros
    resultados = resultados.filter(r => {
        if (paciente) {
            if (r.paciente) {
                if (!incluyeTexto(r.paciente, paciente)) return false;
            } else if (r.nombres) {
                if (!incluyeTexto(r.nombres, paciente)) return false;
            }
        }
        if (medico) {
            if (r.medico && !incluyeTexto(r.medico, medico)) return false;
            if (r.responsable && !incluyeTexto(r.responsable, medico)) return false;
        }
        
        if (inicio || fin) {
            const fechaStr = r.fecha || r.fechaRegistro;
            if (!fechaStr) return false;
            const f = new Date(fechaStr);
            if (isNaN(f)) return false;
            if (inicio && f < inicio) return false;
            if (fin && f > (new Date(fin.getFullYear(), fin.getMonth(), fin.getDate(), 23, 59, 59))) return false;
        }
        return true; // Si pasa todos los filtros, incluir el registro
    });
    // Mostrar resultados
    mostrarMensaje(`Reporte generado: ${resultados.length} resultado(s)`, 'exito');
    lastReportResults = resultados;
    lastReportType = tipoReporte;
    renderListaReportes(resultados, tipoReporte);
    return false;
}
// Valida el formulario de historial clínico
function validarHistorial() {
    const inputs = document.querySelectorAll('input[type="number"]');
    const peso = inputs[0]?.value;
    const estatura = inputs[1]?.value;
    if (peso && (parseFloat(peso) < 0.5 || parseFloat(peso) > 300)) {
        mostrarMensaje('El peso debe estar entre 0.5 y 300 kg', 'error');
        return false;
    }
    if (estatura && (parseFloat(estatura) < 0.3 || parseFloat(estatura) > 2.5)) {
        mostrarMensaje('La estatura debe estar entre 0.3 y 2.5 metros', 'error');
        return false;
    }
    mostrarMensaje('Historia clínica guardada exitosamente', 'exito');
    return false;
}
// Función reutilizable para mostrar cualquier tipo de lista
// Crea tarjetas (cards) para cada registro
// Agrega botones de acción (PDF, Editar, Eliminar)
// Maneja casos sin datos
function renderizarListaDatos(options) {
    const {
        id,
        tipo,
        titulo,
        datos,
        formatoCampos,
        acciones = ['pdf', 'editar', 'eliminar'],
        mensaje = `No hay ${tipo} registrados todavía.`
    } = options;

    const form = document.getElementById(`form${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    if (!form) return;

    const existente = document.getElementById(`lista-${id || tipo}`);
    if (existente) existente.remove();

    const container = form.parentElement || document.querySelector('.container');
    if (!container) return;

    const lista = document.createElement('div');
    lista.id = `lista-${id || tipo}`;
    lista.className = 'lista-datos';

    if (!Array.isArray(datos) || datos.length === 0) {
        lista.innerHTML = `<p>${mensaje}</p>`;
    } else {
        let html = `<h3>${titulo || `Listado de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`}</h3>
                    <div class="datos-grid">`;
        
        datos.forEach(item => {
            const campos = formatoCampos(item);
            html += `
                <div class="dato-card" data-id="${item.id || ''}">
                    <div class="dato-info">
                        <h4>${campos[0][1]}</h4>
                        <div class="dato-campos">
                            ${campos.slice(1).map(([label, value]) => 
                                `<p><strong>${label}:</strong> ${value}</p>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="dato-acciones">
                        ${acciones.includes('pdf') ? 
                            `<button onclick="generarPDF('${tipo}', '${item.id}')" class="btn-pdf">PDF</button>` : ''}
                        ${acciones.includes('editar') ? 
                            `<button onclick="editRegistro('${tipo}', '${item.id}')" class="btn-editar">Editar</button>` : ''}
                        ${acciones.includes('eliminar') ? 
                            `<button onclick="deleteRegistro('${tipo}', '${item.id}')" class="btn-eliminar">Eliminar</button>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        lista.innerHTML = html;
    }
    container.appendChild(lista);
}
// Lista Pacientes
function renderListaPacientes() {
    renderizarListaDatos({
        tipo: 'pacientes',
        titulo: 'Listado de Pacientes Registrados',
        datos: baseDatos.pacientes,
        formatoCampos: p => [
            ['Nombre', p.nombres],
            ['Cédula', p.cedula],
            ['Edad', `${p.edad} años`],
            ['Tipo de Sangre', p.tipoSangre || '-']
        ]
    });
}
// Lista Medicos
function renderListaMedicos() {
    renderizarListaDatos({
        tipo: 'medicos',
        titulo: 'Listado de Médicos',
        datos: baseDatos.medicos,
        formatoCampos: m => {
            const nombreMedico = m.nombre ? 
                (m.nombre.trim().toLowerCase().startsWith('dr') ? m.nombre : 'Dr. ' + m.nombre) : '';
            const campos = [
                ['Nombre', nombreMedico],
                ['Especialidad', m.especialidad || '-'],
                ['Teléfono', m.telefono || '-']
            ];
            if (m.correo) campos.push(['Email', m.correo]);
            return campos;
        }
    });
}
// Lista Citas
function renderListaCitas() {
    renderizarListaDatos({
        tipo: 'citas',
        titulo: 'Listado de Citas Médicas',
        datos: baseDatos.citas,
        formatoCampos: c => {
            const paciente = baseDatos.pacientes.find(p => p.cedula === c.cedula) || {};
            const fecha = new Date(c.fecha).toLocaleString();
            return [
                ['Fecha', fecha],
                ['Paciente', paciente.nombres || 'No encontrado'],
                ['Médico', c.medico],
                ['Estado', c.estado],
                ['Consultorio', c.consultorio],
                ['Observaciones', c.observaciones || 'Sin observaciones']
            ];
        }
    });
}
// Listas Especialidades
function renderListaEspecialidades() {
    renderizarListaDatos({
        tipo: 'especialidades',
        titulo: 'Listado de Especialidades Médicas',
        datos: baseDatos.especialidades.filter(e => e && e.especialidad),
        formatoCampos: e => [
            ['Especialidad', e.especialidad],
            ['Médico Responsable', e.responsable ? 'Dr. ' + e.responsable : '-'],
            ['Horario', e.horario || '-']
        ]
    });
}
// Lista Facturación
function renderListaFacturas() {
    renderizarListaDatos({
        tipo: 'facturas',
        titulo: 'Listado de Facturas',
        datos: baseDatos.facturas.slice().reverse(),
        formatoCampos: f => {
            const fecha = f.fecha ? new Date(f.fecha).toLocaleString() : (f.fechaRegistro || '-');
            const total = (typeof f.costo !== 'undefined') ? 
                Number(f.costo).toFixed(2) : 
                (f.total ? f.total : '-');
            return [
                ['Número', `#${f.numeroFactura || f.id}`],
                ['Paciente', f.paciente || '-'],
                ['Médico', f.medico || '-'],
                ['Servicio', f.servicio || '-'],
                ['Total', `${total}`],
                ['Fecha', fecha]
            ];
        }
    });
}
// Lista Reporte
function renderListaReportes(resultados, tipo) {
    const existente = document.getElementById('lista-reportes');
    if (existente) existente.remove();

    const container = document.querySelector('.container') || document.body;
    const lista = document.createElement('div');
    lista.id = 'lista-reportes';
    lista.className = 'lista-datos';

    if (!resultados || resultados.length === 0) {
        lista.innerHTML = '<p>No se encontraron resultados para los criterios indicados.</p>';
        container.appendChild(lista);
        return;
    }
    let html = '<h3>Resultados (' + resultados.length + ')</h3><div class="datos-grid">';
    resultados.forEach(r => {
        if (!r) return;
        
        let data = {};
        
        if (r.numeroFactura) {
            data = {
                tipo: 'Factura',
                campos: [
                    ['Número', '#' + r.numeroFactura],
                    ['Paciente', r.paciente || '-'],
                    ['Total', ' + (r.total || r.costo || 0).toFixed(2) + ']
                ]
            };
        } else if (r.especialidad) {
            data = {
                tipo: 'Especialidad',
                campos: [
                    ['Especialidad', r.especialidad],
                    ['Médico', r.responsable || '-'],
                    ['Horario', r.horario || '-']
                ]
            };
        } else if (r.medico && r.fecha) {
            data = {
                tipo: 'Cita Médica',
                campos: [
                    ['Paciente', r.paciente || '-'],
                    ['Médico', r.medico],
                    ['Fecha', new Date(r.fecha).toLocaleString()]
                ]
            };
        } else if (r.nombres) {
            data = {
                tipo: 'Paciente',
                campos: [
                    ['Nombre', r.nombres],
                    ['Cédula', r.cedula || '-'],
                    ['Edad', r.edad ? r.edad + ' años' : '-']
                ]
            };
        } else {
            data = {
                tipo: 'Registro',
                campos: Object.entries(r)
                    .filter(([k, v]) => v && !k.toLowerCase().includes('id'))
                    .slice(0, 3)
            };
        }
        // Determinar tipo para botón PDF
        let tipoKey = 'registros';
        if (r.numeroFactura || r.numeroFactura === 0) tipoKey = 'facturas';
        else if (r.especialidad) tipoKey = 'especialidades';
        else if (r.medico && r.fecha) tipoKey = 'citas';
        else if (r.nombres) tipoKey = 'pacientes';

        html += `
            <div class="dato-card" data-id="${r.id || ''}">
                <div class="dato-info">
                    <h4>${data.tipo}</h4>
                    <div class="dato-campos">
                        ${data.campos.map(([label, value]) => 
                            `<p><strong>${label}:</strong> ${value}</p>`
                        ).join('')}
                    </div>
                </div>
                <div class="dato-acciones">
                    ${tipoKey !== 'registros' ? `<button onclick="generarPDF('${tipoKey}', '${r.id || ''}')" class="btn-pdf">PDF</button>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    lista.innerHTML = html;
    container.appendChild(lista);
}

// Funciones de modal
// En esta parte podemos editar el registros de cada pagina donde se guarden registros
function openModal({ title = 'Editar', body = '', saveText = 'Guardar', cancelText = 'Cancelar', onSave = null, onCancel = null } = {}) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-header">
            <div class="modal-title">${title}</div>
            <button type="button" aria-label="Cerrar" class="btn" id="modal-close">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">${cancelText}</button>
            <button type="button" class="btn btn-primary" id="modal-save">${saveText}</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.querySelector('#modal-close').addEventListener('click', () => { closeModal(); if (onCancel) onCancel(); });
    overlay.querySelector('#modal-cancel').addEventListener('click', () => { closeModal(); if (onCancel) onCancel(); });
    overlay.querySelector('#modal-save').addEventListener('click', () => {
        if (onSave) onSave(overlay);
    });

    return overlay;
}

function closeModal() {
    const prev = document.querySelector('.modal-overlay');
    if (prev) prev.remove();
}

// Funciones de edición y eliminación
function editRegistro(tipo, id) {
    let registro;
    if (tipo === 'pacientes') registro = baseDatos.pacientes.find(r => String(r.id) === String(id));
    else if (tipo === 'medicos') registro = baseDatos.medicos.find(r => String(r.id) === String(id));
    else if (tipo === 'citas') registro = baseDatos.citas.find(r => String(r.id) === String(id));
    else if (tipo === 'especialidades') registro = baseDatos.especialidades.find(r => String(r.id) === String(id));
    else if (tipo === 'facturas') registro = baseDatos.facturas.find(r => String(r.id) === String(id));
    
    if (!registro) {
        mostrarMensaje('Registro no encontrado', 'error');
        return;
    }

    let body = '';
    if (tipo === 'pacientes') {
        body = `
            <div class="campo"><label>Nombres</label><input type="text" id="modal-nombres" value="${escapeHtml(registro.nombres || '')}"></div>
            <div class="campo"><label>Cédula</label><input type="text" id="modal-cedula" value="${escapeHtml(registro.cedula || '')}" readonly></div>
            <div class="campo"><label>Correo</label><input type="email" id="modal-email" value="${escapeHtml(registro.email || '')}"></div>
        `;
    } else if (tipo === 'medicos') {
        body = `
            <div class="campo"><label>Nombre</label><input type="text" id="modal-nombre" value="${escapeHtml(registro.nombre || '')}"></div>
            <div class="campo"><label>Especialidad</label><input type="text" id="modal-especialidad" value="${escapeHtml(registro.especialidad || '')}"></div>
            <div class="campo"><label>Correo</label><input type="email" id="modal-correo" value="${escapeHtml(registro.correo || '')}"></div>
        `;
    } else if (tipo === 'citas') {
        // Formulario amigable para editar una cita (mostrar NOMBRE del paciente en lugar de la cédula)
        const fechaVal = registro.fecha ? registro.fecha : '';
        const pacienteNombre = registro.paciente || (baseDatos.pacientes.find(p => String(p.cedula) === String(registro.cedula))?.nombres) || '';
        // ocultamos la cédula en un campo hidden para mantenerla disponible si existe
        body = `
            <div class="campo"><label>Paciente</label><input type="text" id="modal-paciente" value="${escapeHtml(pacienteNombre)}" placeholder="Nombre del paciente"></div>
            <input type="hidden" id="modal-cedula-cita" value="${escapeHtml(registro.cedula || '')}">
            <div class="campo"><label>Médico</label><input type="text" id="modal-medico" value="${escapeHtml(registro.medico || '')}"></div>
            <div class="campo"><label>Fecha y hora</label><input type="datetime-local" id="modal-fecha" value="${fechaVal}"></div>
            <div class="campo"><label>Consultorio</label><input type="text" id="modal-consultorio" value="${escapeHtml(registro.consultorio || '')}"></div>
            <div class="campo"><label>Estado</label>
                <select id="modal-estado">
                    <option value="Pendiente" ${registro.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Confirmada" ${registro.estado === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                    <option value="Atendida" ${registro.estado === 'Atendida' ? 'selected' : ''}>Atendida</option>
                    <option value="Cancelada" ${registro.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                </select>
            </div>
            <div class="campo"><label>Observaciones</label><textarea id="modal-observaciones">${escapeHtml(registro.observaciones || '')}</textarea></div>
        `;
    } else {
        body = `<div class="campo"><label>Datos</label><textarea id="modal-json" style="min-height:120px">${escapeHtml(JSON.stringify(registro, null, 2))}</textarea></div>`;
    }
    // Abrimos el modal con validaciones
    openModal({ 
        title: `Editar ${tipo.slice(0, -1)}`, 
        body, 
        saveText: 'Guardar', 
        cancelText: 'Cancelar', 
        onSave: (overlay) => {
            try {
                if (tipo === 'pacientes') {
                    const nombres = overlay.querySelector('#modal-nombres').value.trim();
                    const email = overlay.querySelector('#modal-email').value.trim();
                    if (!nombres) {
                        mostrarMensaje('El nombre no puede quedar vacío', 'error');
                        return;
                    }
                    if (email && !validarEmail(email)) {
                        mostrarMensaje('Correo inválido', 'error');
                        return;
                    }
                    if (email && emailYaExiste(email) && registro.email?.toLowerCase() !== email.toLowerCase()) {
                        mostrarMensaje('Correo en uso por otro paciente', 'error');
                        return;
                    }
                    registro.nombres = nombres;
                    registro.email = email || '';
                    registro.fechaModificacion = new Date().toLocaleString();
                } else if (tipo === 'medicos') {
                    const nombre = overlay.querySelector('#modal-nombre').value.trim();
                    const especialidad = overlay.querySelector('#modal-especialidad').value.trim();
                    const correo = overlay.querySelector('#modal-correo').value.trim();
                    if (!nombre) {
                        mostrarMensaje('El nombre no puede quedar vacío', 'error');
                        return;
                    }
                    if (correo && !validarEmail(correo)) {
                        mostrarMensaje('Correo inválido', 'error');
                        return;
                    }
                    registro.nombre = nombre;
                    registro.especialidad = especialidad;
                    registro.correo = correo || '';
                    registro.fechaModificacion = new Date().toLocaleString();
                } else if (tipo === 'citas') {
                    const paciente = overlay.querySelector('#modal-paciente')?.value.trim() || '';
                    const cedula = overlay.querySelector('#modal-cedula-cita')?.value.trim() || '';
                    const medico = overlay.querySelector('#modal-medico')?.value.trim() || '';
                    const fecha = overlay.querySelector('#modal-fecha')?.value || '';
                    const consultorio = overlay.querySelector('#modal-consultorio')?.value.trim() || '';
                    const estado = overlay.querySelector('#modal-estado')?.value || '';
                    const observaciones = overlay.querySelector('#modal-observaciones')?.value.trim() || '';

                    if (!paciente) { mostrarMensaje('El nombre del paciente no puede quedar vacío', 'error'); return; }
                    if (!cedula) { mostrarMensaje('La cédula del paciente es requerida', 'error'); return; }
                    if (!validarCedulaEcuatoriana(cedula)) { return; }
                    if (!medico) { mostrarMensaje('Debe especificar el médico', 'error'); return; }
                    if (!fecha) { mostrarMensaje('Debe indicar fecha y hora de la cita', 'error'); return; }
                    const fechaSel = new Date(fecha);
                    if (isNaN(fechaSel.getTime())) { mostrarMensaje('Fecha inválida', 'error'); return; }
                    const ahora = new Date();
                    if (fechaSel < ahora) { mostrarMensaje('La fecha de la cita no puede ser pasada', 'error'); return; }
                    if (!consultorio) { mostrarMensaje('El consultorio no puede quedar vacío', 'error'); return; }

                    registro.paciente = paciente;
                    registro.cedula = cedula;
                    registro.medico = medico;
                    registro.fecha = fecha;
                    registro.consultorio = consultorio;
                    registro.estado = estado;
                    registro.observaciones = observaciones;
                    registro.fechaModificacion = new Date().toLocaleString();
                } else {
                    const txt = overlay.querySelector('#modal-json')?.value || '';
                    const parsed = JSON.parse(txt);
                    Object.assign(registro, parsed);
                    registro.fechaModificacion = new Date().toLocaleString();
                }
                
                guardarDatos();
                mostrarMensaje('Registro actualizado', 'exito');
                closeModal();
                
                if (document.getElementById('formPacientes')) renderListaPacientes();
                if (document.getElementById('formCitas')) renderListaCitas();
                cargarOpcionesPacientes();
                cargarOpcionesMedicos();
                actualizarTodoTrasCarga();
            } catch (e) {
                console.error(e);
                mostrarMensaje('Error al guardar los cambios', 'error');
            }
        } 
    });
}
// Elimina el registro
function deleteRegistro(tipo, id) {
    let registro;
    if (tipo === 'pacientes') registro = baseDatos.pacientes.find(r => String(r.id) === String(id));
    else if (tipo === 'medicos') registro = baseDatos.medicos.find(r => String(r.id) === String(id));
    else if (tipo === 'citas') registro = baseDatos.citas.find(r => String(r.id) === String(id));
    else if (tipo === 'especialidades') registro = baseDatos.especialidades.find(r => String(r.id) === String(id));
    else if (tipo === 'facturas') registro = baseDatos.facturas.find(r => String(r.id) === String(id));
    
    if (!registro) {
        mostrarMensaje('Registro no encontrado', 'error');
        return;
    }

    const tipoSingular = tipo.slice(0, -1); // Elimina la 's' final para obtener el singular
    const body = `<p>¿Está seguro que desea eliminar este ${tipoSingular}?</p>`;
    
    openModal({ 
        title: 'Confirmar eliminación', 
        body, 
        saveText: 'Eliminar', 
        cancelText: 'Cancelar', 
        onSave: () => {
            try {
                if (tipo === 'pacientes') baseDatos.pacientes = baseDatos.pacientes.filter(p => String(p.id) !== String(id));
                else if (tipo === 'medicos') baseDatos.medicos = baseDatos.medicos.filter(m => String(m.id) !== String(id));
                else if (tipo === 'citas') baseDatos.citas = baseDatos.citas.filter(c => String(c.id) !== String(id));
                else if (tipo === 'especialidades') baseDatos.especialidades = baseDatos.especialidades.filter(e => String(e.id) !== String(id));
                else if (tipo === 'facturas') baseDatos.facturas = baseDatos.facturas.filter(f => String(f.id) !== String(id));
                
                guardarDatos();
                mostrarMensaje('Registro eliminado', 'info');
                closeModal();
                
                if (document.getElementById('formPacientes')) renderListaPacientes();
                if (document.getElementById('formCitas')) renderListaCitas();
                if (document.getElementById('formFacturacion')) renderListaFacturas();
                cargarOpcionesPacientes();
                cargarOpcionesMedicos();
                actualizarTodoTrasCarga();
            } catch (e) {
                console.error(e);
                mostrarMensaje('Error al eliminar registro', 'error');
            }
        }, 
        onCancel: () => { closeModal(); } 
    });
}

// Función para confirmar cierre de sesión
function confirmarCerrarSesion(event, href) {
    if (event) event.preventDefault();

    const confirmado = window.confirm('¿Estás seguro que deseas cerrar sesión?');
    if (confirmado) {
        if (window.sesionActiva) window.sesionActiva = null;
        try {
            localStorage.removeItem('rolActivo');
            localStorage.removeItem('usuarioActivo');
            localStorage.removeItem('sesionUsuario');
        } catch (e) {
            console.warn('Error al limpiar localStorage');
        }

        window.location.href = href || 'Inicio.html';
    }

    return false;
}

// Funciones de exportación de reportes PDF
function exportReportCSV() {
    if (!lastReportResults || lastReportResults.length === 0) {
        mostrarMensaje('No hay resultados para exportar', 'error');
        return;
    }
    
    const keys = new Set();
    lastReportResults.forEach(r => Object.keys(r || {}).forEach(k => keys.add(k)));
    const cols = Array.from(keys);
    const rows = [cols.join(',')];
    
    lastReportResults.forEach(r => {
        const vals = cols.map(c => `"${(r && r[c]) ? String(r[c]).replace(/"/g, '""') : ''}"`);
        rows.push(vals.join(','));
    });
    
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${lastReportType || 'datos'}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
// Exportar reporte
function exportReportPDF() {
    if (!lastReportResults || lastReportResults.length === 0) {
        mostrarMensaje('No hay resultados para exportar', 'error');
        return;
    }
    
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
        mostrarMensaje('jsPDF no está cargado. Incluya la librería jsPDF para exportar a PDF.', 'error');
        return;
    }
    
    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Reporte: ${lastReportType || 'datos'} - ${lastReportResults.length} registros`, 10, 10);
    
    const cols = new Set();
    lastReportResults.forEach(r => Object.keys(r || {}).forEach(k => cols.add(k)));
    const head = [Array.from(cols)];
    const body = lastReportResults.map(r => Array.from(cols).map(c => r && r[c] ? String(r[c]) : '-'));
    const primaryColor = [193, 14, 26];
    
    if (doc.autoTable) {
        doc.autoTable({
            head,
            body,
            startY: 20,
            styles: { fontSize: 10, cellPadding: 4, textColor: [0, 0, 0] },
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            tableLineColor: primaryColor,
            tableLineWidth: 0.3
        });
    } else {
        let y = 20;
        body.forEach(row => {
            doc.text(row.join(' | '), 10, y);
            y += 7;
            if (y > 280) { doc.addPage(); y = 20; }
        });
    }
    
    doc.save(`reporte_${lastReportType || 'datos'}_${Date.now()}.pdf`);
}
// Imprimir reporte
function printReport() {
    const area = document.getElementById('lista-reportes');
    if (!area) {
        mostrarMensaje('No hay área de resultados para imprimir', 'error');
        return;
    }
    
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>Imprimir reporte</title>');
    
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
    styles.forEach(href => w.document.write(`<link rel="stylesheet" href="${href}" />`));
    
    w.document.write('</head><body>');
    w.document.write(area.outerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
}

// Funciones de PDF
async function generarPDF(tipo, id) {
    try {
        if (!window.jspdf) {
            throw new Error('La librería jsPDF no está cargada');
        }

        const datos = obtenerDatosParaPDF(tipo, id);
        if (!datos) {
            throw new Error('No se encontraron datos para generar el PDF');
        }

        const doc = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: PDF_CONFIG.pageSize
        });

        await generarContenidoPDF(doc, tipo, datos);

        const nombreArchivo = `${tipo}_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);

        mostrarMensaje('PDF generado exitosamente', 'exito');
        return true;
    } catch (error) {
        console.error('Error generando PDF:', error);
        mostrarMensaje(error.message || 'Error al generar el PDF', 'error');
        return false;
    }
}
// Contenido del PDF
async function generarContenidoPDF(doc, tipo, datos) {
    doc.setDrawColor(...PDF_CONFIG.colors.primary);
    doc.setTextColor(...PDF_CONFIG.colors.primary);

    await agregarEncabezadoInstitucional(doc);

    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    doc.setFontSize(PDF_CONFIG.fonts.header.size);
    doc.setFont('helvetica', 'bold');
    doc.text(`Reporte de ${capitalizarPalabra(tipo)}`, 105, 55, { align: 'center' });

    doc.setFontSize(PDF_CONFIG.fonts.small.size);
    doc.setTextColor(...PDF_CONFIG.colors.secondary);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 20, 65);
    doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 20, 70);
    
    doc.setTextColor(0, 0, 0);
    let yPos = 80;
    // Tipo de contenido generado
    switch(tipo) {
        case 'pacientes':
            yPos = await generarContenidoPaciente(doc, datos, yPos);
            break;
        case 'medicos':
            yPos = await generarContenidoMedico(doc, datos, yPos);
            break;
        case 'citas':
            yPos = await generarContenidoCita(doc, datos, yPos);
            break;
        case 'facturas':
            yPos = await generarContenidoFactura(doc, datos, yPos);
            break;
    }

    agregarPiePagina(doc);
}
// Encabezado
async function agregarEncabezadoInstitucional(doc) {
    try {
        doc.addImage('LOGO-ULEAM-VERTICAL.png', 'PNG', 20, 15, 20, 20);
    } catch (e) {
        console.warn('No se pudo cargar el logo');
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Universidad Laica Eloy Alfaro de Manabí', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Médica', 105, 30, { align: 'center' });
}
// Contenido Paciente
async function generarContenidoPaciente(doc, datos, yPos) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Información Personal', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const infoPersonal = [
        ['Nombres y Apellidos:', datos.nombres],
        ['Cédula de Identidad:', datos.cedula],
        ['Edad:', `${datos.edad} años`],
        ['Sexo:', datos.sexo],
        ['Estado Civil:', datos.estadoCivil],
        ['Tipo de Sangre:', datos.tipoSangre],
        ['Correo Electrónico:', datos.email || 'No registrado']
    ];

    infoPersonal.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 80, yPos);
        yPos += 8;
    });

    if (datos.historialMedico) {
        yPos += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Historial Médico', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const historialWrapped = doc.splitTextToSize(datos.historialMedico, 150);
        doc.text(historialWrapped, 25, yPos);
        yPos += historialWrapped.length * 7;
    }

    return yPos;
}
// Contenido Médico
async function generarContenidoMedico(doc, datos, yPos) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Información Profesional', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const infoProfesional = [
        ['Nombre:', datos.nombre],
        ['Especialidad:', datos.especialidad],
        ['Teléfono:', datos.telefono || 'No registrado'],
        ['Correo:', datos.correo || 'No registrado'],
        ['Horario:', (typeof formatHorarioRecurrente === 'function') ? formatHorarioRecurrente(datos.horario) : (datos.horario || 'No especificado')]
    ];

    infoProfesional.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 25, yPos);
        doc.setFont('helvetica', 'normal');
        const textValue = value !== undefined && value !== null ? String(value) : '';
        const wrapped = doc.splitTextToSize(textValue, 100);
        doc.text(wrapped, 80, yPos);
        yPos += (wrapped.length * 7) || 8;
    });

    return yPos;
}
// Contenido Cita
async function generarContenidoCita(doc, datos, yPos) {
    const paciente = baseDatos.pacientes.find(p => p.cedula === datos.cedula);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalles de la Cita', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const infoCita = [
        ['Fecha:', new Date(datos.fecha).toLocaleString()],
        ['Paciente:', paciente ? paciente.nombres : 'No encontrado'],
        ['Cédula:', datos.cedula],
        ['Médico:', datos.medico],
        ['Estado:', datos.estado],
        ['Consultorio:', datos.consultorio]
    ];

    infoCita.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 80, yPos);
        yPos += 8;
    });

    if (datos.observaciones) {
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', 25, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        const observacionesWrapped = doc.splitTextToSize(datos.observaciones, 150);
        doc.text(observacionesWrapped, 25, yPos);
        yPos += observacionesWrapped.length * 7;
    }

    return yPos;
}
// Contenido Factura
async function generarContenidoFactura(doc, datos, yPos) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Factura', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const numero = datos.numero || datos.numeroFactura || datos.id || '';
    const fechaStr = datos.fecha || datos.fechaRegistro || '';
    const fechaFormateada = fechaStr ? new Date(fechaStr).toLocaleDateString() : '';
    const cliente = datos.cliente || datos.paciente || datos.nombre || '';
    const rucCi = datos.ruc || datos.cedula || '';

    const infoFactura = [
        ['Número:', numero || 'No especificado'],
        ['Fecha:', fechaFormateada || 'No especificado'],
        ['Cliente:', cliente || 'No especificado'],
        ['RUC/CI:', rucCi || 'No especificado']
    ];

    infoFactura.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 80, yPos);
        yPos += 8;
    });

    let itemsList = [];
    if (Array.isArray(datos.items) && datos.items.length > 0) {
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Detalle de Servicios', 20, yPos);
        yPos += 5;

        const headers = [['Descripción', 'Valor']];
        itemsList = datos.items.map(item => {
            const desc = item.descripcion || item.servicio || item.detalle || 'Servicio';
            const valorNum = (typeof item.valor !== 'undefined') ? Number(item.valor) : (typeof item.costo !== 'undefined' ? Number(item.costo) : 0);
            return [desc, `${valorNum.toFixed(2)}`];
        });

        doc.autoTable({
            startY: yPos,
            head: headers,
            body: itemsList,
            theme: 'grid',
            headStyles: { 
                fillColor: PDF_CONFIG.colors.primary,
                textColor: [255, 255, 255],
                fontSize: PDF_CONFIG.fonts.body.size,
                fontStyle: PDF_CONFIG.fonts.header.style
            },
            bodyStyles: {
                fontSize: PDF_CONFIG.fonts.body.size,
                textColor: [0, 0, 0],
                cellPadding: 4
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: PDF_CONFIG.margin
        });

        yPos = doc.lastAutoTable.finalY + 10;
    }

    if ((!itemsList || itemsList.length === 0) && (datos.servicio || datos.costo)) {
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Detalle de Servicios', 20, yPos);
        yPos += 5;

        const headers = [['Descripción', 'Valor']];
        const single = [[datos.servicio || 'Servicio', `${(Number(datos.costo) || 0).toFixed(2)}`]];

        doc.autoTable({
            startY: yPos,
            head: headers,
            body: single,
            theme: 'grid',
            headStyles: { 
                fillColor: PDF_CONFIG.colors.primary,
                textColor: [255, 255, 255]
            },
            bodyStyles: { fontSize: PDF_CONFIG.fonts.body.size },
            margin: PDF_CONFIG.margin
        });

        yPos = doc.lastAutoTable.finalY + 10;
    }

    const total = (typeof datos.total !== 'undefined') ? Number(datos.total) : (typeof datos.costo !== 'undefined' ? Number(datos.costo) : null);
    doc.setFont('helvetica', 'bold');
    if (total !== null && !isNaN(total)) {
        doc.text(`Total: ${total.toFixed(2)}`, 150, yPos, { align: 'right' });
    } else {
        if (itemsList && itemsList.length > 0) {
            const suma = itemsList.reduce((acc, row) => acc + (Number(row[1].replace(/[^0-9.-]+/g, '')) || 0), 0);
            doc.text(`Total: ${suma.toFixed(2)}`, 150, yPos, { align: 'right' });
        }
    }

    return yPos;
}
// Pie de página
function agregarPiePagina(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...PDF_CONFIG.colors.secondary);

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setLineWidth(0.2);
        doc.line(20, 280, 190, 280);

        doc.text('Universidad Laica Eloy Alfaro de Manabí - Sistema de Gestión Médica', 105, 285, { align: 'center' });
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }
}
// Nombre del PDF
function generarNombreArchivo(tipo, id, datos) {
    const fecha = new Date().toISOString().split('T')[0];
    const identificador = datos.cedula || datos.numero || datos.numeroFactura || id;
    return `${tipo}_${identificador}_${fecha}.pdf`;
}
// Datos del PDF, busca un registro específico por tipo e ID
function obtenerDatosParaPDF(tipo, id) {
    switch(tipo) {
        case 'pacientes':
            return baseDatos.pacientes.find(p => String(p.id) === String(id));
        case 'medicos':
            return baseDatos.medicos.find(m => String(m.id) === String(id));
        case 'citas':
            return baseDatos.citas.find(c => String(c.id) === String(id));
        case 'facturas':
            return baseDatos.facturas.find(f => String(f.id) === String(id));
        default:
            return null;
    }
}

// Función para actualizar todo tras la carga
function actualizarTodoTrasCarga() {
    if (document.getElementById('formPacientes')) renderListaPacientes();
    if (document.getElementById('formCitas')) renderListaCitas();
    if (document.getElementById('formEspecialidad')) renderListaEspecialidades();
    if (document.getElementById('formFacturacion')) renderListaFacturas();
    
    cargarOpcionesPacientes();
    cargarOpcionesMedicos();
    
    const pacienteSelect = document.getElementById('paciente');
    if (pacienteSelect) {
        pacienteSelect.addEventListener('change', function() {
            const selectedId = this.value;
            const paciente = baseDatos.pacientes.find(p => String(p.id) === String(selectedId));
            const cedulaInput = document.getElementById('cedula');
            if (paciente && cedulaInput) cedulaInput.value = paciente.cedula || '';
            if (!this.value && cedulaInput) cedulaInput.value = '';
        });
    }
    // Estado del formulario
    const bindForm = (id, handler) => {
        const f = document.getElementById(id);
        if (!f) return; // No existe
        if (f.__validaciones_attached) return; // Ya configurado
        f.addEventListener('submit', function(e) {
            e.preventDefault(); // Evita recarga
            try {
                if (handler.length === 1) handler(e); else handler();
                if (typeof renderListaPacientes === 'function') renderListaPacientes();
                if (typeof renderListaMedicos === 'function') renderListaMedicos();
                if (typeof renderListaCitas === 'function') renderListaCitas();
                cargarOpcionesPacientes();
                cargarOpcionesMedicos();
            } catch (err) {
                console.error(`Error manejando submit de ${id}:`, err);
            }
        });
        // Marca como configurado
        f.__validaciones_attached = true;
    };
    // Vincula formularios con respectiva validación
    bindForm('formPacientes', validarPacientes);
    bindForm('formMedicos', validarMedicos);
    bindForm('formEspecialidad', validarEspecialidad);
    bindForm('formFacturacion', validarFacturacion);
    bindForm('formHistorial', validarHistorial);
    bindForm('formReportes', validarReportes);
    bindForm('formLogin', validarLogin);
    // Actualizar contadores
    const contadorPacientes = document.getElementById('total-pacientes');
    const contadorMedicos = document.getElementById('total-medicos');
    const contadorCitas = document.getElementById('total-citas');
    const contadorEspecialidades = document.getElementById('total-especialidades');
    
    if (contadorPacientes) contadorPacientes.textContent = baseDatos.pacientes.length;
    if (contadorMedicos) contadorMedicos.textContent = baseDatos.medicos.length;
    if (contadorCitas) contadorCitas.textContent = baseDatos.citas.length;
    if (contadorEspecialidades) contadorEspecialidades.textContent = baseDatos.especialidades.length;
    // Esta parte revisa si cada tabla está dentro de un contenedor "data-card". Si NO está, lo crea.
    const tablas = document.querySelectorAll('.container table');
    tablas.forEach(tbl => {
        if (!tbl.closest('.data-card')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'data-card';
            tbl.parentNode.insertBefore(wrapper, tbl);
            wrapper.appendChild(tbl);
        }
    });
}

// Cuando la página termine de cargar, ejecuta todo este códig
document.addEventListener('DOMContentLoaded', function() {
    cargarDatos();
    cargarDatosIniciales();
    actualizarTodoTrasCarga();
    
    // Inicializar UI de horario para la página de médicos
    if (document.getElementById('formMedicos')) {
        try { initHorarioRecurrente(); } catch (e) { console.warn('No se pudo inicializar horario recurrente', e); }
    }
    // Nota: el botón de retorno ahora se inserta directamente en los HTML para evitar duplicados.
    // Esta parte nos muestra un saludo personalizado en la pag principal de acuerdo con el rol con el que ingreses al sistema y la hora del dia
    if (window.location.pathname.includes('PagPrincipal')) {
        const mainTitle = document.querySelector('.content h1');
        if (mainTitle) {
            const hora = new Date().getHours();
            let saludo = '';

            if (hora >= 5 && hora < 12) saludo = '¡Buenos días! ☀️';
            else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
            else saludo = '¡Buenas noches! 🌙';

            const sesion = window.sesionActiva || {};
            const rolRaw = sesion.rol || localStorage.getItem('rolActivo') || '';
            const rolCapitalizado = rolRaw ? (rolRaw.charAt(0).toUpperCase() + rolRaw.slice(1).toLowerCase()) : '';

            if (rolCapitalizado) {
                mainTitle.innerHTML = `${saludo} <span style="color: #c10e1a;">${rolCapitalizado}</span>`;
            } else {
                mainTitle.textContent = saludo;
            }
        }
    }
    
    const savedId = localStorage.getItem('lastSavedFacturaId');
    if (savedId) {
        window.lastSavedFacturaId = savedId;
    }

    const bPdf = document.getElementById('btnExportPDF');
    const bCsv = document.getElementById('btnExportExcel');
    const bPrint = document.getElementById('btnPrint');
    if (bPdf) bPdf.addEventListener('click', exportReportPDF);
    if (bCsv) bCsv.addEventListener('click', exportReportCSV);
    if (bPrint) bPrint.addEventListener('click', printReport);
    
    const cedulaInputs = document.querySelectorAll('input[id*="cedula"], input[name*="cedula"]');
    cedulaInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
        
        input.addEventListener('blur', function() {
            if (this.value.trim() && this.value.length === 10) {
                this.style.borderColor = validarCedulaEcuatoriana(this.value) ? '#00C851' : '#ff4444';
            }
        });
    });
    
    const fechaNacInput = document.querySelector('input[type="date"]');
    const edadInput = document.querySelector('input[id="edad"]');
    
    if (fechaNacInput && edadInput) {
        fechaNacInput.addEventListener('change', function() {
            if (this.value) {
                edadInput.value = calcularEdad(this.value);
                edadInput.readOnly = true;
                edadInput.style.background = '#f0f0f0';
            }
        });
    }
    
    const pesoInput = document.getElementById('peso');
    const estaturaInput = document.getElementById('estatura');
    const imcInput = document.getElementById('imc');
    
    if (pesoInput && estaturaInput && imcInput) {
        const calcular = () => {
            const peso = parseFloat(pesoInput.value);
            const estatura = parseFloat(estaturaInput.value);
            
            if (peso > 0 && peso <= 300 && estatura > 0 && estatura <= 2.5) {
                imcInput.value = calcularIMC(peso, estatura);
                imcInput.readOnly = true;
                imcInput.style.background = '#f0f0f0';
            }
        };
        
        pesoInput.addEventListener('input', calcular);
        estaturaInput.addEventListener('input', calcular);
    }
    
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim()) {
                this.style.borderColor = validarEmail(this.value) ? '#00C851' : '#ff4444';
            }
        });
    });
    
    const telefonoInputs = document.querySelectorAll('input[id*="telefono"], input[name*="telefono"]');
    telefonoInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    });
    
    if (document.getElementById('formPacientes')) {
        renderListaPacientes();
    }
    //
    // Grafico de barras que aparece en la pag principal y muestra los dias de la semana 
    const ctxBar = document.getElementById('barChart');
    if (ctxBar && typeof Chart !== 'undefined') {
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                datasets: [{
                    label: 'Número de Citas',
                    data: [12, 19, 15, 17, 14, 8],
                    backgroundColor: 'rgba(193, 14, 26, 0.8)',
                    borderColor: 'rgba(193, 14, 26, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    // Grafico de torta que aparece en la pantalla principal, muestra las especialidades
    const ctxEspecialidades = document.getElementById('especialidadesChart');
    if (ctxEspecialidades && typeof Chart !== 'undefined') {
        new Chart(ctxEspecialidades, {
            type: 'doughnut',
            data: {
                labels: [
                    'Medicina General', 
                    'Pediatría', 
                    'Ginecología', 
                    'Cardiología', 
                    'Dermatología', 
                    'Odontología', 
                    'Psicología', 
                    'Otras'
                ],
                datasets: [{
                    data: [25, 18, 15, 12, 10, 8, 7, 5],
                    backgroundColor: ['#c10e1a', '#e63946', '#f77f00', '#fcbf49', '#06a77d', '#4cc9f0', '#7209b7', '#999999'],
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
    
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});