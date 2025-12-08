// Exportación XML y JSON
// Sistema Médico  Policlínico ULEAM
class DataExportService {
  // Exportación a XML
  static exportToXML(data, tipo = 'completo') {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sistema_medico>\n';
    
    // Si es un array simple de resultados filtrados
    if (Array.isArray(data)) {
      xml += this.exportArrayToXML(data, tipo);
    } else {
      // Exportación completa (caso original)
      if (data.pacientes && data.pacientes.length > 0) {
        xml += '  <pacientes>\n';
        data.pacientes.forEach(p => {
          xml += this.exportPacienteXML(p);
        });
        xml += '  </pacientes>\n';
      }
      
      if (data.citas && data.citas.length > 0) {
        xml += '  <citas>\n';
        data.citas.forEach(c => {
          xml += this.exportCitaXML(c);
        });
        xml += '  </citas>\n';
      }
      
      if (data.medicos && data.medicos.length > 0) {
        xml += '  <medicos>\n';
        data.medicos.forEach(m => {
          xml += this.exportMedicoXML(m);
        });
        xml += '  </medicos>\n';
      }
      
      if (data.especialidades && data.especialidades.length > 0) {
        xml += '  <especialidades>\n';
        data.especialidades.forEach(e => {
          xml += this.exportEspecialidadXML(e);
        });
        xml += '  </especialidades>\n';
      }
      
      if (data.facturas && data.facturas.length > 0) {
        xml += '  <facturas>\n';
        data.facturas.forEach(f => {
          xml += this.exportFacturaXML(f);
        });
        xml += '  </facturas>\n';
      }
    }
    
    xml += '</sistema_medico>';
    return xml;
  }
  
  // Exportar array de resultados filtrados
  static exportArrayToXML(array, tipo) {
    let xml = '';
    let pacientes = [];
    let citas = [];
    let especialidades = [];
    let facturas = [];
    
    // Clasificar items por tipo
    array.forEach(item => {
      if (item.cedula && item.nombres) {
        pacientes.push(item);
      } else if (item.medico && item.fecha && item.consultorio) {
        citas.push(item);
      } else if (item.especialidad) {
        especialidades.push(item);
      } else if (item.numeroFactura || item.servicio) {
        facturas.push(item);
      }
    });
    
    // Generar XML por tipo
    if (pacientes.length > 0) {
      xml += '  <pacientes>\n';
      pacientes.forEach(p => {
        xml += this.exportPacienteXML(p);
      });
      xml += '  </pacientes>\n';
    }
    
    if (citas.length > 0) {
      xml += '  <citas>\n';
      citas.forEach(c => {
        xml += this.exportCitaXML(c);
      });
      xml += '  </citas>\n';
    }
    
    if (especialidades.length > 0) {
      xml += '  <especialidades>\n';
      especialidades.forEach(e => {
        xml += this.exportEspecialidadXML(e);
      });
      xml += '  </especialidades>\n';
    }
    
    if (facturas.length > 0) {
      xml += '  <facturas>\n';
      facturas.forEach(f => {
        xml += this.exportFacturaXML(f);
      });
      xml += '  </facturas>\n';
    }
    
    return xml;
  }
  
  // Exportar un paciente a XML
  static exportPacienteXML(p) {
    let xml = `    <paciente id="${this.escapeXML(p.cedula)}">\n`;
    xml += `      <datos_personales>\n`;
    xml += `        <nombres>${this.escapeXML(p.nombres)}</nombres>\n`;
    xml += `        <cedula>${this.escapeXML(p.cedula)}</cedula>\n`;
    xml += `        <fecha_nacimiento>${this.escapeXML(p.fechaNacimiento || '')}</fecha_nacimiento>\n`;
    xml += `        <edad>${p.edad || 0}</edad>\n`;
    xml += `        <sexo>${this.escapeXML(p.sexo || '')}</sexo>\n`;
    xml += `        <estado_civil>${this.escapeXML(p.estadoCivil || '')}</estado_civil>\n`;
    xml += `        <tipo_sangre>${this.escapeXML(p.tipoSangre || '')}</tipo_sangre>\n`;
    xml += `      </datos_personales>\n`;
    xml += `      <contacto>\n`;
    xml += `        <email>${this.escapeXML(p.email || '')}</email>\n`;
    xml += `        <telefono>${this.escapeXML(p.telefono || '')}</telefono>\n`;
    xml += `      </contacto>\n`;
    xml += `      <fecha_registro>${this.escapeXML(p.fechaRegistro || '')}</fecha_registro>\n`;
    xml += `    </paciente>\n`;
    return xml;
  }
  
