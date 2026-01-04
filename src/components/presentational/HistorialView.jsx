import React from 'react';
import '../../css/Historial.css';

function HistorialView({ pacientes, pacienteId, pacienteSeleccionado, onSelectPaciente, citas, facturas, historias = [], form = {}, onFormChange, onGuardarHistoria, onExportHistoriaPDF, onExportHistoriaXML, onExportHistoriaJSON, onEditarHistoria, onEliminarHistoria, onActualizarHistoria, onCancelarEdicion, mensaje = { texto: '', tipo: '' }, errores = [], onVolver }) {
  return (
    <div className="historial-page">
      <div className="header-pagina">Gestión de Historias Clínicas</div>
      <div className="container">
        {mensaje && mensaje.texto && (
          <div className={`mensaje-validacion mostrar ${mensaje.tipo}`} style={{ marginBottom: 12 }}>
            {mensaje.texto}
          </div>
        )}
        {Array.isArray(errores) && errores.length > 0 && (
          <div className="errores-lista" style={{ marginBottom: 12 }}>
            <ul>
              {errores.map((e, i) => <li key={i} style={{ color: '#8b0000' }}>{e}</li>)}
            </ul>
          </div>
        )}
        <div className="boton-retorno"><button onClick={onVolver} className="btn-retorno">← Volver</button></div>

        <h2>Buscar Paciente</h2>
        <label>Seleccione un paciente</label>
        <select value={pacienteId} onChange={(e) => onSelectPaciente(e.target.value)}>
          <option value="">Seleccione...</option>
          {pacientes.map(p => (
            <option key={p.id} value={p.id}>{p.nombres} - {p.cedula}</option>
          ))}
        </select>

        {pacienteSeleccionado && (
          <div className="historial-clinica" style={{ marginTop: '20px' }}>
            <h2>Historia Clínica de {pacienteSeleccionado.nombres}</h2>

            <div className="seccion-historial">
              <h3 className="subtitulo">Datos Generales</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label>Paciente</label>
                  <input type="text" value={pacienteSeleccionado.nombres} readOnly />
                </div>
                <div style={{ width: 220 }}>
                  <label>Última fecha de consulta</label>
                  <input type="date" value={form.ultimaFechaConsulta} readOnly />
                </div>
                <div style={{ width: 220 }}>
                  <label>Médico Responsable</label>
                  <input type="text" value={form.medico} onChange={(e) => onFormChange('medico', e.target.value)} placeholder="Nombre del médico" />
                </div>
                <div style={{ width: 220 }}>
                  <label>Especialidad</label>
                  <input type="text" value={form.especialidad} onChange={(e) => onFormChange('especialidad', e.target.value)} placeholder="Especialidad" />
                </div>
              </div>
            </div>

            <div className="seccion-historial">
              <h3 className="subtitulo">Motivo de Consulta</h3>
              <textarea value={form.motivoConsulta} onChange={(e) => onFormChange('motivoConsulta', e.target.value)} />
            </div>

            <div className="seccion-historial">
              <h3 className="subtitulo">Antecedentes Médicos</h3>
              <textarea value={form.antecedentesMedicos} onChange={(e) => onFormChange('antecedentesMedicos', e.target.value)} placeholder="Enfermedades previas, alergias, operaciones, etc." />

              <h3 className="subtitulo" style={{ marginTop: 12 }}>Antecedentes Familiares</h3>
              <textarea value={form.antecedentesFamiliares} onChange={(e) => onFormChange('antecedentesFamiliares', e.target.value)} placeholder="Patologías hereditarias, enfermedades familiares..." />

              <h3 className="subtitulo" style={{ marginTop: 12 }}>Hábitos</h3>
              <textarea value={form.habitos} onChange={(e) => onFormChange('habitos', e.target.value)} placeholder="Ejemplo: consumo de alcohol, tabaco, actividad física..." />
            </div>

            <div className="seccion-historial">
              <h3 className="subtitulo">Exploración Física y Signos Vitales</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div><label>Peso (kg)</label><input type="number" value={form.peso} onChange={(e) => onFormChange('peso', e.target.value)} /></div>
                <div><label>Estatura (m)</label><input type="number" step="0.01" value={form.estatura} onChange={(e) => onFormChange('estatura', e.target.value)} /></div>
                <div><label>Presión Arterial (mmHg)</label><input type="text" value={form.presionArterial} onChange={(e) => onFormChange('presionArterial', e.target.value)} placeholder="120/80" /></div>
                <div><label>Frecuencia Cardíaca (lpm)</label><input type="number" value={form.frecuenciaCardiaca} onChange={(e) => onFormChange('frecuenciaCardiaca', e.target.value)} /></div>
                <div><label>Frecuencia Respiratoria (rpm)</label><input type="number" value={form.frecuenciaRespiratoria} onChange={(e) => onFormChange('frecuenciaRespiratoria', e.target.value)} /></div>
                <div><label>Temperatura (°C)</label><input type="number" step="0.1" value={form.temperatura} onChange={(e) => onFormChange('temperatura', e.target.value)} /></div>
                <div><label>Saturación de Oxígeno (%)</label><input type="number" value={form.saturacionOxigeno} onChange={(e) => onFormChange('saturacionOxigeno', e.target.value)} /></div>
                <div><label>IMC</label><input type="text" value={form.imc} readOnly /></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label>Observaciones de Examen Físico</label>
                <textarea value={form.observacionesFisicas} onChange={(e) => onFormChange('observacionesFisicas', e.target.value)} placeholder="Descripción general del estado del paciente..." />
              </div>
            </div>

            <div className="seccion-historial">
              <h3 className="subtitulo">Diagnóstico y Tratamiento</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div><label>Diagnóstico Principal</label><input type="text" value={form.diagnosticoPrincipal} onChange={(e) => onFormChange('diagnosticoPrincipal', e.target.value)} /></div>
                <div><label>Diagnóstico Secundario</label><input type="text" value={form.diagnosticoSecundario} onChange={(e) => onFormChange('diagnosticoSecundario', e.target.value)} /></div>
                <div><label>Tratamiento Indicado</label><input type="text" value={form.tratamiento} onChange={(e) => onFormChange('tratamiento', e.target.value)} /></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label>Recomendaciones Médicas</label>
                <textarea value={form.recomendaciones} onChange={(e) => onFormChange('recomendaciones', e.target.value)} placeholder="Cuidados, reposo, controles, alimentación, etc..." />
              </div>
            </div>

            <div className="seccion-historial">
              <h3 className="subtitulo">Exámenes Solicitados</h3>
              <input type="text" value={form.examenesSolicitados} onChange={(e) => onFormChange('examenesSolicitados', e.target.value)} placeholder="Laboratorio, otros..." />

              <h3 className="subtitulo" style={{ marginTop: 12 }}>Próxima Cita / Control</h3>
              <input type="date" value={form.proximaCita} onChange={(e) => onFormChange('proximaCita', e.target.value)} />

              <div style={{ marginTop: 12 }}>
                <label>Observaciones Adicionales</label>
                <textarea value={form.observacionesAdicionales} onChange={(e) => onFormChange('observacionesAdicionales', e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" className="btn-primary" onClick={() => onGuardarHistoria()}>Guardar Historia</button>                <button type="button" className="btn-primary" onClick={() => onActualizarHistoria ? onActualizarHistoria() : onGuardarHistoria()}>Actualizar</button>
                <button type="button" className="btn-secondary" onClick={() => onCancelarEdicion ? onCancelarEdicion() : null}>Cancelar</button>                <button type="button" className="btn-export" onClick={() => onExportHistoriaPDF(historias[historias.length - 1] || form)} title="PDF">Exportar PDF</button>
                <button type="button" className="btn-export" onClick={() => onExportHistoriaXML(historias[historias.length - 1] || form)} title="XML">Exportar XML</button>
                <button type="button" className="btn-export" onClick={() => onExportHistoriaJSON(historias[historias.length - 1] || form)} title="JSON">Exportar JSON</button>
              </div>
            </div>

            <div className="seccion-historial" style={{ marginTop: 18 }}>
              <h3 className="subtitulo">Historias Guardadas</h3>
              {historias.length === 0 ? <p>No hay historias guardadas para este paciente.</p> : (
                <ul style={{ display: 'grid', gap: 8 }}>
                  {historias.map(h => (
                    <li key={h.id} style={{ padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{new Date(h.fechaRegistro).toLocaleString()}</strong>
                          <div style={{ fontSize: 13 }}>{h.motivoConsulta}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn-primary" onClick={() => onEditarHistoria ? onEditarHistoria(h) : null}>Editar</button>
                          <button className="btn-secondary" onClick={() => onEliminarHistoria ? onEliminarHistoria(h.id) : null}>Eliminar</button>
                          <button className="btn-pdf" onClick={() => onExportHistoriaPDF(h)}>PDF</button>
                          <button className="btn-export" onClick={() => onExportHistoriaXML(h)}>XML</button>
                          <button className="btn-export" onClick={() => onExportHistoriaJSON(h)}>JSON</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default HistorialView;