// Exportación XML y JSON
// Sistema Médico  Policlínico ULEAM
class DataExportService {
  
// Exportación de datos a XML
static exportToXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<sistema_medico>\n'; 
// Exportación de Pacientes
    if (data.pacientes && data.pacientes.length > 0) {
      xml += '  <pacientes>\n';
      data.pacientes.forEach(p => {
        xml += `    <paciente id="${this.escapeXML(p.cedula)}">\n`;
        xml += `      <datos_personales>\n`;
        xml += `        <nombres>${this.escapeXML(p.nombres)}</nombres>\n`;
        xml += `        <cedula>${this.escapeXML(p.cedula)}</cedula>\n`;
        xml += `        <fecha_nacimiento>${this.escapeXML(p.fechaNacimiento || '')}</fecha_nacimiento>\n`;
        xml += `        <edad>${p.edad || 0}</edad>\n`;
        xml += `        <sexo>${this.escapeXML(p.sexo || '')}</sexo>\n`;
        xml += `        <estado_civil>${this.escapeXML(p.estadoCivil || '')}</estado_civil>\n`;
        xml += `        <tipo_sangre>${this.escapeXML(p.tipoSangre || '')}</tipo_sangre>\n`;
        xml += `        <nacionalidad>${this.escapeXML(p.nacionalidad || 'No especificado')}</nacionalidad>\n`;
        xml += `      </datos_personales>\n`;
        xml += `      <contacto>\n`;
        xml += `        <direccion>${this.escapeXML(p.direccion || '')}</direccion>\n`;
        xml += `        <ciudad>${this.escapeXML(p.ciudad || '')}</ciudad>\n`;
        xml += `        <provincia>${this.escapeXML(p.provincia || '')}</provincia>\n`;
        xml += `        <telefono>${this.escapeXML(p.telefono || '')}</telefono>\n`;
        xml += `        <email>${this.escapeXML(p.email || '')}</email>\n`;
        xml += `      </contacto>\n`;
        xml += `      <datos_medicos>\n`;
        xml += `        <peso unidad="kg">${p.peso || 0}</peso>\n`;
        xml += `        <estatura unidad="m">${p.estatura || 0}</estatura>\n`;
        xml += `        <imc>${this.escapeXML(p.imc || '')}</imc>\n`;
        xml += `        <alergias>${this.escapeXML(p.alergias || '')}</alergias>\n`;
        xml += `        <enfermedades_cronicas>${this.escapeXML(p.enfermedades || '')}</enfermedades_cronicas>\n`;
        xml += `        <tratamientos_actuales>${this.escapeXML(p.tratamientos || '')}</tratamientos_actuales>\n`;
        xml += `      </datos_medicos>\n`;
        xml += `      <fecha_registro>${this.escapeXML(p.fechaRegistro || '')}</fecha_registro>\n`;
        xml += `    </paciente>\n`;
      });
      xml += '  </pacientes>\n';
    }

    // Exportación de Citas
    if (data.citas && data.citas.length > 0) {
      xml += '  <citas>\n';
      data.citas.forEach(c => {
        xml += `    <cita id="${this.escapeXML(c.id)}">\n`;
        xml += `      <paciente_cedula>${this.escapeXML(c.cedula)}</paciente_cedula>\n`;
        xml += `      <paciente_nombre>${this.escapeXML(c.paciente)}</paciente_nombre>\n`;
        xml += `      <medico>${this.escapeXML(c.medico)}</medico>\n`;
        xml += `      <fecha_hora>${this.escapeXML(c.fecha)}</fecha_hora>\n`;
        xml += `      <consultorio>${this.escapeXML(c.consultorio)}</consultorio>\n`;
        xml += `      <estado>${this.escapeXML(c.estado)}</estado>\n`;
        xml += `      <observaciones>${this.escapeXML(c.observaciones || '')}</observaciones>\n`;
        xml += `      <fecha_registro>${this.escapeXML(c.fechaRegistro)}</fecha_registro>\n`;
        xml += `    </cita>\n`;
      });
      xml += '  </citas>\n';
    }
    
