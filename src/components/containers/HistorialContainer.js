import React, { useEffect, useState } from 'react';
import HistorialView from '../presentational/HistorialView';
import { validarNumeroRango, fechaNoPasada, validarFechaISO } from '../../services/validators';

function HistorialContainer({ baseDatos, onActualizar, onVolver }) {
  const [pacienteId, setPacienteId] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [historiasPaciente, setHistoriasPaciente] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    pacienteId: '',
    ultimaFechaConsulta: '',
    medico: '',
    especialidad: '',
    motivoConsulta: '',
    antecedentesMedicos: '',
    antecedentesPersonales: '',
    antecedentesFamiliares: '',
    habitos: '',
    peso: '',
    estatura: '',
    presionArterial: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    temperatura: '',
    saturacionOxigeno: '',
    imc: '',
    observacionesFisicas: '',
    diagnosticoPrincipal: '',
    diagnosticoSecundario: '',
    tratamiento: '',
    recomendaciones: '',
    examenesSolicitados: '',
    proximaCita: '',
    observacionesAdicionales: ''
  });

  useEffect(() => {
    const p = baseDatos.pacientes.find(p => p.id === pacienteId) || null;
    setPacienteSeleccionado(p);
    const hs = (baseDatos.historias || []).filter(h => h.pacienteId === pacienteId);
    setHistoriasPaciente(hs);

    // auto-llenar ultima fecha de consulta con la fecha más reciente de citas si existe
    if (p) {
      const citasPaciente = (baseDatos.citas || []).filter(c => c.cedula === p.cedula);
      if (citasPaciente.length > 0) {
        const last = citasPaciente.reduce((a, b) => new Date(a.fecha) > new Date(b.fecha) ? a : b);
        setForm(prev => ({ ...prev, pacienteId: p.id, ultimaFechaConsulta: last.fecha ? new Date(last.fecha).toISOString().slice(0, 10) : '' }));
      } else {
        setForm(prev => ({ ...prev, pacienteId: p.id, ultimaFechaConsulta: '' }));
      }
    } else {
      setForm(prev => ({ ...prev, pacienteId: '', ultimaFechaConsulta: '' }));
    }
  }, [pacienteId, baseDatos]);

  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [errores, setErrores] = useState([]);
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setErrores([]);
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };
  const mostrarErrores = (arr) => { setErrores(Array.isArray(arr) ? arr : [String(arr)]); if (arr && arr.length) setTimeout(() => setErrores([]), 6000); };

  const seleccionarPaciente = (id) => {
    setPacienteId(id);
  };

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    // IMC en tiempo real cuando cambian peso/estatura
    if (field === 'peso' || field === 'estatura') {
      next.imc = calcularIMC(next.peso, next.estatura);
    }
    setForm(next);
  };

  const calcularIMC = (peso, estatura) => {
    const p = Number(String(peso).replace(',', '.'));
    const e = Number(String(estatura).replace(',', '.'));
    if (!p || !e) return '';
    const imc = p / (e * e);
    return Math.round(imc * 10) / 10;
  };

  const guardarHistoria = () => {
    // validaciones estrictas
    if (!form.pacienteId) { mostrarErrores(['Seleccione un paciente antes de guardar']); mostrarMensaje('Seleccione un paciente antes de guardar', 'error'); return; }
    if (form.peso && !validarNumeroRango(form.peso, 2, 500)) { mostrarErrores(['Peso fuera de rango plausible (2-500 kg)']); mostrarMensaje('Peso fuera de rango plausible (2-500 kg)', 'error'); return; }
    if (form.estatura && !validarNumeroRango(form.estatura, 0.3, 2.5)) { mostrarErrores(['Estatura fuera de rango plausible (0.3-2.5 m)']); mostrarMensaje('Estatura fuera de rango plausible (0.3-2.5 m)', 'error'); return; }
    if (form.temperatura && !validarNumeroRango(form.temperatura, 30, 45)) { mostrarErrores(['Temperatura fuera de rango plausible (30-45°C)']); mostrarMensaje('Temperatura fuera de rango plausible (30-45°C)', 'error'); return; }
    if (form.saturacionOxigeno && !validarNumeroRango(form.saturacionOxigeno, 0, 100)) { mostrarErrores(['Saturación debe estar entre 0 y 100%']); mostrarMensaje('Saturación debe estar entre 0 y 100%', 'error'); return; }
    if (form.frecuenciaCardiaca && !validarNumeroRango(form.frecuenciaCardiaca, 10, 250)) { mostrarErrores(['Frecuencia cardíaca fuera de rango plausible']); mostrarMensaje('Frecuencia cardíaca fuera de rango plausible', 'error'); return; }
    if (form.frecuenciaRespiratoria && !validarNumeroRango(form.frecuenciaRespiratoria, 5, 60)) { mostrarErrores(['Frecuencia respiratoria fuera de rango plausible']); mostrarMensaje('Frecuencia respiratoria fuera de rango plausible', 'error'); return; }
    if (form.proximaCita && (!validarFechaISO(form.proximaCita) || !fechaNoPasada(form.proximaCita))) { mostrarErrores(['Próxima cita inválida o en el pasado']); mostrarMensaje('Próxima cita inválida o en el pasado', 'error'); return; }

    const paciente = baseDatos.pacientes.find(p => p.id === form.pacienteId);
    const nueva = {
      id: Date.now().toString(36),
      pacienteId: form.pacienteId,
      pacienteNombres: paciente ? paciente.nombres : '',
      fechaRegistro: new Date().toISOString(),
      ultimaFechaConsulta: form.ultimaFechaConsulta,
      medico: form.medico,
      especialidad: form.especialidad,
      motivoConsulta: form.motivoConsulta,
      antecedentesMedicos: form.antecedentesMedicos,
      antecedentesPersonales: form.antecedentesPersonales,
      antecedentesFamiliares: form.antecedentesFamiliares,
      habitos: form.habitos,
      peso: form.peso,
      estatura: form.estatura,
      presionArterial: form.presionArterial,
      frecuenciaCardiaca: form.frecuenciaCardiaca,
      frecuenciaRespiratoria: form.frecuenciaRespiratoria,
      temperatura: form.temperatura,
      saturacionOxigeno: form.saturacionOxigeno,
      imc: calcularIMC(form.peso, form.estatura),
      observacionesFisicas: form.observacionesFisicas,
      diagnosticoPrincipal: form.diagnosticoPrincipal,
      diagnosticoSecundario: form.diagnosticoSecundario,
      tratamiento: form.tratamiento,
      recomendaciones: form.recomendaciones,
      examenesSolicitados: form.examenesSolicitados,
      proximaCita: form.proximaCita,
      observacionesAdicionales: form.observacionesAdicionales
    };

    const updated = [...(baseDatos.historias || []), nueva];
    onActualizar('historias', updated);
    setHistoriasPaciente(updated.filter(h => h.pacienteId === form.pacienteId));
    // limpiar formulario excepto paciente y ultimaFecha
    setForm(prev => ({ ...prev, motivoConsulta: '', antecedentesMedicos: '', antecedentesPersonales: '', antecedentesFamiliares: '', habitos: '', peso: '', estatura: '', presionArterial: '', frecuenciaCardiaca: '', frecuenciaRespiratoria: '', temperatura: '', saturacionOxigeno: '', imc: '', observacionesFisicas: '', diagnosticoPrincipal: '', diagnosticoSecundario: '', tratamiento: '', recomendaciones: '', examenesSolicitados: '', proximaCita: '', observacionesAdicionales: '' }));
  };

  // helpers de export
  const downloadFile = (content, filename, type = 'application/octet-stream') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const toXML = (obj, tagName = 'historia') => {
    let xml = `<${tagName}>`;
    Object.keys(obj).forEach(k => {
      const v = obj[k] == null ? '' : String(obj[k]).replace(/&/g, '&amp;').replace(/</g, '&lt;');
      xml += `<${k}>${v}</${k}>`;
    });
    xml += `</${tagName}>`;
    return xml;
  };

  const ensureJsPDF = () => new Promise((resolve) => {
    const existing = window.jspdf || window.jspdf?.jsPDF || window.jspdf?.default;
    if (existing) { const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null; resolve(jsPDF); return; }
    const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; script.onload = () => { const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null; resolve(jsPDF); }; document.body.appendChild(script);
  });

  const getDataUrlFromUrl = async (url) => {
    try { if (!url) return null; const res = await fetch(url); const blob = await res.blob(); return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); }); } catch (e) { return null; }
  };

  const exportHistoriaJSON = (h) => downloadFile(JSON.stringify(h, null, 2), `${(h.pacienteNombres || 'historia').replace(/\s+/g, '_')}.json`, 'application/json');
  const exportHistoriaXML = (h) => { const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + toXML(h, 'historia'); downloadFile(xml, `${(h.pacienteNombres || 'historia').replace(/\s+/g, '_')}.xml`, 'application/xml'); };

  const exportHistoriaPDF = async (h) => {
    const jsPDF = await ensureJsPDF(); if (!jsPDF) { alert('No se pudo generar PDF (jsPDF no disponible)'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const primario = [193, 14, 26]; const cajaBg = [245, 245, 245];
    let logoData = null; try { const logoUrl = require('../../assets/logo-uleam.png'); logoData = await getDataUrlFromUrl(logoUrl); } catch (e) { logoData = null; }

    const headerH = 72; doc.setFillColor(...primario); doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('Historia Clínica', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });
    if (logoData) { const logoBoxW = 68; const logoBoxH = 44; const logoX = 40; const logoY = 14; doc.setFillColor(255, 255, 255); doc.setDrawColor(...primario); if (typeof doc.roundedRect === 'function') { doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD'); } else { doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD'); } try { doc.addImage(logoData, 'PNG', logoX + 6, logoY + 6, logoBoxW - 12, logoBoxH - 12); } catch (err) { } }

    const left = 40; let y = headerH + 18; const width = doc.internal.pageSize.getWidth() - left * 2;

    // preparar items y etiquetas
    const map = {
      pacienteNombres: 'Paciente', ultimaFechaConsulta: 'Última fecha de consulta', medico: 'Médico Responsable', especialidad: 'Especialidad', motivoConsulta: 'Motivo de Consulta', antecedentesMedicos: 'Antecedentes Médicos', antecedentesPersonales: 'Antecedentes Personales', antecedentesFamiliares: 'Antecedentes Familiares', habitos: 'Hábitos', peso: 'Peso (kg)', estatura: 'Estatura (m)', presionArterial: 'Presión Arterial (mmHg)', frecuenciaCardiaca: 'Frecuencia Cardíaca (lpm)', frecuenciaRespiratoria: 'Frecuencia Respiratoria (rpm)', temperatura: 'Temperatura (°C)', saturacionOxigeno: 'Saturación de Oxígeno (%)', imc: 'IMC', observacionesFisicas: 'Observaciones de Examen Físico', diagnosticoPrincipal: 'Diagnóstico Principal', diagnosticoSecundario: 'Diagnóstico Secundario', tratamiento: 'Tratamiento Indicado', recomendaciones: 'Recomendaciones Médicas', examenesSolicitados: 'Exámenes Solicitados', proximaCita: 'Próxima Cita', observacionesAdicionales: 'Observaciones Adicionales'
    };

    const items = Object.keys(h).filter(k => map[k]).map(k => ({ k, label: map[k], v: h[k] }));

    const labelOffset = 130; const valueWidth = width - labelOffset - 40; const lineHeight = 14;
    const linesArr = items.map(it => doc.splitTextToSize(String(it.v == null ? '' : it.v), valueWidth));
    const heights = linesArr.map(l => Math.max(1, l.length) * lineHeight + 10);
    let cardH = Math.max(160, 40 + heights.reduce((a, b) => a + b, 0) + 40);

    // si no cabe, partir en segmentos parecidos a reportes y agregar "— Continuación —" en páginas adicionales
    const usableBottom = doc.internal.pageSize.getHeight() - 120; let idx = 0; let first = true; while (idx < items.length) {
      let available = usableBottom - y; let total = first ? 30 : 0; let end = idx; while (end < items.length && total + heights[end] <= available) { total += heights[end]; end++; }
      if (end === idx) { total = (first ? 30 : 0) + heights[idx]; end = idx + 1; }
      const segH = total + 30; doc.setFillColor(...cajaBg); doc.setDrawColor(...primario); if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, y, width, segH, 6, 6, 'FD'); } else { doc.rect(left, y, width, segH, 'FD'); }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...primario); doc.setFontSize(14); doc.text(`${h.pacienteNombres}`, left + 16, y + 30);
      if (!first) { doc.setFontSize(10); doc.setTextColor(120, 120, 120); doc.text('— Continuación —', doc.internal.pageSize.getWidth() / 2, y + 18, { align: 'center' }); doc.setFontSize(10); }
      doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0); doc.setFontSize(10); let ry = y + 54; for (let k = idx; k < end; k++) { doc.setTextColor(...primario); doc.setFont('helvetica', 'bold'); doc.text(`${items[k].label}:`, left + 16, ry); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.text(linesArr[k], left + 16 + labelOffset, ry); ry += heights[k]; }
      idx = end; first = false; if (idx < items.length) { doc.addPage(); y = 40; } else { y = y + segH + 18; }
    }

    // footer
    doc.setDrawColor(...primario); doc.setLineWidth(0.6); doc.line(left, doc.internal.pageSize.getHeight() - 80, doc.internal.pageSize.getWidth() - left, doc.internal.pageSize.getHeight() - 80);
    doc.setFontSize(10); doc.setTextColor(120, 120, 120); doc.text('Policlínico Uleam • ' + new Date().getFullYear(), left, doc.internal.pageSize.getHeight() - 60);

    doc.save(`${(h.pacienteNombres || 'historia').replace(/\s+/g, '_')}.pdf`);
  };

  const onEditarHistoria = (h) => {
    setEditingId(h.id);
    setForm({
      pacienteId: h.pacienteId,
      ultimaFechaConsulta: h.ultimaFechaConsulta || '',
      medico: h.medico || '',
      especialidad: h.especialidad || '',
      motivoConsulta: h.motivoConsulta || '',
      antecedentesMedicos: h.antecedentesMedicos || '',
      antecedentesPersonales: h.antecedentesPersonales || '',
      antecedentesFamiliares: h.antecedentesFamiliares || '',
      habitos: h.habitos || '',
      peso: h.peso || '',
      estatura: h.estatura || '',
      presionArterial: h.presionArterial || '',
      frecuenciaCardiaca: h.frecuenciaCardiaca || '',
      frecuenciaRespiratoria: h.frecuenciaRespiratoria || '',
      temperatura: h.temperatura || '',
      saturacionOxigeno: h.saturacionOxigeno || '',
      imc: h.imc || '',
      observacionesFisicas: h.observacionesFisicas || '',
      diagnosticoPrincipal: h.diagnosticoPrincipal || '',
      diagnosticoSecundario: h.diagnosticoSecundario || '',
      tratamiento: h.tratamiento || '',
      recomendaciones: h.recomendaciones || '',
      examenesSolicitados: h.examenesSolicitados || '',
      proximaCita: h.proximaCita || '',
      observacionesAdicionales: h.observacionesAdicionales || ''
    });
  };

  const onCancelarEdicion = () => {
    setEditingId(null);
    // restaurar ultima fecha segun citas
    const p = baseDatos.pacientes.find(p => p.id === pacienteId) || null;
    if (p) {
      const citasPaciente = (baseDatos.citas || []).filter(c => c.cedula === p.cedula);
      if (citasPaciente.length > 0) {
        const last = citasPaciente.reduce((a, b) => new Date(a.fecha) > new Date(b.fecha) ? a : b);
        setForm(prev => ({ ...prev, ultimaFechaConsulta: last.fecha ? new Date(last.fecha).toISOString().slice(0, 10) : '' }));
      }
    }
  };

  const onActualizarHistoria = () => {
    if (!editingId) { mostrarErrores(['No hay historia seleccionada para actualizar']); mostrarMensaje('No hay historia seleccionada para actualizar', 'error'); return; }
    if (form.peso && !validarNumeroRango(form.peso, 2, 500)) { mostrarErrores(['Peso fuera de rango plausible (2-500 kg)']); mostrarMensaje('Peso fuera de rango plausible (2-500 kg)', 'error'); return; }
    if (form.estatura && !validarNumeroRango(form.estatura, 0.3, 2.5)) { mostrarErrores(['Estatura fuera de rango plausible (0.3-2.5 m)']); mostrarMensaje('Estatura fuera de rango plausible (0.3-2.5 m)', 'error'); return; }
    if (form.temperatura && !validarNumeroRango(form.temperatura, 30, 45)) { mostrarErrores(['Temperatura fuera de rango plausible (30-45°C)']); mostrarMensaje('Temperatura fuera de rango plausible (30-45°C)', 'error'); return; }
    if (form.saturacionOxigeno && !validarNumeroRango(form.saturacionOxigeno, 0, 100)) { mostrarErrores(['Saturación debe estar entre 0 y 100%']); mostrarMensaje('Saturación debe estar entre 0 y 100%', 'error'); return; }
    if (form.frecuenciaCardiaca && !validarNumeroRango(form.frecuenciaCardiaca, 10, 250)) { mostrarErrores(['Frecuencia cardíaca fuera de rango plausible']); mostrarMensaje('Frecuencia cardíaca fuera de rango plausible', 'error'); return; }
    if (form.frecuenciaRespiratoria && !validarNumeroRango(form.frecuenciaRespiratoria, 5, 60)) { mostrarErrores(['Frecuencia respiratoria fuera de rango plausible']); mostrarMensaje('Frecuencia respiratoria fuera de rango plausible', 'error'); return; }
    if (form.proximaCita && (!validarFechaISO(form.proximaCita) || !fechaNoPasada(form.proximaCita))) { mostrarErrores(['Próxima cita inválida o en el pasado']); mostrarMensaje('Próxima cita inválida o en el pasado', 'error'); return; }

    const updatedList = (baseDatos.historias || []).map(h => h.id === editingId ? {
      ...h,
      ultimaFechaConsulta: form.ultimaFechaConsulta,
      medico: form.medico,
      especialidad: form.especialidad,
      motivoConsulta: form.motivoConsulta,
      antecedentesMedicos: form.antecedentesMedicos,
      antecedentesPersonales: form.antecedentesPersonales,
      antecedentesFamiliares: form.antecedentesFamiliares,
      habitos: form.habitos,
      peso: form.peso,
      estatura: form.estatura,
      presionArterial: form.presionArterial,
      frecuenciaCardiaca: form.frecuenciaCardiaca,
      frecuenciaRespiratoria: form.frecuenciaRespiratoria,
      temperatura: form.temperatura,
      saturacionOxigeno: form.saturacionOxigeno,
      imc: calcularIMC(form.peso, form.estatura),
      observacionesFisicas: form.observacionesFisicas,
      diagnosticoPrincipal: form.diagnosticoPrincipal,
      diagnosticoSecundario: form.diagnosticoSecundario,
      tratamiento: form.tratamiento,
      recomendaciones: form.recomendaciones,
      examenesSolicitados: form.examenesSolicitados,
      proximaCita: form.proximaCita,
      observacionesAdicionales: form.observacionesAdicionales
    } : h);

    onActualizar('historias', updatedList);
    setHistoriasPaciente(updatedList.filter(h => h.pacienteId === form.pacienteId));
    setEditingId(null);
    mostrarMensaje('Historia actualizada', 'exito');
  };

  const onEliminarHistoria = (id) => {
    if (!window.confirm('¿Eliminar esta historia?')) return;
    const updated = (baseDatos.historias || []).filter(h => h.id !== id);
    onActualizar('historias', updated);
    setHistoriasPaciente(updated.filter(h => h.pacienteId === pacienteId));
  };

  return (
    <HistorialView
      pacientes={baseDatos.pacientes}
      pacienteId={pacienteId}
      pacienteSeleccionado={pacienteSeleccionado}
      onSelectPaciente={seleccionarPaciente}
      citas={baseDatos.citas}
      facturas={baseDatos.facturas}
      historias={historiasPaciente}
      form={form}
      onFormChange={handleChange}
      onGuardarHistoria={guardarHistoria}
      onExportHistoriaPDF={exportHistoriaPDF}
      onExportHistoriaXML={exportHistoriaXML}
      onExportHistoriaJSON={exportHistoriaJSON}
      onEditarHistoria={onEditarHistoria}
      onEliminarHistoria={onEliminarHistoria}
      onActualizarHistoria={onActualizarHistoria}
      onCancelarEdicion={onCancelarEdicion}
      mensaje={mensaje}
      errores={errores}
      onVolver={onVolver}
    />
  );
}

export default HistorialContainer;