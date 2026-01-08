import React from 'react';
import '../../assets/styles/Citas.css';

function CitasView({ pacientes, medicos, citas, formData, onChange, onSubmit, onReset, onDelete, onVolver, mensaje, errores = [], onEdit, editingId, onExportCitaPDF, onExportAllPDF, onExportCitaXML, onExportAllXML, onExportCitaJSON, onExportAllJSON }) {
  return (
    <div>
      {mensaje.texto && (
        <div className={`mensaje-validacion mostrar ${mensaje.tipo}`}>
          <span className="mensaje-texto">{mensaje.texto}</span>
        </div>
      )}
      {Array.isArray(errores) && errores.length > 0 && (
        <div className="errores-lista" style={{ marginBottom: 12 }}>
          <ul>
            {errores.map((e, i) => <li key={i} style={{ color: '#8b0000' }}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="header-pagina">Gestión de Citas Médicas</div>

      <div className="container">
        <div className="boton-retorno">
          <button onClick={onVolver} className="btn-retorno">← Volver</button>
        </div>

        <form onSubmit={onSubmit}>
          <label>Nombre del Paciente</label>
          <select value={formData.pacienteId} onChange={(e) => onChange('pacienteId', e.target.value)}>
            <option value="">Seleccione un paciente</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nombres}</option>
            ))}
          </select>

          <label>Cédula del Paciente</label>
          <input type="text" name="cedula" value={formData.cedula || ''} readOnly placeholder="Número de cédula" />

          <label>Especialidad</label>
          <select value={formData.especialidad || ''} onChange={(e) => onChange('especialidad', e.target.value)}>
            <option value="">Seleccione especialidad</option>
            {Array.from(new Set(medicos.map(m => m.especialidad))).map(es => (
              <option key={es} value={es}>{es}</option>
            ))}
          </select>

          <label>Seleccione Médico Especialista</label>
          <select value={formData.medicoNombre} onChange={(e) => onChange('medicoNombre', e.target.value)}>
            <option value="">Seleccione un médico</option>
            {medicos.filter(m => !formData.especialidad || m.especialidad === formData.especialidad).map(m => (
              <option key={m.id} value={m.nombre}>{m.nombre}</option>
            ))}
          </select>

          <label>Fecha y Hora <small style={{fontSize:12, color:'#666'}}></small></label>
          <input type="datetime-local" value={formData.fecha} onChange={(e) => onChange('fecha', e.target.value)} />

          <label>Consultorio Asignado</label>
          <input type="text" value={formData.consultorio} onChange={(e) => onChange('consultorio', e.target.value)} placeholder="Ejemplo: Consultorio 3, Planta Alta" />

          <label>Estado</label>
          <select value={formData.estado} onChange={(e) => onChange('estado', e.target.value)}>
            <option value="">Seleccione estado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Atendida">Atendida</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          <label>Observaciones</label>
          <textarea value={formData.observaciones} onChange={(e) => onChange('observaciones', e.target.value)} placeholder="Notas adicionales..." />

          <div className="botones">
            <button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</button>
            <button type="reset" onClick={onReset}>Cancelar</button>
            <button type="button" className="btn-export" onClick={onExportAllPDF}>Exportar PDF</button>
            <button type="button" className="btn-export" onClick={onExportAllXML}>Exportar XML</button>
            <button type="button" className="btn-export" onClick={onExportAllJSON}>Exportar JSON</button>
          </div>
        </form>

        <div className="lista-pacientes">
          <h3>Citas Registradas ({citas.length})</h3>
          {citas.length === 0 ? (
            <p>No hay citas registradas</p>
          ) : (
            <div className="pacientes-grid">
              {citas.map(c => (
                <div key={c.id} className="paciente-card">
                  <div className="paciente-info">
                    <h4>{c.paciente}</h4>
                    <p><strong>Cédula:</strong> {c.cedula}</p>
                    <p><strong>Médico:</strong> {c.medico} {c.especialidad ? `(${c.especialidad})` : ''}</p>
                    <p><strong>Fecha:</strong> {c.fecha ? new Date(c.fecha).toLocaleString() : ''}</p>
                    <p><strong>Estado:</strong> {c.estado}</p>
                    <p><strong>Consultorio:</strong> {c.consultorio}</p>
                    {c.observaciones && <p><strong>Observaciones:</strong> {c.observaciones}</p>}
                  </div>
                  <div className="paciente-acciones">
                    <button type="button" onClick={() => onExportCitaPDF(c)} className="btn-pdf">PDF</button>
                    <button type="button" onClick={() => onExportCitaXML(c)} className="btn-export">XML</button>
                    <button type="button" onClick={() => onExportCitaJSON(c)} className="btn-export">JSON</button>
                    <button type="button" onClick={() => onEdit(c)} className="btn-editar" style={{ background: '#10b981', backgroundImage: 'none', color: '#ffffff', border: '1px solid #059669' }} title="Editar cita">Editar</button>
                    <button onClick={() => onDelete(c.id)} className="btn-eliminar">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CitasView;