    // Exportación de Médicos
    if (data.medicos && data.medicos.length > 0) {
      xml += '  <medicos>\n';
      data.medicos.forEach(m => {
        xml += `    <medico id="${this.escapeXML(m.id)}">\n`;
        xml += `      <nombre>${this.escapeXML(m.nombre)}</nombre>\n`;
        xml += `      <especialidad>${this.escapeXML(m.especialidad)}</especialidad>\n`;
        xml += `      <telefono>${this.escapeXML(m.telefono || '')}</telefono>\n`;
        xml += `      <correo>${this.escapeXML(m.correo)}</correo>\n`;
        xml += `      <horario>${this.escapeXML(this.formatHorario(m.horario))}</horario>\n`;
        xml += `      <fecha_registro>${this.escapeXML(m.fechaRegistro)}</fecha_registro>\n`;
        xml += `    </medico>\n`;
      });
      xml += '  </medicos>\n';
    }
    
    // Exportación de Especialidades Médicas
    if (data.especialidades && data.especialidades.length > 0) {
      xml += '  <especialidades>\n';
      data.especialidades.forEach(e => {
        xml += `    <especialidad id="${e.id}">\n`;
        xml += `      <nombre>${this.escapeXML(e.especialidad)}</nombre>\n`;
        xml += `      <descripcion>${this.escapeXML(e.descripcion || '')}</descripcion>\n`;
        xml += `      <area>${this.escapeXML(e.area || '')}</area>\n`;
        xml += `      <horario_atencion>${this.escapeXML(e.horario || '')}</horario_atencion>\n`;
        xml += `      <medico_responsable>${this.escapeXML(e.responsable || '')}</medico_responsable>\n`;
        xml += `    </especialidad>\n`;
      });
      xml += '  </especialidades>\n';
    }
    
