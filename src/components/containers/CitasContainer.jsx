import React, { useState } from 'react';
import { CitasView } from '@components/presentational';
import { useForm } from '@hooks';
import { useLocalStorage } from '@hooks';
import { exportJSON, exportAllJSON, exportXML, exportAllXML, ensureJsPDF, getDataUrlFromUrl } from '@utils/exporters';

  // fallback localStorage para uso como página independiente
import { validarSeleccion, fechaNoPasada } from '../../services/validators';

function CitasContainer({ baseDatos, onActualizar, onVolver }) {
  const { values: formData, handleChange, reset, setValues } = useForm({ pacienteId: '', cedula: '', especialidad: '', medicoNombre: '', fecha: '', consultorio: '', estado: '', observaciones: '' });
  const [editingId, setEditingId] = useState(null);

  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [errores, setErrores] = useState([]);

  const [storedBaseDatos, setStoredBaseDatos] = useLocalStorage('policlinico_datos', { pacientes: [], citas: [], medicos: [], especialidades: [], facturas: [], historias: [] });
  const effectiveBaseDatos = baseDatos || storedBaseDatos;
  const updateStore = (key, value) => { if (typeof onActualizar === 'function') { try { onActualizar(key, value); return; } catch (e) { try { onActualizar(value); return; } catch(e2) { /* noop */ } } } setStoredBaseDatos(prev => ({ ...prev, [key]: value })); };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setErrores([]);
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };
  const mostrarErrores = (arr) => { setErrores(Array.isArray(arr) ? arr : [String(arr)]); if (arr && arr.length) setTimeout(() => setErrores([]), 6000); };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validarSeleccion(formData.pacienteId)) { mostrarErrores(['Seleccione un paciente']); mostrarMensaje('Seleccione un paciente', 'error'); return; }
    if (!validarSeleccion(formData.medicoNombre)) { mostrarErrores(['Seleccione un médico']); mostrarMensaje('Seleccione un médico', 'error'); return; }
    if (!formData.fecha || !fechaNoPasada(formData.fecha)) { mostrarErrores(['Fecha inválida o en el pasado']); mostrarMensaje('Fecha inválida o en el pasado', 'error'); return; }
    if (!validarSeleccion(formData.estado)) { mostrarErrores(['Seleccione un estado']); mostrarMensaje('Seleccione un estado', 'error'); return; }
    if (formData.consultorio && String(formData.consultorio).length > 150) { mostrarErrores(['Nombre de consultorio demasiado largo']); mostrarMensaje('Nombre de consultorio demasiado largo', 'error'); return; }

    const paciente = (effectiveBaseDatos.pacientes || []).find(p => p.id === formData.pacienteId);
    if (!paciente) { mostrarErrores(['Paciente no encontrado']); mostrarMensaje('Paciente no encontrado', 'error'); return; }

    // Validar que la cédula ingresada coincide con la del paciente seleccionado (si se completó)
    if (formData.cedula && paciente.cedula && String(formData.cedula).trim() !== String(paciente.cedula).trim()) { mostrarErrores(['La cédula no coincide con el paciente seleccionado']); mostrarMensaje('La cédula no coincide con el paciente seleccionado', 'error'); return; }

    // impedir citas duplicadas exactas para el mismo médico y fecha/hora
    const conflicto = (effectiveBaseDatos.citas || []).some(c => c.medico === formData.medicoNombre && c.fecha === formData.fecha && c.id !== editingId);
    if (conflicto) { mostrarErrores(['Ya existe una cita para este médico en la misma fecha y hora']); mostrarMensaje('Ya existe una cita para este médico en la misma fecha y hora', 'error'); return; }

    const nuevaCita = {
      id: Date.now().toString(),
      pacienteId: formData.pacienteId,
      paciente: paciente ? paciente.nombres : '',
      cedula: paciente ? paciente.cedula : '',
      especialidad: formData.especialidad || '',
      medico: formData.medicoNombre,
      fecha: formData.fecha,
      consultorio: formData.consultorio,
      estado: formData.estado,
      observaciones: formData.observaciones,
      fechaRegistro: new Date().toLocaleString()
    };

    if (editingId) {
      const actualizado = (effectiveBaseDatos.citas || []).map(c => c.id === editingId ? { ...c, ...nuevaCita, id: editingId } : c);
      updateStore('citas', actualizado);
      mostrarMensaje('Cita actualizada', 'exito');
      setEditingId(null);
      reset();
      return;
    }

    updateStore('citas', [...effectiveBaseDatos.citas, nuevaCita]);
    mostrarMensaje('Cita registrada exitosamente', 'exito');
    reset();
  };

  const eliminarCita = (id) => {
    if (window.confirm('¿Está seguro que desea eliminar esta cita?')) {
      updateStore('citas', (effectiveBaseDatos.citas || []).filter(c => c.id !== id));
      mostrarMensaje('Cita eliminada', 'info');
    }
  };

  const onChange = (field, value) => {
    if (field === 'pacienteId') {
      handleChange('pacienteId', value);
      const paciente = (effectiveBaseDatos.pacientes || []).find(p => p.id === value);
      handleChange('cedula', paciente ? paciente.cedula : '');
      return;
    }

    if (field === 'especialidad') {
      // al cambiar especialidad, limpiar selección de médico y aplicar filtro en la vista
      handleChange('especialidad', value);
      handleChange('medicoNombre', '');
      return;
    }

    handleChange(field, value);
  };
  const onReset = () => { reset(); setEditingId(null); };

  const onEdit = (cita) => {
    if (!cita || !cita.id) return;
    setEditingId(cita.id);
    setValues({ pacienteId: cita.pacienteId || '', cedula: cita.cedula || '', especialidad: cita.especialidad || '', medicoNombre: cita.medico || '', fecha: cita.fecha || '', consultorio: cita.consultorio || '', estado: cita.estado || '', observaciones: cita.observaciones || '' });
  };

  // helpers de descarga centralizados en `@utils/exporters` (downloadFile, toXML, ensureJsPDF, getDataUrlFromUrl)
  const exportCitaJSON = (c) => exportJSON(c, `${(c.paciente || 'cita').replace(/\s+/g, '_')}.json`);
  const exportAllCitasJSON = () => exportAllJSON(effectiveBaseDatos.citas || [], `citas.json`);

  const exportCitaXML = (c) => exportXML(c, 'cita', `${(c.paciente || 'cita').replace(/\s+/g, '_')}.xml`);
  const exportAllCitasXML = () => exportAllXML(effectiveBaseDatos.citas || [], 'cita', `citas.xml`);

  const exportCitaPDF = async (c) => {
    const jsPDF = await ensureJsPDF();
    if (!jsPDF) { mostrarMensaje('No se pudo generar PDF (jsPDF no disponible)', 'error'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const primario = [193, 14, 26];
    const cajaBg = [245, 245, 245];

    let logoData = null;
    try { const logoUrl = require('../../assets/logo-uleam.png'); logoData = await getDataUrlFromUrl(logoUrl); } catch (e) { logoData = null; }

    const headerH = 72;
    doc.setFillColor(...primario);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Cita Médica', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });

    if (logoData) {
      const logoBoxW = 68; const logoBoxH = 44; const logoX = 40; const logoY = 14;
      doc.setFillColor(255,255,255); doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') { doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD'); } else { doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD'); }
      try { doc.addImage(logoData, 'PNG', logoX + 6, logoY + 6, logoBoxW - 12, logoBoxH - 12); } catch (err) {}
    }

    let y = headerH + 18;
    const left = 40; const width = doc.internal.pageSize.getWidth() - left * 2;

    const cardH = 120;
    doc.setFillColor(...cajaBg); doc.setDrawColor(...primario);
    if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, y, width, cardH, 6, 6, 'FD'); } else { doc.rect(left, y, width, cardH, 'FD'); }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primario);
    doc.text(c.paciente || '—', left + 16, y + 36);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const col1X = left + 16;
    const col2X = left + Math.floor(width / 2) + 8;
    const labelOffset = 90;
    let rowY = y + 56;
    const rowGap = 22;

    const rowsLeft = [ ['Cédula', c.cedula || ''], ['Médico', c.medico || ''], ['Consultorio', c.consultorio || ''] ];
    const rowsRight = [ ['Fecha', c.fecha ? new Date(c.fecha).toLocaleString() : ''], ['Estado', c.estado || ''], ['Observaciones', c.observaciones || ''] ];

    rowsLeft.forEach(([label, val], i) => {
      const ry = rowY + i * rowGap;
      doc.setTextColor(...primario);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${label}:`, col1X, ry);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
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
      const valueLines = doc.splitTextToSize(String(val || '—'), Math.floor(width / 2) - labelOffset - 20);
      doc.text(valueLines, col2X + labelOffset, ry);
    });

    y += cardH + 18;

    // pie de página
    if (y > doc.internal.pageSize.getHeight() - 100) { doc.addPage(); y = 40; }
    doc.setDrawColor(...primario);
    doc.setLineWidth(0.6);
    doc.line(left, doc.internal.pageSize.getHeight() - 80, doc.internal.pageSize.getWidth() - left, doc.internal.pageSize.getHeight() - 80);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Policlínico Uleam • ' + new Date().getFullYear(), left, doc.internal.pageSize.getHeight() - 60);

    doc.save(`${(c.paciente || 'cita').replace(/\s+/g, '_')}.pdf`);
  };

  const exportAllCitasPDF = async () => {
    const jsPDF = await ensureJsPDF();
    if (!jsPDF) { mostrarMensaje('No se pudo generar PDF (jsPDF no disponible)', 'error'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const primario = [193, 14, 26]; const cajaBg = [250,250,250];
    let logoData = null; try { const logoUrl = require('../../assets/logo-uleam.png'); logoData = await getDataUrlFromUrl(logoUrl); } catch (e) { logoData = null; }

    const headerH = 72;
    doc.setFillColor(...primario);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Listado de Citas Médicas', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });
       if (logoData) {
      const logoBoxW = 68;
      const logoBoxH = 44;
      const logoX = 40;
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

    let y = 90; const left = 40; const width = doc.internal.pageSize.getWidth() - left * 2;

    (effectiveBaseDatos.citas || []).forEach((c, idx) => {
      if (y > doc.internal.pageSize.getHeight() - 140) { doc.addPage(); y = 90; }
      const h = 72; doc.setFillColor(...cajaBg); doc.setDrawColor(...primario); if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, y, width, h, 6, 6, 'FD'); } else { doc.rect(left, y, width, h, 'FD'); }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(193,14,26); doc.setFontSize(12); doc.text(`${idx + 1}. ${c.paciente || '—'}`, left + 12, y + 26);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0); doc.setFontSize(10); const line1 = `${c.cedula || ''} • ${c.fecha ? new Date(c.fecha).toLocaleString() : ''} • ${c.estado || ''}`.replace(/\s+•\s+$/,''); doc.text(line1, left + 12, y + 46);
      y += h + 12; }
    );

    doc.setFontSize(10); doc.setTextColor(120,120,120); doc.text(`Total: ${(effectiveBaseDatos.citas || []).length} citas`, left, doc.internal.pageSize.getHeight() - 40);

    doc.save('citas.pdf');
  };

  return (
    <CitasView
      pacientes={effectiveBaseDatos.pacientes || []}
      medicos={effectiveBaseDatos.medicos || []}
      citas={effectiveBaseDatos.citas || []}
      formData={formData}
      onChange={onChange}
      onSubmit={handleSubmit}
      onReset={onReset}
      onDelete={eliminarCita}
      onEdit={onEdit}
      editingId={editingId}
      onVolver={onVolver}
      mensaje={mensaje}
      errores={errores}
      onExportCitaPDF={exportCitaPDF}
      onExportAllPDF={exportAllCitasPDF}
      onExportCitaJSON={exportCitaJSON}
      onExportAllJSON={exportAllCitasJSON}
      onExportCitaXML={exportCitaXML}
      onExportAllXML={exportAllCitasXML}
    />
  );
}

export default CitasContainer;