  // Exportar una cita a XML
  static exportCitaXML(c) {
    let xml = `    <cita id="${this.escapeXML(c.id)}">\n`;
    xml += `      <paciente_cedula>${this.escapeXML(c.cedula)}</paciente_cedula>\n`;
    xml += `      <paciente_nombre>${this.escapeXML(c.paciente)}</paciente_nombre>\n`;
    xml += `      <medico>${this.escapeXML(c.medico)}</medico>\n`;
    xml += `      <fecha_hora>${this.escapeXML(c.fecha)}</fecha_hora>\n`;
    xml += `      <consultorio>${this.escapeXML(c.consultorio)}</consultorio>\n`;
    xml += `      <estado>${this.escapeXML(c.estado)}</estado>\n`;
    xml += `      <observaciones>${this.escapeXML(c.observaciones || '')}</observaciones>\n`;
    xml += `      <fecha_registro>${this.escapeXML(c.fechaRegistro || '')}</fecha_registro>\n`;
    xml += `    </cita>\n`;
    return xml;
  }
  
  // Exportar un médico a XML
  static exportMedicoXML(m) {
    let xml = `    <medico id="${this.escapeXML(m.id)}">\n`;
    xml += `      <nombre>${this.escapeXML(m.nombre)}</nombre>\n`;
    xml += `      <especialidad>${this.escapeXML(m.especialidad)}</especialidad>\n`;
    xml += `      <telefono>${this.escapeXML(m.telefono || '')}</telefono>\n`;
    xml += `      <correo>${this.escapeXML(m.correo)}</correo>\n`;
    xml += `    </medico>\n`;
    return xml;
  }
  
  // Exportar una especialidad a XML
  static exportEspecialidadXML(e) {
    let xml = `    <especialidad id="${e.id}">\n`;
    xml += `      <nombre>${this.escapeXML(e.especialidad)}</nombre>\n`;
    xml += `      <descripcion>${this.escapeXML(e.descripcion || '')}</descripcion>\n`;
    xml += `      <area>${this.escapeXML(e.area || '')}</area>\n`;
    xml += `      <horario_atencion>${this.escapeXML(e.horario || '')}</horario_atencion>\n`;
    xml += `      <medico_responsable>${this.escapeXML(e.responsable || '')}</medico_responsable>\n`;
    xml += `    </especialidad>\n`;
    return xml;
  }
  
  // Exportar una factura a XML
  static exportFacturaXML(f) {
    let xml = `    <factura id="${this.escapeXML(f.numeroFactura || f.id)}">\n`;
    xml += `      <numero_factura>${this.escapeXML(f.numeroFactura || '')}</numero_factura>\n`;
    xml += `      <paciente>\n`;
    xml += `        <nombre>${this.escapeXML(f.paciente || '')}</nombre>\n`;
    xml += `        <cedula>${this.escapeXML(f.cedula || '')}</cedula>\n`;
    xml += `      </paciente>\n`;
    xml += `      <medico>${this.escapeXML(f.medico || '')}</medico>\n`;
    xml += `      <servicio>${this.escapeXML(f.servicio || '')}</servicio>\n`;
    xml += `      <costo moneda="USD">${f.costo || 0}</costo>\n`;
    xml += `      <metodo_pago>${this.escapeXML(f.metodoPago || '')}</metodo_pago>\n`;
    xml += `      <fecha_emision>${this.escapeXML(f.fecha || '')}</fecha_emision>\n`;
    xml += `      <fecha_registro>${this.escapeXML(f.fechaRegistro || '')}</fecha_registro>\n`;
    xml += `    </factura>\n`;
    return xml;
  }
  