    // Exportación de Facturas
    if (data.facturas && data.facturas.length > 0) {
      xml += '  <facturas>\n';
      data.facturas.forEach(f => {
        xml += `    <factura id="${this.escapeXML(f.numeroFactura || f.id)}">\n`;
        xml += `      <numero_factura>${this.escapeXML(f.numeroFactura || '')}</numero_factura>\n`;
        xml += `      <paciente>\n`;
        xml += `        <nombre>${this.escapeXML(f.paciente || '')}</nombre>\n`;
        xml += `        <cedula>${this.escapeXML(f.cedula || '')}</cedula>\n`;
        xml += `      </paciente>\n`;
        xml += `      <medico>${this.escapeXML(f.medico || '')}</medico>\n`;
        xml += `      <servicio>${this.escapeXML(f.servicio || '')}</servicio>\n`;
        xml += `      <descripcion>${this.escapeXML(f.descripcion || '')}</descripcion>\n`;
        xml += `      <costo moneda="USD">${f.costo || 0}</costo>\n`;
        xml += `      <metodo_pago>${this.escapeXML(f.metodoPago || '')}</metodo_pago>\n`;
        xml += `      <fecha_emision>${this.escapeXML(f.fecha || '')}</fecha_emision>\n`;
        xml += `      <fecha_registro>${this.escapeXML(f.fechaRegistro || '')}</fecha_registro>\n`;
        xml += `    </factura>\n`;
      });
      xml += '  </facturas>\n';
    }
    xml += '</sistema_medico>';
    return xml;
  }
  
  // Exportación de datos a JSON
  static exportToJSON(data) {
    const jsonData = {
      sistema_medico: {
        pacientes: (data.pacientes || []).map(p => ({
          id: p.cedula,
          datos_personales: {
            nombres: p.nombres,
            cedula: p.cedula,
            fecha_nacimiento: p.fechaNacimiento || '',
            edad: p.edad || 0,
            sexo: p.sexo || '',
            estado_civil: p.estadoCivil || '',
            tipo_sangre: p.tipoSangre || '',
            nacionalidad: p.nacionalidad || 'No especificado'
          },
          contacto: {
            direccion: p.direccion || '',
            ciudad: p.ciudad || '',
            provincia: p.provincia || '',
            telefono: p.telefono || '',
            email: p.email || ''
          },
          datos_medicos: {
            peso: { valor: p.peso || 0, unidad: 'kg' },
            estatura: { valor: p.estatura || 0, unidad: 'm' },
            imc: p.imc || '',
            alergias: p.alergias || '',
            enfermedades_cronicas: p.enfermedades || '',
            tratamientos_actuales: p.tratamientos || ''
          },
          fecha_registro: p.fechaRegistro || ''
        })),
        citas: (data.citas || []).map(c => ({
          id: c.id,
          paciente: {
            cedula: c.cedula,
            nombre: c.paciente
          },
          medico: c.medico,
          fecha_hora: c.fecha,
          consultorio: c.consultorio,
          estado: c.estado,
          observaciones: c.observaciones || '',
          fecha_registro: c.fechaRegistro
        })),
        medicos: (data.medicos || []).map(m => ({
          id: m.id,
          nombre: m.nombre,
          especialidad: m.especialidad,
          telefono: m.telefono || '',
          correo: m.correo,
          horario: m.horario,
          fecha_registro: m.fechaRegistro
        })),
        especialidades: (data.especialidades || []).map(e => ({
          id: e.id,
          nombre: e.especialidad,
          descripcion: e.descripcion || '',
          area: e.area || '',
          horario_atencion: e.horario || '',
          medico_responsable: e.responsable || ''
        })),
        facturas: (data.facturas || []).map(f => ({
          id: f.numeroFactura || f.id,
          numero_factura: f.numeroFactura || '',
          paciente: {
            nombre: f.paciente || '',
            cedula: f.cedula || ''
          },
          medico: f.medico || '',
          servicio: f.servicio || '',
          descripcion: f.descripcion || '',
          costo: { valor: f.costo || 0, moneda: 'USD' },
          metodo_pago: f.metodoPago || '',
          fecha_emision: f.fecha || '',
          fecha_registro: f.fechaRegistro || ''
        }))
      }
    };
    
    return JSON.stringify(jsonData, null, 2);
  }
  
  // Descarga de archivos XML
  static downloadXML(data, filename = 'sistema_medico.xml') {
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
  
  // Descarga de archivos JSON
  static downloadJSON(data, filename = 'sistema_medico.json') {
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
  
  // Utilidades de escape y formato
  static escapeXML(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  
  static formatHorario(horario) {
    if (!horario) return 'No especificado';
    if (typeof horario === 'string') return horario;
    try {
      return JSON.stringify(horario);
    } catch {
      return 'No especificado';
    }
  }
}

// Integración con la interfaz de usuario
document.addEventListener('DOMContentLoaded', function() {
  // Agregar botones de exportación en páginas que los necesiten
  const botonesContainer = document.querySelector('.botones');
  
  if (botonesContainer && !document.getElementById('btnExportXML')) {
    // Crear botón XML
    const btnXML = document.createElement('button');
    btnXML.type = 'button';
    btnXML.id = 'btnExportXML';
    btnXML.className = 'btn-secondary';
    btnXML.innerHTML = 'Exportar XML';
    btnXML.onclick = function() {
      if (typeof baseDatos !== 'undefined') {
        const fecha = new Date().toISOString().split('T')[0];
        const success = DataExportService.downloadXML(baseDatos, `sistema_medico_${fecha}.xml`);
        if (success && typeof mostrarMensaje === 'function') {
          mostrarMensaje('Datos exportados en formato XML', 'exito');
        }
      } else {
        alert('No hay datos disponibles para exportar');
      }
    };
    
    // Crear botón JSON
    const btnJSON = document.createElement('button');
    btnJSON.type = 'button';
    btnJSON.id = 'btnExportJSON';
    btnJSON.className = 'btn-secondary';
    btnJSON.innerHTML = 'Exportar JSON';
    btnJSON.onclick = function() {
      if (typeof baseDatos !== 'undefined') {
        const fecha = new Date().toISOString().split('T')[0];
        const success = DataExportService.downloadJSON(baseDatos, `sistema_medico_${fecha}.json`);
        if (success && typeof mostrarMensaje === 'function') {
          mostrarMensaje('Datos exportados en formato JSON', 'exito');
        }
      } else {
        alert('No hay datos disponibles para exportar');
      }
    };
    
    // Agregar botones al contenedor
    botonesContainer.appendChild(btnXML);
    botonesContainer.appendChild(btnJSON);
  }
});

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.DataExportService = DataExportService;
}