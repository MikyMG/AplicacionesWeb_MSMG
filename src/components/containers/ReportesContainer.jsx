import React, { useState } from 'react';
import ReportesView from '../presentational/ReportesView';
import useLocalStorage from '../../hooks/useLocalStorage';

function ReportesContainer({ baseDatos, onVolver, onActualizar }) {
  const [storedBaseDatos, setStoredBaseDatos] = useLocalStorage('policlinico_datos', { pacientes: [], citas: [], medicos: [], especialidades: [], facturas: [], historias: [] });
  const effectiveBaseDatos = baseDatos || storedBaseDatos;
  const updateStore = (key, value) => { if (typeof onActualizar === 'function') { try { onActualizar(key, value); return; } catch (e) { try { onActualizar(value); return; } catch(e2) { /* noop */ } } } setStoredBaseDatos(prev => ({ ...prev, [key]: value })); };
  const [filtros, setFiltros] = useState({ pacienteId: '', fechaInicio: '', fechaFin: '' });
  const [resultados, setResultados] = useState([]);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [errores, setErrores] = useState([]);

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setErrores([]);
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };
  const mostrarErrores = (arr) => { setErrores(Array.isArray(arr) ? arr : [String(arr)]); if (arr && arr.length) setTimeout(() => setErrores([]), 6000); }; 

  const filtrar = () => {
    let datos = [];
    if (filtros.pacienteId) {
      const paciente = (effectiveBaseDatos.pacientes || []).find(p => p.id === filtros.pacienteId);
      if (paciente) {
        datos.push({ tipo: 'Paciente', ...paciente });
        datos = datos.concat((effectiveBaseDatos.citas || []).filter(c => c.cedula === paciente.cedula).map(c => ({ tipo: 'Cita', ...c })));
        datos = datos.concat((effectiveBaseDatos.facturas || []).filter(f => f.cedula === paciente.cedula).map(f => ({ tipo: 'Factura', ...f })));
      }
    } else {
      datos = [
        ...(effectiveBaseDatos.pacientes || []).map(p => ({ tipo: 'Paciente', ...p })),
        ...(effectiveBaseDatos.citas || []).map(c => ({ tipo: 'Cita', ...c })),
        ...(effectiveBaseDatos.medicos || []).map(m => ({ tipo: 'Médico', ...m })),
        ...(effectiveBaseDatos.facturas || []).map(f => ({ tipo: 'Factura', ...f }))
      ];
    }

    // validar rango de fechas
    if (filtros.fechaInicio && filtros.fechaFin) {
      const inicio = new Date(filtros.fechaInicio);
      const fin = new Date(filtros.fechaFin);
      if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
        mostrarErrores(['Rango de fechas inválido: la fecha de inicio debe ser anterior o igual a la fecha fin']);
        mostrarMensaje('Rango de fechas inválido', 'error');
        return;
      }
    }

    if (filtros.fechaInicio || filtros.fechaFin) {
      const inicio = filtros.fechaInicio ? new Date(filtros.fechaInicio) : new Date('1900-01-01');
      const fin = filtros.fechaFin ? new Date(filtros.fechaFin) : new Date('2100-12-31');
      datos = datos.filter(d => {
        const fecha = new Date(d.fecha || d.fechaRegistro);
        return fecha >= inicio && fecha <= fin;
      });
    }

    setResultados(datos);
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

  const toXML = (obj, tagName = 'item') => {
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
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => { const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null; resolve(jsPDF); };
    document.body.appendChild(script);
  });

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

  const exportItemJSON = (item) => downloadFile(JSON.stringify(item, null, 2), `${(item.nombres || item.paciente || item.nombre || item.id || 'item').toString().replace(/\s+/g, '_')}.json`, 'application/json');

  const exportItemXML = (item) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` + toXML(item, (item.tipo || 'item').toLowerCase());
    downloadFile(xml, `${(item.nombres || item.paciente || item.nombre || item.id || 'item').toString().replace(/\s+/g, '_')}.xml`, 'application/xml');
  };

  const exportItemPDF = async (item) => {
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
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold');
    doc.setFontSize(18);
    doc.text(`Detalle: ${item.tipo || 'Registro'}`, doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });

    if (logoData) {
      const logoBoxW = 68; const logoBoxH = 44; const logoX = 40; const logoY = 14;
      doc.setFillColor(255,255,255); doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') { doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD'); } else { doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD'); }
      try { doc.addImage(logoData, 'PNG', logoX + 6, logoY + 6, logoBoxW - 12, logoBoxH - 12); } catch (err) {}
    }

    let y = headerH + 18; const left = 40; const width = doc.internal.pageSize.getWidth() - left * 2;

    const items = Object.keys(item).filter(k => k !== 'tipo').map(k => ({ k, v: item[k] }));
    const labelOffset = 120; const lineHeight = 14; const valueWidth = width - labelOffset - 40;

    // preparar líneas y alturas de cada fila
    const itemLines = items.map(it => doc.splitTextToSize(String(it.v == null ? '' : it.v), valueWidth));
    const itemHeights = itemLines.map(lines => Math.max(1, lines.length) * lineHeight + 12); // espacio vertical por fila
    const titleHeight = 30; const paddingV = 18;
    const usableBottom = doc.internal.pageSize.getHeight() - 120; // espacio para footer

    const labelMap = {
      fechaNacimiento: 'Fecha de Nacimiento',
      nombres: 'Nombres',
      apellidos: 'Apellidos',
      cedula: 'Cédula',
      telefono: 'Teléfono',
      direccion: 'Dirección',
      tipoSangre: 'Tipo de Sangre',
      fechaRegistro: 'Fecha de Registro',
      fecha: 'Fecha',
      paciente: 'Paciente',
      medico: 'Médico',
      especialidad: 'Especialidad',
      servicio: 'Servicio',
      costo: 'Monto',
      numeroFactura: 'Número de Factura',
      estado: 'Estado',
      diagnostico: 'Diagnóstico',
      observaciones: 'Observaciones',
      receta: 'Receta',
      id: 'ID'
    };
    const formatLabel = (k) => (labelMap[k] || k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));

    // imprimir en segmentos: sólo añadimos página si queda contenido por imprimir (evita hojas en blanco)
    let currentIndex = 0; let pageY = y; let firstSeg = true; let lastSegHeight = 0;
    const titleText = item.nombres || item.paciente || item.nombre || (item.numeroFactura ? 'Factura ' + item.numeroFactura : 'Registro');

    while (currentIndex < items.length) {
      const available = usableBottom - pageY - paddingV;
      let total = firstSeg ? titleHeight : 0; let end = currentIndex;
      while (end < items.length && total + itemHeights[end] <= available) { total += itemHeights[end]; end++; }
      if (end === currentIndex) { // si ni una fila entra, forzamos 1 fila por página
        total = (firstSeg ? titleHeight : 0) + itemHeights[currentIndex]; end = currentIndex + 1;
      }

      const segH = total + paddingV;
      doc.setFillColor(...cajaBg); doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, pageY, width, segH, 6, 6, 'FD'); } else { doc.rect(left, pageY, width, segH, 'FD'); }

      doc.setFont('helvetica','bold'); doc.setTextColor(...primario); doc.setFontSize(14);
      doc.text(titleText, left + 16, pageY + 36);

      doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0); doc.setFontSize(10);
      let rowY2 = pageY + 60;
      for (let k = currentIndex; k < end; k++) {
        const it = items[k];
        const label = formatLabel(it.k);
        doc.setTextColor(...primario); doc.setFont('helvetica','bold'); doc.text(`${label}:`, left + 16, rowY2);
        doc.setTextColor(0,0,0); doc.setFont('helvetica','normal');
        doc.text(itemLines[k], left + 16 + labelOffset, rowY2);
        rowY2 += itemHeights[k];
      }

      lastSegHeight = segH;
      currentIndex = end; firstSeg = false;

      if (currentIndex < items.length) { doc.addPage(); pageY = 40; }
      else { y = pageY + segH + 18; }
    }

    // footer
    doc.setDrawColor(...primario); doc.setLineWidth(0.6); doc.line(left, doc.internal.pageSize.getHeight() - 80, doc.internal.pageSize.getWidth() - left, doc.internal.pageSize.getHeight() - 80);
    doc.setFontSize(10); doc.setTextColor(120,120,120); doc.text('Policlínico Uleam • ' + new Date().getFullYear(), left, doc.internal.pageSize.getHeight() - 60);

    doc.save(`${(titleText || 'registro').toString().replace(/\s+/g, '_')}.pdf`);
  };

  // Manejar actualización de registros desde el modal de reportes
  const handleUpdateFromReport = (tipo, registro) => {
    if (!tipo || !registro || !registro.id) return;
    const t = tipo.toLowerCase();
    if (t === 'paciente' || t === 'pacientes') {
      const actualizado = (effectiveBaseDatos.pacientes || []).map(p => p.id === registro.id ? { ...p, ...registro } : p);
      updateStore('pacientes', actualizado);
      mostrarMensaje('Paciente actualizado desde reportes', 'exito');
      filtrar();
      return;
    }
    if (t === 'cita' || t === 'citas') {
      const actualizado = (effectiveBaseDatos.citas || []).map(c => c.id === registro.id ? { ...c, ...registro } : c);
      updateStore('citas', actualizado);
      mostrarMensaje('Cita actualizada desde reportes', 'exito');
      filtrar();
      return;
    }
    if (t === 'medico' || t === 'médico' || t === 'medicos') {
      const actualizado = (effectiveBaseDatos.medicos || []).map(m => m.id === registro.id ? { ...m, ...registro } : m);
      updateStore('medicos', actualizado);
      mostrarMensaje('Médico actualizado desde reportes', 'exito');
      filtrar();
      return;
    }
    if (t === 'factura' || t === 'facturas') {
      const actualizado = (effectiveBaseDatos.facturas || []).map(f => f.id === registro.id ? { ...f, ...registro } : f);
      updateStore('facturas', actualizado);
      mostrarMensaje('Factura actualizada desde reportes', 'exito');
      filtrar();
      return;
    }
    if (t === 'especialidad' || t === 'especialidades') {
      const actualizado = (effectiveBaseDatos.especialidades || []).map(e => e.id === registro.id ? { ...e, ...registro } : e);
      updateStore('especialidades', actualizado);
      mostrarMensaje('Especialidad actualizada desde reportes', 'exito');
      filtrar();
      return;
    }
  };

  return (
    <ReportesView
      pacientes={effectiveBaseDatos.pacientes || []}
      filtros={filtros}
      onChange={(f, v) => setFiltros(prev => ({ ...prev, [f]: v }))}
      onSubmit={(e) => { e.preventDefault(); filtrar(); }}
      onReset={() => { setFiltros({ pacienteId: '', fechaInicio: '', fechaFin: '' }); setResultados([]); }}
      resultados={resultados}
      onVolver={onVolver}
      onEditFromReport={handleUpdateFromReport}
      mensaje={mensaje}
      errores={errores}
      onExportItemPDF={exportItemPDF}
      onExportItemXML={exportItemXML}
      onExportItemJSON={exportItemJSON}
    />
  );
}

export default ReportesContainer;