  // Exportación a JSON
  static exportToJSON(data) {
    // Si es un array simple (resultados filtrados)
    if (Array.isArray(data)) {
      return JSON.stringify({ 
        sistema_medico: { 
          resultados: data,
          total: data.length,
          fecha_exportacion: new Date().toISOString()
        } 
      }, null, 2);
    }
    
    // Exportación completa
    const jsonData = {
      sistema_medico: {
        pacientes: (data.pacientes || []).map(p => ({
          id: p.cedula,
          nombres: p.nombres,
          cedula: p.cedula,
          edad: p.edad,
          sexo: p.sexo,
          tipo_sangre: p.tipoSangre,
          email: p.email || '',
          fecha_registro: p.fechaRegistro
        })),
        citas: (data.citas || []).map(c => ({
          id: c.id,
          paciente: { cedula: c.cedula, nombre: c.paciente },
          medico: c.medico,
          fecha_hora: c.fecha,
          consultorio: c.consultorio,
          estado: c.estado,
          observaciones: c.observaciones || ''
        })),
        medicos: (data.medicos || []).map(m => ({
          id: m.id,
          nombre: m.nombre,
          especialidad: m.especialidad,
          telefono: m.telefono || '',
          correo: m.correo
        })),
        especialidades: (data.especialidades || []).map(e => ({
          id: e.id,
          nombre: e.especialidad,
          descripcion: e.descripcion || '',
          area: e.area || ''
        })),
        facturas: (data.facturas || []).map(f => ({
          numero_factura: f.numeroFactura || f.id,
          paciente: f.paciente || '',
          servicio: f.servicio || '',
          costo: f.costo || 0,
          fecha: f.fecha || ''
        })),
        fecha_exportacion: new Date().toISOString()
      }
    };
    
    return JSON.stringify(jsonData, null, 2);
  }
  
  // Descargar archivo XML o JSON
  static downloadXML(data, filename = 'reporte.xml') {
    try {
      const xmlContent = this.exportToXML(data);
      const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error descargando XML:', error);
      return false;
    }
  }
  
  static downloadJSON(data, filename = 'reporte.json') {
    try {
      const jsonContent = this.exportToJSON(data);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error descargando JSON:', error);
      return false;
    }
  }
  
