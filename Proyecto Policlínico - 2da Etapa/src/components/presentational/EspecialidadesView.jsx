import React from 'react';
import '../../assets/styles/Especialidades.css';

function EspecialidadesView({ especialidades, formData, onChange, onSubmit, onReset, onDelete, onVolver, mensaje, errores = [], onEdit, editingId, onExportEspecialidadPDF, onExportAllPDF, onExportEspecialidadXML, onExportAllXML, onExportEspecialidadJSON, onExportAllJSON }) {
  return (
    <div>
      {mensaje.texto && <div className={`mensaje-validacion mostrar ${mensaje.tipo}`}><span className="mensaje-texto">{mensaje.texto}</span></div>}
      {Array.isArray(errores) && errores.length > 0 && (
        <div className="errores-lista" style={{ marginBottom: 12 }}>
          <ul>
            {errores.map((e, i) => <li key={i} style={{ color: '#8b0000' }}>{e}</li>)}
          </ul>
        </div>
      )}
      <div className="container">
        <div className="boton-retorno"><button onClick={onVolver} className="btn-retorno">← Volver</button></div>
        <form onSubmit={onSubmit}>
          <label>Especialidad</label>
          <select value={formData.especialidad} onChange={(e) => onChange('especialidad', e.target.value)}>
            <option value="">Seleccione...</option>
            <option>Medicina General</option>
            <option>Pediatría</option>
            <option>Ginecología</option>
            <option>Cardiología</option>
            <option>Dermatología</option>
            <option>Neurología</option>
            <option>Oftalmología</option>
            <option>Traumatología</option>
          </select>

          <label>Descripción</label>
          <input type="text" value={formData.descripcion} onChange={(e) => onChange('descripcion', e.target.value)} />

          <label>Responsable</label>
          <input type="text" value={formData.responsable} onChange={(e) => onChange('responsable', e.target.value)} />

          <div className="botones">
            <button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</button>
            <button type="reset" onClick={onReset}>Cancelar</button>
            <button type="button" className="btn-export" onClick={onExportAllPDF}>Exportar PDF</button>
            <button type="button" className="btn-export" onClick={onExportAllXML}>Exportar XML</button>
            <button type="button" className="btn-export" onClick={onExportAllJSON}>Exportar JSON</button>
          </div>
        </form>

        <div className="lista-pacientes">
          <h3>Especialidades Registradas ({especialidades.length})</h3>
          {especialidades.length === 0 ? <p>No hay especialidades registradas</p> : (
            <div className="pacientes-grid">
              {especialidades.map(e => (
                <div key={e.id} className="paciente-card especialidad-card">
                  <div className="paciente-info">
                    <h4>{e.especialidad}</h4>
                    <p>{e.descripcion}</p>
                    <p><strong>Responsable:</strong> {e.responsable}</p>
                  </div>
                  <div className="paciente-acciones">
                    <button type="button" onClick={() => onExportEspecialidadPDF(e)} className="btn-pdf">PDF</button>
                    <button type="button" onClick={() => onExportEspecialidadXML(e)} className="btn-export">XML</button>
                    <button type="button" onClick={() => onExportEspecialidadJSON(e)} className="btn-export">JSON</button>
                    <button type="button" onClick={() => onEdit(e)} className="btn-editar" style={{ background: '#10b981', backgroundImage: 'none', color: '#ffffff', border: '1px solid #059669' }} title="Editar especialidad">Editar</button>
                    <button onClick={() => onDelete(e.id)} className="btn-eliminar">Eliminar</button>
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

export default EspecialidadesView;