import React, { useState, useEffect } from 'react';
import { PacientesView } from '@components/presentational';
import { validarCedula, validarEmail, validarTelefonoEstricto, validarNombre, validarFechaNacimientoPasada, validarNumeroRango, isEmailInUse } from '@services';
import { useForm, useLocalStorage } from '@hooks';
import { exportJSON, exportAllJSON, exportXML, exportAllXML } from '@utils/exporters';

  // fallback localStorage para usar el container como página independiente


function PacientesContainer({ baseDatos, onActualizar, onVolver }) {
  const { values: formData, setValues, handleChange, reset } = useForm({
    nombres: '', cedula: '', fechaNacimiento: '', edad: '', sexo: '', estadoCivil: '',
    tipoSangre: '', nacionalidad: '', lugarNacimiento: '', ocupacion: '', direccion: '', ciudad: '', provincia: '', telefono: '', email: '', peso: '', estatura: '', imc: '', alergias: '', enfermedades: '', tratamientos: '', observaciones: ''
  });

  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [errores, setErrores] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [storedBaseDatos, setStoredBaseDatos] = useLocalStorage('policlinico_datos', { pacientes: [], citas: [], medicos: [], especialidades: [], facturas: [], historias: [] });
  const effectiveBaseDatos = baseDatos || storedBaseDatos;
  const updateStore = (key, value) => {
    if (typeof onActualizar === 'function') {
      try { onActualizar(key, value); return; } catch (e) { try { onActualizar(value); return; } catch(e2) { /* noop */ } }
    }
    setStoredBaseDatos(prev => ({ ...prev, [key]: value }));
  }; 

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setErrores([]);
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const mostrarErrores = (arr) => {
    setErrores(Array.isArray(arr) ? arr : [String(arr)]);
    if (arr && arr.length) {
      setTimeout(() => setErrores([]), 6000);
    }
  };


  const BLOOD_TYPES = ['O+','O-','A+','A-','B+','B-','AB+','AB-',''];

  const handleSubmit = (e) => {
    e.preventDefault();

    // normalizar tipo de sangre a conjunto permitido
    const tipoSangreValida = BLOOD_TYPES.includes(formData.tipoSangre) ? formData.tipoSangre : '';

    // validaciones estrictas
    if (!validarNombre(formData.nombres)) { mostrarErrores(['Nombre inválido o vacío']); mostrarMensaje('Nombre inválido o vacío', 'error'); return; }
    if (!validarCedula(formData.cedula)) { mostrarErrores(['Cédula inválida']); mostrarMensaje('Cédula inválida', 'error'); return; }
    if (formData.email && !validarEmail(formData.email)) { mostrarErrores(['Email inválido']); mostrarMensaje('Email inválido', 'error'); return; }
    if (formData.telefono && !validarTelefonoEstricto(formData.telefono)) { mostrarErrores(['Teléfono inválido (use 09xxxxxxxx)']); mostrarMensaje('Teléfono inválido (use 09xxxxxxxx)', 'error'); return; }
    if (formData.fechaNacimiento && !validarFechaNacimientoPasada(formData.fechaNacimiento)) { mostrarErrores(['Fecha de nacimiento inválida o futurista']); mostrarMensaje('Fecha de nacimiento inválida o futurista', 'error'); return; }

    // edad plausible (si fue calculada por el onChange)
    if (formData.edad !== '' && (isNaN(Number(formData.edad)) || formData.edad < 0 || formData.edad > 130)) {
      mostrarErrores(['Edad inválida']);
      mostrarMensaje('Edad inválida', 'error');
      return;
    }

    // validar peso/estatura si están presentes
    if (formData.peso && !validarNumeroRango(formData.peso, 2, 500)) { mostrarErrores(['Peso fuera de rango plausible (2-500 kg)']); mostrarMensaje('Peso fuera de rango plausible (2-500 kg)', 'error'); return; }
    if (formData.estatura && !validarNumeroRango(formData.estatura, 0.3, 2.5)) { mostrarErrores(['Estatura fuera de rango plausible (0.3-2.5 m)']); mostrarMensaje('Estatura fuera de rango plausible (0.3-2.5 m)', 'error'); return; }

    const cedulaExiste = (effectiveBaseDatos.pacientes || []).some(p => p.cedula === formData.cedula && p.id !== editingId);
    const emailExisteLocal = formData.email ? (effectiveBaseDatos.pacientes || []).some(p => p.email && p.email.toLowerCase() === String(formData.email).toLowerCase() && p.id !== editingId) : false;
    const emailUsadaGlobal = formData.email ? isEmailInUse(formData.email, effectiveBaseDatos, { excludeType: 'paciente', excludeId: editingId }) : false;
    if (cedulaExiste) { mostrarErrores(['Cédula ya registrada']); mostrarMensaje('Cédula ya registrada', 'error'); return; }
    if (emailExisteLocal || emailUsadaGlobal) { mostrarErrores(['Email ya registrado']); mostrarMensaje('Email ya registrado', 'error'); return; }

    if (editingId) {
      // actualizar paciente existente (asegurar tipo de sangre válido)
      const actualizado = effectiveBaseDatos.pacientes.map(p => p.id === editingId ? { ...p, ...formData, tipoSangre: tipoSangreValida } : p);
      updateStore('pacientes', actualizado);
      mostrarMensaje('Paciente actualizado', 'exito');
      setEditingId(null);
      setValues({ nombres: '', cedula: '', fechaNacimiento: '', edad: '', sexo: '', estadoCivil: '', tipoSangre: '', nacionalidad: '', lugarNacimiento: '', ocupacion: '', direccion: '', ciudad: '', provincia: '', telefono: '', email: '', peso: '', estatura: '', imc: '', alergias: '', enfermedades: '', tratamientos: '', observaciones: '' });
      return;
    }

    const nuevoPaciente = { id: Date.now().toString(), ...formData, tipoSangre: tipoSangreValida, fechaRegistro: new Date().toLocaleString() };
    updateStore('pacientes', [...effectiveBaseDatos.pacientes, nuevoPaciente]);
    mostrarMensaje('Paciente registrado exitosamente', 'exito');
    setValues({ nombres: '', cedula: '', fechaNacimiento: '', edad: '', sexo: '', estadoCivil: '', tipoSangre: '', nacionalidad: '', lugarNacimiento: '', ocupacion: '', direccion: '', ciudad: '', provincia: '', telefono: '', email: '', peso: '', estatura: '', imc: '', alergias: '', enfermedades: '', tratamientos: '', observaciones: '' });
  };

  const eliminarPaciente = (id) => {
    if (window.confirm('¿Está seguro que desea eliminar este paciente?')) {
      updateStore('pacientes', effectiveBaseDatos.pacientes.filter(p => p.id !== id));
      mostrarMensaje('Paciente eliminado', 'info');
    }
  };

  // helpers de descarga centralizados en `@utils/exporters`
  const exportPacienteJSON = (p) => exportJSON(p, `${p.nombres.replace(/\s+/g, '_')}.json`);
  const exportAllPacientesJSON = () => exportAllJSON(effectiveBaseDatos.pacientes || [], `pacientes.json`);
  const exportPacienteXML = (p) => exportXML(p, 'paciente', `${p.nombres.replace(/\s+/g, '_')}.xml`);

  const exportAllPacientesXML = () => exportAllXML(effectiveBaseDatos.pacientes || [], 'paciente', 'pacientes.xml');

  const ensureJsPDF = () => new Promise((resolve) => {
    const existing = window.jspdf || window.jspdf?.jsPDF || window.jspdf?.default;
    if (existing) {
      // prefer jsPDF constructor
      const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jspdf || window.jsPDF || null;
      resolve(jsPDF);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      // UMD exposes window.jspdf with jsPDF property
      const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null;
      resolve(jsPDF);
    };
    document.body.appendChild(script);
  });

  // helper: convertir URL de imagen a dataURL (base64)
  const getDataUrlFromUrl = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      return null;
    }
  };

  const exportPacientePDF = async (p) => {
    const jsPDF = await ensureJsPDF();
    if (!jsPDF) { mostrarMensaje('No se pudo generar PDF (jsPDF no disponible)', 'error'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // colores del proyecto
    const primario = [193, 14, 26]; // #c10e1a
    const primarioClaro = [230, 57, 70]; // #e63946
    const cajaBg = [245, 245, 245];

    // intentar cargar logo (si está disponible en assets)
    let logoData = null;
    try {
      const logoUrl = require('../../assets/logo-uleam.png');
      logoData = await getDataUrlFromUrl(logoUrl);
    } catch (e) { logoData = null; }

    // Encabezado (mayor altura para separar logo)
    const headerH = 82;
    doc.setFillColor(...primario);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    // título centrado
    doc.text(`Ficha del paciente`, doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // dibujar caja blanca detrás del logo para mayor contraste y luego el logo (ahora a la izquierda)
    if (logoData) {
      const logoBoxW = 72;
      const logoBoxH = 48;
      const logoX = 40; // izquierda
      const logoY = 12;
      // caja blanca con borde primario
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD');
      } else {
        doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD');
      }
      // agregar imagen centrada
      try {
        const imgW = 56, imgH = 40;
        doc.addImage(logoData, 'PNG', logoX + (logoBoxW - imgW) / 2, logoY + (logoBoxH - imgH) / 2, imgW, imgH);
      } catch (err) {/* ignore image errors */}
    }

    // Fecha a la derecha
    doc.setTextColor(255,255,255);
    doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });

    let y = headerH + 18;

    // Tarjeta del paciente (más altura y padding)
    const left = 40;
    const width = doc.internal.pageSize.getWidth() - left * 2;
    const cardH = 160;
    doc.setFillColor(...cajaBg);
    doc.setDrawColor(...primario);
    if (typeof doc.roundedRect === 'function') {
      doc.roundedRect(left, y, width, cardH, 6, 6, 'FD');
    } else {
      doc.rect(left, y, width, cardH, 'FD');
    }

    // nombre y datos principales
    doc.setTextColor(...primario);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(p.nombres || '—', left + 16, y + 36);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // organizar en 2 columnas con filas espaciadas
    const col1X = left + 16;
    const col2X = left + Math.floor(width / 2) + 8;
    const labelOffset = 90;
    let rowY = y + 56;
    const rowGap = 22;

    const rowsLeft = [ ['Cédula', p.cedula || ''], ['Sexo', p.sexo || ''], ['Email', p.email || ''], ['Dirección', p.direccion || ''] ];
    const rowsRight = [ ['Edad', p.edad || ''], ['Tipo de Sangre', p.tipoSangre || ''], ['Teléfono', p.telefono || ''] ];

    rowsLeft.forEach(([label, val], i) => {
      const ry = rowY + i * rowGap;
      doc.setTextColor(...primario);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${label}:`, col1X, ry);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const valueLines = doc.splitTextToSize(String(val || '—'), Math.floor(width / 2) - labelOffset - 20);
      doc.text(valueLines, col1X + labelOffset, ry);
    });

    rowsRight.forEach(([label, val], i) => {
      const ry = rowY + i * rowGap;
      doc.setTextColor(...primario);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${label}:`, col2X, ry);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const valueLines = doc.splitTextToSize(String(val || '—'), Math.floor(width / 2) - labelOffset - 20);
      doc.text(valueLines, col2X + labelOffset, ry);
    });

    y += cardH + 18;

    // Secciones adicionales (observaciones)
    if (p.observaciones) {
      if (y > doc.internal.pageSize.getHeight() - 120) { doc.addPage(); y = 40; }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primario);
      doc.setFontSize(13);
      doc.text('Observaciones', left, y);
      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const obsLines = doc.splitTextToSize(p.observaciones, width);
      doc.text(obsLines, left, y);
      y += obsLines.length * 14 + 12;
    }

    // Firma o pie
    if (y > doc.internal.pageSize.getHeight() - 100) { doc.addPage(); y = 40; }
    doc.setDrawColor(...primario);
    doc.setLineWidth(0.6);
    doc.line(left, doc.internal.pageSize.getHeight() - 80, doc.internal.pageSize.getWidth() - left, doc.internal.pageSize.getHeight() - 80);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Policlínico Uleam • ' + new Date().getFullYear(), left, doc.internal.pageSize.getHeight() - 60);

    doc.save(`${(p.nombres || 'paciente').replace(/\s+/g, '_')}.pdf`);
  };

  const exportAllPDF = async () => {
    const jsPDF = await ensureJsPDF();
    if (!jsPDF) { mostrarMensaje('No se pudo generar PDF (jsPDF no disponible)', 'error'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const primario = [193, 14, 26];
    const primarioClaro = [230, 57, 70];
    const cajaBg = [250, 250, 250];

    // intentar cargar logo (si está disponible en assets)
    let logoData = null;
    try {
      const logoUrl = require('../../assets/logo-uleam.png');
      logoData = await getDataUrlFromUrl(logoUrl);
    } catch (e) { logoData = null; }

    // Header (ligeramente más alto para logo)
    const headerH = 72;
    doc.setFillColor(...primario);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    // título centrado
    doc.text('Listado de Pacientes', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    // fecha a la derecha
    doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });

    if (logoData) {
      const logoBoxW = 68;
      const logoBoxH = 44;
      const logoX = 40; // izquierda
      const logoY = 14;
      doc.setFillColor(255,255,255);
      doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD');
      } else {
        doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD');
      }
      try { doc.addImage(logoData, 'PNG', logoX + 6, logoY + 6, logoBoxW - 12, logoBoxH - 12); } catch (err) {}
    }

    let y = 90;
    const left = 40;
    const width = doc.internal.pageSize.getWidth() - left * 2;

    (effectiveBaseDatos.pacientes || []).forEach((p, idx) => {
      // nueva página si no hay espacio
      if (y > doc.internal.pageSize.getHeight() - 140) { doc.addPage(); y = 90; }

      // tarjeta más alta para mejor lectura
      const h = 80;
      doc.setFillColor(...cajaBg);
      doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(left, y, width, h, 6, 6, 'FD');
      } else {
        doc.rect(left, y, width, h, 'FD');
      }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primarioClaro);
      doc.setFontSize(12);
      doc.text(`${idx + 1}. ${p.nombres || '—'}`, left + 12, y + 26);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const line1 = `${p.cedula || ''} • ${p.edad ? p.edad + ' años' : ''} • ${p.tipoSangre || ''}`.replace(/\s+•\s+$/,'');
      doc.text(line1, left + 12, y + 46);

      y += h + 12;
    });

    // pie
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Total: ${(effectiveBaseDatos.pacientes || []).length} pacientes`, left, doc.internal.pageSize.getHeight() - 40);

    doc.save('pacientes.pdf');
  };

  const calcularIMC = (peso, estatura) => {
    const p = parseFloat(peso);
    const e = parseFloat(estatura);
    if (!p || !e) return '';
    const imc = p / (e * e);
    return Number.isFinite(imc) ? imc.toFixed(2) : '';
  };

  const onChange = (field, value) => {
    // cédula y teléfono: solo dígitos, máximo 10
    if (field === 'cedula' || field === 'telefono') {
      const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
      setValues(prev => ({ ...prev, [field]: digits }));
      return;
    }

    // si actualiza fechaNacimiento, calcular edad correctamente (considerando mes y día)
    if (field === 'fechaNacimiento') {
      const fecha = new Date(value);
      let edad = '';
      if (fecha && !isNaN(fecha)) {
        const hoy = new Date();
        edad = hoy.getFullYear() - fecha.getFullYear();
        const mes = hoy.getMonth() - fecha.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
          edad--;
        }
        if (edad < 0) edad = '';
      }
      setValues(prev => ({ ...prev, fechaNacimiento: value, edad }));
      return;
    }

    // si actualiza peso o estatura, recalcular IMC
    if (field === 'peso' || field === 'estatura') {
      setValues(prev => {
        const nuevo = { ...prev, [field]: value };
        const imc = calcularIMC(nuevo.peso, nuevo.estatura);
        return { ...nuevo, imc };
      });
      return;
    }

    handleChange(field, value);
  };

  useEffect(() => {
    // Normalizar tipo de sangre en registros existentes al cargar
    const cleaned = (effectiveBaseDatos.pacientes || []).map(p => ({ ...p, tipoSangre: BLOOD_TYPES.includes(p.tipoSangre) ? p.tipoSangre : '' }));
    if (JSON.stringify(cleaned) !== JSON.stringify(effectiveBaseDatos.pacientes)) {
      updateStore('pacientes', cleaned);
    }
  }, []);

  const onReset = () => {
    reset();
    setEditingId(null);
  };

  const onEdit = (paciente) => {
    if (!paciente || !paciente.id) return;
    setEditingId(paciente.id);
    // prefills the form with paciente data (normalizar tipo de sangre)
    const tipo = BLOOD_TYPES.includes(paciente.tipoSangre) ? paciente.tipoSangre : '';
    setValues({
      nombres: paciente.nombres || '',
      cedula: paciente.cedula || '',
      fechaNacimiento: paciente.fechaNacimiento || '',
      edad: paciente.edad || '',
      sexo: paciente.sexo || '',
      estadoCivil: paciente.estadoCivil || '',
      tipoSangre: tipo,
      nacionalidad: paciente.nacionalidad || '',
      lugarNacimiento: paciente.lugarNacimiento || '',
      ocupacion: paciente.ocupacion || '',
      direccion: paciente.direccion || '',
      ciudad: paciente.ciudad || '',
      provincia: paciente.provincia || '',
      telefono: paciente.telefono || '',
      email: paciente.email || '',
      peso: paciente.peso || '',
      estatura: paciente.estatura || '',
      imc: paciente.imc || '',
      alergias: paciente.alergias || '',
      enfermedades: paciente.enfermedades || '',
      tratamientos: paciente.tratamientos || '',
      observaciones: paciente.observaciones || ''
    });

  };

  return (
    <PacientesView
      pacientes={effectiveBaseDatos.pacientes || []}
      formData={formData}
      onChange={onChange}
      onSubmit={handleSubmit}
      onReset={onReset}
      onDelete={eliminarPaciente}
      onEdit={onEdit}
      editingId={editingId}
      onVolver={onVolver}
      mensaje={mensaje}
      errores={errores}
      onExportPacientePDF={exportPacientePDF}
      onExportAllPDF={exportAllPDF}
      onExportPacienteJSON={exportPacienteJSON}
      onExportAllJSON={exportAllJSON}
      onExportPacienteXML={exportPacienteXML}
      onExportAllXML={exportAllPacientesXML}
    />
  );
}

export default PacientesContainer;