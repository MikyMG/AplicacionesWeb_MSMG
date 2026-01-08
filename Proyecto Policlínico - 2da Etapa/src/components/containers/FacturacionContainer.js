import React, { useState } from 'react';
import FacturacionView from '../presentational/FacturacionView';
import { validarNumeroRango, validarSeleccion, validarFechaISO } from '../../services/validators';

function FacturacionContainer({ baseDatos, onActualizar, onVolver }) {
  const [formData, setFormData] = useState({ pacienteId: '', medico: '', servicio: '', costo: '', metodoPago: '', fecha: '' });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [errores, setErrores] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setErrores([]);
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };
  const mostrarErrores = (arr) => { setErrores(Array.isArray(arr) ? arr : [String(arr)]); if (arr && arr.length) setTimeout(() => setErrores([]), 6000); };

  const onEdit = (factura) => {
    if (!factura || !factura.id) return;
    setEditingId(factura.id);
    setFormData({ pacienteId: factura.pacienteId || '', medico: factura.medico || '', servicio: factura.servicio || '', costo: factura.costo != null ? String(factura.costo) : '', metodoPago: factura.metodoPago || '', fecha: factura.fecha || '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validarSeleccion(formData.pacienteId)) { mostrarErrores(['Seleccione un paciente']); mostrarMensaje('Seleccione un paciente', 'error'); return; }
    if (!validarSeleccion(formData.servicio)) { mostrarErrores(['Ingrese el servicio']); mostrarMensaje('Ingrese el servicio', 'error'); return; }
    if (!validarNumeroRango(formData.costo, 0.01, 100000)) { mostrarErrores(['Costo debe ser un número entre 0.01 y 100000']); mostrarMensaje('Costo inválido', 'error'); return; }
    if (formData.fecha && !validarFechaISO(formData.fecha)) { mostrarErrores(['Fecha inválida']); mostrarMensaje('Fecha inválida', 'error'); return; }
    if (formData.fecha) {
      const d = new Date(formData.fecha);
      const hoy = new Date();
      if (d > hoy) { mostrarErrores(['La fecha de la factura no puede ser futura']); mostrarMensaje('La fecha de la factura no puede ser futura', 'error'); return; }
    }

    const paciente = baseDatos.pacientes.find(p => p.id === formData.pacienteId);

    const nueva = {
      id: Date.now().toString(),
      numeroFactura: 'FACT-' + Date.now(),
      paciente: paciente ? paciente.nombres : '',
      cedula: paciente ? paciente.cedula : '',
      medico: formData.medico,
      servicio: formData.servicio,
      costo: parseFloat(formData.costo),
      metodoPago: formData.metodoPago,
      fecha: formData.fecha || new Date().toISOString().split('T')[0],
      fechaRegistro: new Date().toLocaleString()
    };

    if (editingId) {
      const actualizado = baseDatos.facturas.map(f => f.id === editingId ? { ...f, ...nueva, id: editingId } : f);
      onActualizar(actualizado);
      mostrarMensaje('Factura actualizada', 'exito');
      setEditingId(null);
      setFormData({ pacienteId: '', medico: '', servicio: '', costo: '', metodoPago: '', fecha: '' });
      return;
    }

    onActualizar([...baseDatos.facturas, nueva]);
    mostrarMensaje('Factura generada exitosamente', 'exito');
    setFormData({ pacienteId: '', medico: '', servicio: '', costo: '', metodoPago: '', fecha: '' });
  };

  // helpers de descarga
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

  const toXML = (obj, tagName = 'factura') => {
    let xml = `<${tagName}>`;
    Object.keys(obj).forEach(k => {
      const v = obj[k] == null ? '' : String(obj[k]).replace(/&/g, '&amp;').replace(/</g, '&lt;');
      xml += `<${k}>${v}</${k}>`;
    });
    xml += `</${tagName}>`;
    return xml;
  };

  const exportFacturaJSON = (f) => downloadFile(JSON.stringify(f, null, 2), `${(f.numeroFactura || 'factura').replace(/\s+/g, '_')}.json`, 'application/json');
  const exportAllFacturasJSON = () => downloadFile(JSON.stringify(baseDatos.facturas, null, 2), `facturas.json`, 'application/json');

  const exportFacturaXML = (f) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` + toXML(f, 'factura');
    downloadFile(xml, `${(f.numeroFactura || 'factura').replace(/\s+/g, '_')}.xml`, 'application/xml');
  };
  const exportAllFacturasXML = () => {
    const items = (baseDatos.facturas || []).map(f => toXML(f, 'factura')).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<facturas>\n${items}\n</facturas>`;
    downloadFile(xml, `facturas.xml`, 'application/xml');
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
    } catch (err) {
      return null;
    }
  };

  const exportFacturaPDF = async (f) => {
    const jsPDF = await ensureJsPDF();
    if (!jsPDF) { mostrarMensaje('No se pudo generar PDF (jsPDF no disponible)', 'error'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const primario = [193, 14, 26]; const cajaBg = [245,245,245];
    let logoData = null; try { const logoUrl = require('../../assets/images/logo-uleam.png'); logoData = await getDataUrlFromUrl(logoUrl); } catch (e) { logoData = null; }

    const headerH = 82;
    doc.setFillColor(...primario);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(20);
    doc.setFont('helvetica','bold');
    doc.text('Detalle de Factura', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica','normal');
    doc.text(`Generado: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, headerH / 2 + 6, { align: 'right' });
    if (logoData) {
      const logoBoxW = 72;
      const logoBoxH = 48;
      const logoX = 40;
      const logoY = 12;
      doc.setFillColor(255,255,255);
      doc.setDrawColor(...primario);
      if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD');
      } else {
        doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD');
      }
      try { doc.addImage(logoData, 'PNG', logoX + (logoBoxW - 56) / 2, logoY + (logoBoxH - 40) / 2, 56, 40); } catch (err) {}
    }

    let y = headerH + 18; const left = 40; const width = doc.internal.pageSize.getWidth() - left * 2; const cardH = 120; doc.setFillColor(...cajaBg); doc.setDrawColor(...primario); if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, y, width, cardH, 6, 6, 'FD'); } else { doc.rect(left, y, width, cardH, 'FD'); }
    doc.setFontSize(16);
    doc.setFont('helvetica','bold');
    doc.setTextColor(...primario);
    doc.text(f.numeroFactura || '—', left + 16, y + 36);

    doc.setFontSize(10);
    doc.setFont('helvetica','normal');
    doc.setTextColor(0,0,0);

    const col1X = left + 16;
    const col2X = left + Math.floor(width / 2) + 8;
    const labelOffset = 110;
    let rowY = y + 56;
    const rowGap = 22;

    const rowsLeft = [ ['Paciente', f.paciente || ''], ['Cédula', f.cedula || ''] ];
    const rowsRight = [ ['Servicio', f.servicio || ''], ['Monto', f.costo != null ? `$${f.costo.toFixed(2)}` : ''], ['Método de Pago', f.metodoPago || ''] ];

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

    y += cardH + 18; doc.setFontSize(10); doc.setTextColor(120,120,120); doc.text('Policlínico Uleam • ' + new Date().getFullYear(), left, doc.internal.pageSize.getHeight() - 60);
    doc.save(`${(f.numeroFactura || 'factura').replace(/\s+/g, '_')}.pdf`);
  };

  const exportAllFacturasPDF = async () => {
    const jsPDF = await ensureJsPDF();
    if (!jsPDF) { mostrarMensaje('No se pudo generar PDF (jsPDF no disponible)', 'error'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' }); const primario = [193,14,26]; const cajaBg = [250,250,250]; let logoData = null; try { const logoUrl = require('../../assets/images/logo-uleam.png'); logoData = await getDataUrlFromUrl(logoUrl); } catch (e) { logoData = null; }
    const headerH = 72;
    doc.setFillColor(...primario);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold');
    doc.setFontSize(18);
    doc.text('Listado de Facturas', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
    doc.setFont('helvetica','normal');
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

    let y = 90; const left = 40; const width = doc.internal.pageSize.getWidth() - left * 2; (baseDatos.facturas || []).forEach((f, idx) => { if (y > doc.internal.pageSize.getHeight() - 140) { doc.addPage(); y = 90; } const h = 72; doc.setFillColor(...cajaBg); doc.setDrawColor(...primario); if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, y, width, h, 6, 6, 'FD'); } else { doc.rect(left, y, width, h, 'FD'); } doc.setFont('helvetica', 'bold'); doc.setTextColor(193,14,26); doc.setFontSize(12); doc.text(`${idx + 1}. ${f.numeroFactura || '—'}`, left + 12, y + 26); doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0); doc.setFontSize(10); const line1 = `${f.paciente || ''} • ${f.cedula || ''} • ${f.costo != null ? '$' + f.costo.toFixed(2) : ''}`.replace(/\s+•\s+$/,''); doc.text(line1, left + 12, y + 46); y += h + 12; });

    doc.setFontSize(10); doc.setTextColor(120,120,120); doc.text(`Total: ${(baseDatos.facturas || []).length} facturas`, left, doc.internal.pageSize.getHeight() - 40);

    doc.save('facturas.pdf');
  };

  return (
    <FacturacionView
      pacientes={baseDatos.pacientes}
      medicos={baseDatos.medicos}
      facturas={baseDatos.facturas}
      formData={formData}
      onChange={(f, v) => setFormData(prev => ({ ...prev, [f]: v }))}
      onSubmit={handleSubmit}
      onReset={() => { setFormData({ pacienteId: '', medico: '', servicio: '', costo: '', metodoPago: '', fecha: '' }); setEditingId(null); }}
      onEdit={onEdit}
      editingId={editingId}
      onVolver={onVolver}
      mensaje={mensaje}
      errores={errores}
      onExportFacturaPDF={exportFacturaPDF}
      onExportAllPDF={exportAllFacturasPDF}
      onExportFacturaJSON={exportFacturaJSON}
      onExportAllJSON={exportAllFacturasJSON}
      onExportFacturaXML={exportFacturaXML}
      onExportAllXML={exportAllFacturasXML}
    />
  );
}

export default FacturacionContainer;