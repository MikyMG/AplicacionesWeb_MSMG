import React from 'react';
import '../../assets/styles/Medicos.css';

function MedicosView({ medicos, formData, onChange, onSubmit, onReset, onVolver, mensaje, errores = [], onEdit, onDelete, editingId, onExportAllPDF, onExportAllXML, onExportAllJSON, onExportMedicoPDF, onExportMedicoXML, onExportMedicoJSON }) {
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

      <div className="header-pagina">Gestión de Médicos</div>
      <div className="container">
        <div className="boton-retorno"><button onClick={onVolver} className="btn-retorno">← Volver</button></div>
        <form onSubmit={onSubmit}>
          <label>Nombre</label>
          <input type="text" value={formData.nombre} onChange={(e) => onChange('nombre', e.target.value)} />
          <label>Especialidad</label>
          <input type="text" value={formData.especialidad} onChange={(e) => onChange('especialidad', e.target.value)} />
          <label>Teléfono</label>
          <input type="text" value={formData.telefono} onChange={(e) => onChange('telefono', e.target.value)} maxLength={10} inputMode="numeric" pattern="\d{10}" />
          <label>Correo</label>
          <input type="email" value={formData.correo} onChange={(e) => onChange('correo', e.target.value)} />
          <div className="botones">
            <button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</button>
            <button type="reset" onClick={onReset}>Cancelar</button>
            <button type="button" className="btn-export" onClick={onExportAllPDF}>Exportar PDF</button>
            <button type="button" className="btn-export" onClick={onExportAllXML}>Exportar XML</button>
            <button type="button" className="btn-export" onClick={onExportAllJSON}>Exportar JSON</button>
          </div>
        </form>
        <div className="lista-pacientes">
          <h3>Médicos Registrados ({medicos.length})</h3>
          {medicos.length === 0 ? <p>No hay médicos registrados</p> : (
            <div className="pacientes-grid">
              {medicos.map(m => (
                <div key={m.id} className="paciente-card">
                  <div className="paciente-info">
                    <h4>{m.nombre}</h4>
                    <p><strong>Especialidad:</strong> {m.especialidad}</p>
                    <p><strong>Correo:</strong> {m.correo}</p>
                  </div>
                  <div className="paciente-acciones">
                    <button type="button" onClick={() => onExportMedicoPDF(m)} className="btn-pdf">PDF</button>
                    <button type="button" onClick={() => onExportMedicoXML(m)} className="btn-export">XML</button>
                    <button type="button" onClick={() => onExportMedicoJSON(m)} className="btn-export">JSON</button>
                    <button type="button" onClick={() => onEdit(m)} className="btn-editar" style={{ background: '#10b981', backgroundImage: 'none', color: '#ffffff', border: '1px solid #059669' }} title="Editar médico">Editar</button>
                    <button onClick={() => onDelete(m.id)} className="btn-eliminar">Eliminar</button>
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

export default MedicosView;