import React, { useState } from 'react';
import { MedicosView } from '@components/presentational';
import { validarEmail, validarTelefonoEstricto, validarNombre, validarSeleccion, isEmailInUse } from '@services';
import { useLocalStorage } from '@hooks';
import { exportJSON, exportAllJSON, exportXML, exportAllXML, ensureJsPDF, getDataUrlFromUrl } from '@utils/exporters';

function MedicosContainer({ baseDatos, onActualizar, onVolver }) {
  const [formData, setFormData] = useState({ nombre: '', especialidad: '', telefono: '', correo: '' });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [errores, setErrores] = useState([]);

  const [storedBaseDatos, setStoredBaseDatos] = useLocalStorage('policlinico_datos', { pacientes: [], citas: [], medicos: [], especialidades: [], facturas: [], historias: [] });
  const effectiveBaseDatos = baseDatos || storedBaseDatos;
  const updateStore = (key, value) => {
    if (typeof onActualizar === 'function') {
      try { onActualizar(key, value); return; } catch (e) { try { onActualizar(value); return; } catch(e2) { /* noop */ } }
    }
    setStoredBaseDatos(prev => ({ ...prev, [key]: value }));
  };
  const [editingId, setEditingId] = useState(null);

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setErrores([]);
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };
  const mostrarErrores = (arr) => { setErrores(Array.isArray(arr) ? arr : [String(arr)]); if (arr && arr.length) setTimeout(() => setErrores([]), 6000); };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validarNombre(formData.nombre)) { mostrarErrores(['Nombre inválido']); mostrarMensaje('Nombre inválido', 'error'); return; }
    if (!validarSeleccion(formData.especialidad)) { mostrarErrores(['Especialidad no seleccionada']); mostrarMensaje('Seleccione una especialidad', 'error'); return; }
    if (!formData.correo || !validarEmail(formData.correo)) { mostrarErrores(['Correo inválido']); mostrarMensaje('Correo inválido', 'error'); return; }
    if (formData.telefono && !validarTelefonoEstricto(formData.telefono)) { mostrarErrores(['Teléfono inválido (use 09xxxxxxxx)']); mostrarMensaje('Teléfono inválido (use 09xxxxxxxx)', 'error'); return; }

    const correoExistenteLocal = formData.correo ? (effectiveBaseDatos.medicos || []).some(m => m.correo && m.correo.toLowerCase() === String(formData.correo).toLowerCase() && m.id !== editingId) : false;
    const correoUsadoGlobal = formData.correo ? isEmailInUse(formData.correo, effectiveBaseDatos, { excludeType: 'medico', excludeId: editingId }) : false;
    if (correoExistenteLocal || correoUsadoGlobal) { mostrarErrores(['Correo ya registrado']); mostrarMensaje('Correo ya registrado', 'error'); return; }

    if (editingId) {
      const actualizado = (effectiveBaseDatos.medicos || []).map(m => m.id === editingId ? { ...m, ...formData } : m);
      updateStore('medicos', actualizado);
      mostrarMensaje('Médico actualizado', 'exito');
      setEditingId(null);
      setFormData({ nombre: '', especialidad: '', telefono: '', correo: '' });
      return;
    }

    const nuevoMedico = { id: Date.now().toString(), ...formData, fechaRegistro: new Date().toLocaleString() };
    updateStore('medicos', [...effectiveBaseDatos.medicos, nuevoMedico]);
    mostrarMensaje('Médico registrado exitosamente', 'exito');
    setFormData({ nombre: '', especialidad: '', telefono: '', correo: '' });
  };

  const eliminar = (id) => {
    if (window.confirm('¿Eliminar médico?')) {
      updateStore('medicos', effectiveBaseDatos.medicos.filter(m => m.id !== id));
      mostrarMensaje('Médico eliminado', 'info');
    }
  };

  const onChange = (field, value) => {
    if (field === 'telefono') {
      const digits = String(value || '').replace(/\D/g, '').slice(0,10);
      setFormData(prev => ({ ...prev, [field]: digits }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  }; 
  const onReset = () => { setFormData({ nombre: '', especialidad: '', telefono: '', correo: '' }); setEditingId(null); };

  const onEdit = (medico) => {
    if (!medico || !medico.id) return;
    setEditingId(medico.id);
    setFormData({ nombre: medico.nombre || '', especialidad: medico.especialidad || '', telefono: medico.telefono || '', correo: medico.correo || '' });
  };

  // helpers de descarga centralizados en `@utils/exporters`
  const exportMedicoJSON = (m) => exportJSON(m, `${(m.nombre || 'medico').replace(/\s+/g, '_')}.json`);
  const exportAllMedicosJSON = () => exportAllJSON(effectiveBaseDatos.medicos || [], `medicos.json`);
  const exportMedicoXML = (m) => exportXML(m, 'medico', `${(m.nombre || 'medico').replace(/\s+/g, '_')}.xml`);
  const exportAllMedicosXML = () => exportAllXML(effectiveBaseDatos.medicos || [], 'medico', `medicos.xml`);
  // Para PDFs usamos `ensureJsPDF` y `getDataUrlFromUrl` importados de `@utils/exporters`

  const getDataUrlFromUrl = async (url) => {
    try {
      if (!url) return null;
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  const exportMedicoPDF = async (m) => {
    const jsPDF = await ensureJsPDF();
    if (!jsPDF) { mostrarMensaje('No se pudo generar PDF (jsPDF no disponible)', 'error'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const primario = [193, 14, 26];
    const cajaBg = [245, 245, 245];

    let logoData = null;
    try { const logoUrl = require('../../assets/logo-uleam.png'); logoData = await getDataUrlFromUrl(logoUrl); } catch (e) { logoData = null; }

    const headerH = 82;
    doc.setFillColor(...primario);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(20);
    doc.setFont('helvetica','bold');
    doc.text('Ficha del Médico', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica','normal');
    doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });

    if (logoData) {
      const logoBoxW = 72; const logoBoxH = 48; const logoX = 40; const logoY = 12;
      doc.setFillColor(255,255,255); doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') { doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD'); } else { doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD'); }
      try { doc.addImage(logoData, 'PNG', logoX + (logoBoxW - 56) / 2, logoY + (logoBoxH - 40) / 2, 56, 40); } catch (err) {}
    }

    let y = headerH + 18;
    const left = 40;
    const width = doc.internal.pageSize.getWidth() - left * 2;
    const cardH = 160;

    doc.setFillColor(...cajaBg); doc.setDrawColor(...primario);
    if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, y, width, cardH, 6, 6, 'FD'); } else { doc.rect(left, y, width, cardH, 'FD'); }

    doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.setTextColor(...primario);
    doc.text(m.nombre || '—', left + 16, y + 36);

    doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);

    const col1X = left + 16;
    const col2X = left + Math.floor(width / 2) + 8;
    const labelOffset = 110;
    let rowY = y + 56;
    const rowGap = 22;

    const rowsLeft = [ ['Especialidad', m.especialidad || ''], ['Teléfono', m.telefono || ''] ];
    const rowsRight = [ ['Correo', m.correo || ''], ['Fecha de Registro', m.fechaRegistro || ''] ];

    rowsLeft.forEach(([label, val], i) => {
      const ry = rowY + i * rowGap;
      doc.setTextColor(...primario); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(`${label}:`, col1X, ry);
      doc.setTextColor(0,0,0); doc.setFont('helvetica','normal'); const valueLines = doc.splitTextToSize(String(val || '—'), Math.floor(width / 2) - labelOffset - 20); doc.text(valueLines, col1X + labelOffset, ry);
    });

    rowsRight.forEach(([label, val], i) => {
      const ry = rowY + i * rowGap;
      doc.setTextColor(...primario); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(`${label}:`, col2X, ry);
      doc.setTextColor(0,0,0); doc.setFont('helvetica','normal'); const valueLines = doc.splitTextToSize(String(val || '—'), Math.floor(width / 2) - labelOffset - 20); doc.text(valueLines, col2X + labelOffset, ry);
    });

    y += cardH + 18;

    if (y > doc.internal.pageSize.getHeight() - 100) { doc.addPage(); y = 40; }
    doc.setDrawColor(...primario); doc.setLineWidth(0.6); doc.line(left, doc.internal.pageSize.getHeight() - 80, doc.internal.pageSize.getWidth() - left, doc.internal.pageSize.getHeight() - 80);
    doc.setFontSize(10); doc.setTextColor(100,100,100); doc.text('Policlínico Uleam • ' + new Date().getFullYear(), left, doc.internal.pageSize.getHeight() - 60);

    doc.save(`${(m.nombre || 'medico').replace(/\s+/g, '_')}.pdf`);
  }; 

  const exportAllMedicosPDF = async () => {
    const jsPDF = await ensureJsPDF();
    if (!jsPDF) { mostrarMensaje('No se pudo generar PDF (jsPDF no disponible)', 'error'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const primario = [193, 14, 26];
    const cajaBg = [250, 250, 250];

    let logoData = null;
    try { const logoUrl = require('../../assets/logo-uleam.png'); logoData = await getDataUrlFromUrl(logoUrl); } catch (e) { logoData = null; }

    const headerH = 72;
    doc.setFillColor(...primario);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold');
    doc.setFontSize(18);
    doc.text('Listado de Médicos', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });

    if (logoData) {
      const logoBoxW = 68; const logoBoxH = 44; const logoX = 40; const logoY = 14;
      doc.setFillColor(255,255,255); doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') { doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD'); } else { doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD'); }
      try { doc.addImage(logoData, 'PNG', logoX + 6, logoY + 6, logoBoxW - 12, logoBoxH - 12); } catch (err) {}
    }

    let y = 90;
    const left = 40;
    const width = doc.internal.pageSize.getWidth() - left * 2;

    (effectiveBaseDatos.medicos || []).forEach((m, idx) => {
      if (y > doc.internal.pageSize.getHeight() - 140) { doc.addPage(); y = 90; }

      const h = 80;
      doc.setFillColor(...cajaBg);
      doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, y, width, h, 6, 6, 'FD'); } else { doc.rect(left, y, width, h, 'FD'); }

      doc.setFont('helvetica', 'bold'); doc.setTextColor(...primario); doc.setFontSize(12); doc.text(`${idx + 1}. ${m.nombre || '—'}`, left + 12, y + 26);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0); doc.setFontSize(10);
      const line1 = `${m.especialidad || ''} • ${m.correo || ''}`.replace(/\s+•\s+$/,''); doc.text(line1, left + 12, y + 46);

      y += h + 12;
    });

    doc.setFontSize(10); doc.setTextColor(120,120,120); doc.text(`Total: ${(effectiveBaseDatos.medicos || []).length} médicos`, left, doc.internal.pageSize.getHeight() - 40);

    doc.save('medicos.pdf');
  }; 

  return (
    <MedicosView
      medicos={effectiveBaseDatos.medicos || []}
      formData={formData}
      onChange={onChange}
      onSubmit={handleSubmit}
      onReset={onReset}
      onDelete={eliminar}
      onEdit={onEdit}
      editingId={editingId}
      onVolver={onVolver}
      mensaje={mensaje}
      errores={errores}
      onExportMedicoPDF={exportMedicoPDF}
      onExportAllPDF={exportAllMedicosPDF}
      onExportMedicoJSON={exportMedicoJSON}
      onExportAllJSON={exportAllMedicosJSON}
      onExportMedicoXML={exportMedicoXML}
      onExportAllXML={exportAllMedicosXML}
    />
  );
}

export default MedicosContainer;