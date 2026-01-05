import React, { useState } from 'react';
import { EspecialidadesView } from '@components/presentational';
import { validarNombre } from '@services';
import { useLocalStorage } from '@hooks';
import { exportJSON, exportAllJSON, exportXML, exportAllXML, ensureJsPDF, getDataUrlFromUrl } from '@utils/exporters';

function EspecialidadesContainer({ baseDatos, onActualizar, onVolver }) {
  const [formData, setFormData] = useState({ especialidad: '', descripcion: '', responsable: '' });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [errores, setErrores] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [storedBaseDatos, setStoredBaseDatos] = useLocalStorage('policlinico_datos', { pacientes: [], citas: [], medicos: [], especialidades: [], facturas: [], historias: [] });
  const effectiveBaseDatos = baseDatos || storedBaseDatos;
  const updateStore = (key, value) => { if (typeof onActualizar === 'function') { try { onActualizar(key, value); return; } catch (e) { try { onActualizar(value); return; } catch (e2) { /* noop */ } } } setStoredBaseDatos(prev => ({ ...prev, [key]: value })); };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setErrores([]);
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };
  const mostrarErrores = (arr) => { setErrores(Array.isArray(arr) ? arr : [String(arr)]); if (arr && arr.length) setTimeout(() => setErrores([]), 6000); }; 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.especialidad || !formData.descripcion) {
      mostrarErrores(['Complete los campos obligatorios']); mostrarMensaje('Complete los campos obligatorios', 'error'); return;
    }

    if (formData.responsable && !validarNombre(formData.responsable)) { mostrarErrores(['Nombre de responsable inválido']); mostrarMensaje('Nombre de responsable inválido', 'error'); return; }

    if (String(formData.descripcion).length > 2000) { mostrarErrores(['Descripción demasiado larga']); mostrarMensaje('Descripción demasiado larga', 'error'); return; }

    // prevenir duplicados (excluyendo el registro en edición)
    const existe = (effectiveBaseDatos.especialidades || []).some(ex => ex.especialidad.toLowerCase() === formData.especialidad.toLowerCase() && ex.id !== editingId);
    if (existe) { mostrarMensaje('Especialidad ya registrada', 'error'); return; }

    if (editingId) {
      const actualizado = (effectiveBaseDatos.especialidades || []).map(ex => ex.id === editingId ? { ...ex, ...formData } : ex);
      updateStore('especialidades', actualizado);
      mostrarMensaje('Especialidad actualizada', 'exito');
      setEditingId(null);
      setFormData({ especialidad: '', descripcion: '', responsable: '' });
      return;
    }

    const nueva = { id: Date.now().toString(), ...formData, fechaRegistro: new Date().toLocaleString() };
    updateStore('especialidades', [...effectiveBaseDatos.especialidades, nueva]);
    mostrarMensaje('Especialidad registrada', 'exito');
    setFormData({ especialidad: '', descripcion: '', responsable: '' });
  };

  const eliminar = (id) => {
    if (window.confirm('¿Eliminar especialidad?')) {
      updateStore('especialidades', (effectiveBaseDatos.especialidades || []).filter(e => e.id !== id));
      mostrarMensaje('Especialidad eliminada', 'info');
    }
  };

  const onChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const onReset = () => { setFormData({ especialidad: '', descripcion: '', responsable: '' }); setEditingId(null); };

  const onEdit = (esp) => {
    if (!esp || !esp.id) return;
    setEditingId(esp.id);
    setFormData({ especialidad: esp.especialidad || '', descripcion: esp.descripcion || '', responsable: esp.responsable || '' });
  };

  // helpers de descarga (JSON / XML / PDF)
  const downloadFile = (content, filename, type = 'application/octet-stream') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const toXML = (obj, tagName = 'especialidad') => {
    let xml = `<${tagName}>`;
    Object.keys(obj).forEach(k => {
      const v = obj[k] == null ? '' : String(obj[k]).replace(/&/g, '&amp;').replace(/</g, '&lt;');
      xml += `<${k}>${v}</${k}>`;
    });
    xml += `</${tagName}>`;
    return xml;
  };

  const exportEspecialidadJSON = (e) => downloadFile(JSON.stringify(e, null, 2), `${(e.especialidad || 'especialidad').replace(/\s+/g, '_')}.json`, 'application/json');
  const exportAllEspecialidadesJSON = () => downloadFile(JSON.stringify(effectiveBaseDatos.especialidades || [], null, 2), `especialidades.json`, 'application/json');

  const exportEspecialidadXML = (e) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` + toXML(e, 'especialidad');
    downloadFile(xml, `${(e.especialidad || 'especialidad').replace(/\s+/g, '_')}.xml`, 'application/xml');
  };
  const exportAllEspecialidadesXML = () => {
    const items = (effectiveBaseDatos.especialidades || []).map(ex => toXML(ex, 'especialidad')).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<especialidades>\n${items}\n</especialidades>`;
    downloadFile(xml, `especialidades.xml`, 'application/xml');
  };

  const ensureJsPDF = () => new Promise((resolve) => {
    const existing = window.jspdf || window.jspdf?.jsPDF || window.jspdf?.default;
    if (existing) { const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null; resolve(jsPDF); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => { const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null; resolve(jsPDF); };
    document.body.appendChild(script);
  });

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
    } catch (err) { return null; }
  };

  const exportEspecialidadPDF = async (e) => {
    const jsPDF = await ensureJsPDF();
    if (!jsPDF) { mostrarMensaje('No se pudo generar PDF (jsPDF no disponible)', 'error'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const primario = [193, 14, 26];
    const cajaBg = [245,245,245];

    let logoData = null;
    try { const logoUrl = require('../../assets/logo-uleam.png'); logoData = await getDataUrlFromUrl(logoUrl); } catch (err) { logoData = null; }

    const headerH = 82;
    doc.setFillColor(...primario);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(20);
    doc.setFont('helvetica','bold');
    doc.text('Ficha de Especialidad', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });

    if (logoData) { const logoBoxW = 72; const logoBoxH = 48; const logoX = 40; const logoY = 12; doc.setFillColor(255,255,255); doc.setDrawColor(...primario); if (typeof doc.roundedRect === 'function') { doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD'); } else { doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD'); } try { doc.addImage(logoData, 'PNG', logoX + (logoBoxW - 56) / 2, logoY + (logoBoxH - 40) / 2, 56, 40); } catch (err) {} }

    let y = headerH + 18; const left = 40; const width = doc.internal.pageSize.getWidth() - left * 2; const cardH = 140; doc.setFillColor(...cajaBg); doc.setDrawColor(...primario); if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, y, width, cardH, 6, 6, 'FD'); } else { doc.rect(left, y, width, cardH, 'FD'); }

    doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.setTextColor(...primario); doc.text(e.especialidad || '—', left + 16, y + 36);

    doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
    const col1X = left + 16; const col2X = left + Math.floor(width / 2) + 8; const labelOffset = 90; let rowY = y + 56; const rowGap = 22;

    const rowsLeft = [ ['Descripción', e.descripcion || ''] ];
    const rowsRight = [ ['Responsable', e.responsable || ''] ];

    rowsLeft.forEach(([label, val], i) => { const ry = rowY + i * rowGap; doc.setTextColor(...primario); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(`${label}:`, col1X, ry); doc.setTextColor(0,0,0); doc.setFont('helvetica','normal'); const valueLines = doc.splitTextToSize(String(val || '—'), Math.floor(width / 2) - labelOffset - 20); doc.text(valueLines, col1X + labelOffset, ry); });

    rowsRight.forEach(([label, val], i) => { const ry = rowY + i * rowGap; doc.setTextColor(...primario); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(`${label}:`, col2X, ry); doc.setTextColor(0,0,0); doc.setFont('helvetica','normal'); const valueLines = doc.splitTextToSize(String(val || '—'), Math.floor(width / 2) - labelOffset - 20); doc.text(valueLines, col2X + labelOffset, ry); });

    y += cardH + 18;

    if (y > doc.internal.pageSize.getHeight() - 100) { doc.addPage(); y = 40; }
    doc.setDrawColor(...primario); doc.setLineWidth(0.6); doc.line(left, doc.internal.pageSize.getHeight() - 80, doc.internal.pageSize.getWidth() - left, doc.internal.pageSize.getHeight() - 80); doc.setFontSize(10); doc.setTextColor(100,100,100); doc.text('Policlínico Uleam • ' + new Date().getFullYear(), left, doc.internal.pageSize.getHeight() - 60);

    doc.save(`${(e.especialidad || 'especialidad').replace(/\s+/g, '_')}.pdf`);
  }; 

  const exportAllEspecialidadesPDF = async () => {
    const jsPDF = await ensureJsPDF();
    if (!jsPDF) { mostrarMensaje('No se pudo generar PDF (jsPDF no disponible)', 'error'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const primario = [193, 14, 26];
    const cajaBg = [250,250,250];

    let logoData = null;
    try { const logoUrl = require('../../assets/logo-uleam.png'); logoData = await getDataUrlFromUrl(logoUrl); } catch (err) { logoData = null; }

    const headerH = 72;
    doc.setFillColor(...primario);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold');
    doc.setFontSize(18);
    doc.text('Listado de Especialidades', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });

    if (logoData) { const logoBoxW = 68; const logoBoxH = 44; const logoX = 40; const logoY = 14; doc.setFillColor(255,255,255); doc.setDrawColor(...primario); if (typeof doc.roundedRect === 'function') { doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD'); } else { doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD'); } try { doc.addImage(logoData, 'PNG', logoX + 6, logoY + 6, logoBoxW - 12, logoBoxH - 12); } catch (err) {} }

    let y = 90; const left = 40; const width = doc.internal.pageSize.getWidth() - left * 2;
    (effectiveBaseDatos.especialidades || []).forEach((ex, idx) => {
      // calcular líneas para descripción y altura dinámica de tarjeta
      const maxTextWidth = width - 24; // margen interno
      const titleY = y + 26;
      const descStartY = y + 46;
      const descLines = doc.splitTextToSize(String(ex.descripcion || '—'), maxTextWidth);
      const lineHeight = 12;
      const descHeight = descLines.length * lineHeight;
      const minH = 80;
      const h = Math.max(minH, descHeight + (descStartY - y) + 12);

      if (y > doc.internal.pageSize.getHeight() - h - 60) { doc.addPage(); y = 90; }

      doc.setFillColor(...cajaBg);
      doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, y, width, h, 6, 6, 'FD'); } else { doc.rect(left, y, width, h, 'FD'); }

      doc.setFont('helvetica', 'bold'); doc.setTextColor(...primario); doc.setFontSize(12); doc.text(`${idx + 1}. ${ex.especialidad || ''}`, left + 12, titleY);
      doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0); doc.setFontSize(10); doc.text(descLines, left + 12, descStartY);

      y += h + 12;
    });

    doc.setFontSize(10); doc.setTextColor(120,120,120); doc.text(`Total: ${(effectiveBaseDatos.especialidades || []).length} especialidades`, left, doc.internal.pageSize.getHeight() - 40);

    doc.save('especialidades.pdf');
  };

  return (
    <EspecialidadesView
      especialidades={effectiveBaseDatos.especialidades || []}
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
      onExportEspecialidadPDF={exportEspecialidadPDF}
      onExportAllPDF={exportAllEspecialidadesPDF}
      onExportEspecialidadJSON={exportEspecialidadJSON}
      onExportAllJSON={exportAllEspecialidadesJSON}
      onExportEspecialidadXML={exportEspecialidadXML}
      onExportAllXML={exportAllEspecialidadesXML}
    />
  );
}

export default EspecialidadesContainer;