  // Escapar caracteres especiales para XML
  static escapeXML(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Integrar botones en la interfaz de cada página
document.addEventListener('DOMContentLoaded', function() {
  const botonesContainer = document.querySelector('.botones');
  
  if (botonesContainer && !document.getElementById('btnExportXML')) {
    // Detectar en qué página estamos
    const currentPage = detectarPagina();
    
    // Botón XML
    const btnXML = document.createElement('button');
    btnXML.type = 'button';
    btnXML.id = 'btnExportXML';
    btnXML.className = 'btn-secondary';
    btnXML.innerHTML = 'Exportar XML';
    btnXML.onclick = function() {
      exportarDatosPagina('xml', currentPage);
    };
    
    // Botón JSON
    const btnJSON = document.createElement('button');
    btnJSON.type = 'button';
    btnJSON.id = 'btnExportJSON';
    btnJSON.className = 'btn-secondary';
    btnJSON.innerHTML = 'Exportar JSON';
    btnJSON.onclick = function() {
      exportarDatosPagina('json', currentPage);
    };
    
    botonesContainer.appendChild(btnXML);
    botonesContainer.appendChild(btnJSON);
  }
});

// Detectar en qué página estamos
function detectarPagina() {
  const url = window.location.pathname;
  
  if (url.includes('Pacientes.html') || document.getElementById('formPacientes')) {
    return 'pacientes';
  } else if (url.includes('Citas.html') || document.getElementById('formCitas')) {
    return 'citas';
  } else if (url.includes('Medicos.html') || document.getElementById('formMedicos')) {
    return 'medicos';
  } else if (url.includes('Especialidades.html') || document.getElementById('formEspecialidad')) {
    return 'especialidades';
  } else if (url.includes('Facturacion.html') || document.getElementById('formFacturacion')) {
    return 'facturas';
  } else if (url.includes('Reportes.html') || document.getElementById('formReportes')) {
    return 'reportes';
  } else if (url.includes('PagPrincipal.html')) {
    return 'principal';
  }
  
  return 'desconocido';
}

// Exportar datos según la página actual
function exportarDatosPagina(formato, pagina) {
  let dataToExport = null;
  let filename = '';
  let mensaje = '';
  const fecha = new Date().toISOString().split('T')[0];
  
  switch(pagina) {
    case 'pacientes':
      dataToExport = { pacientes: baseDatos.pacientes || [] };
      filename = `pacientes_${fecha}.${formato}`;
      mensaje = `${baseDatos.pacientes.length} paciente(s) exportado(s)`;
      break;
      
    case 'citas':
      dataToExport = { citas: baseDatos.citas || [] };
      filename = `citas_${fecha}.${formato}`;
      mensaje = `${baseDatos.citas.length} cita(s) exportada(s)`;
      break;
      
    case 'medicos':
      dataToExport = { medicos: baseDatos.medicos || [] };
      filename = `medicos_${fecha}.${formato}`;
      mensaje = `${baseDatos.medicos.length} médico(s) exportado(s)`;
      break;
      
    case 'especialidades':
      dataToExport = { especialidades: baseDatos.especialidades || [] };
      filename = `especialidades_${fecha}.${formato}`;
      mensaje = `${baseDatos.especialidades.length} especialidad(es) exportada(s)`;
      break;
      
    case 'facturas':
      dataToExport = { facturas: baseDatos.facturas || [] };
      filename = `facturas_${fecha}.${formato}`;
      mensaje = `${baseDatos.facturas.length} factura(s) exportada(s)`;
      break;
      
    case 'reportes':
      // Si hay resultados filtrados, usar esos
      if (typeof lastReportResults !== 'undefined' && lastReportResults.length > 0) {
        dataToExport = lastReportResults;
        filename = `reporte_filtrado_${fecha}.${formato}`;
        mensaje = `${lastReportResults.length} resultado(s) exportado(s)`;
      } else {
        // Si no hay filtros, exportar todo
        dataToExport = baseDatos;
        filename = `sistema_completo_${fecha}.${formato}`;
        mensaje = 'Sistema completo exportado';
      }
      break;
      
    case 'principal':
      // Desde página principal, exportar todo el sistema
      dataToExport = baseDatos;
      filename = `sistema_completo_${fecha}.${formato}`;
      mensaje = 'Sistema completo exportado';
      break;
      
    default:
      dataToExport = baseDatos;
      filename = `datos_${fecha}.${formato}`;
      mensaje = 'Datos exportados';
  }
  
  // Realizar la exportación
  let success = false;
  if (formato === 'xml') {
    success = DataExportService.downloadXML(dataToExport, filename);
  } else if (formato === 'json') {
    success = DataExportService.downloadJSON(dataToExport, filename);
  }
  
  // Mostrar mensaje
  if (success && typeof mostrarMensaje === 'function') {
    mostrarMensaje(mensaje + ` en formato ${formato.toUpperCase()}`, 'exito');
  } else if (!success) {
    if (typeof mostrarMensaje === 'function') {
      mostrarMensaje('Error al exportar los datos', 'error');
    } else {
      alert('Error al exportar los datos');
    }
  }
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.DataExportService = DataExportService;
}