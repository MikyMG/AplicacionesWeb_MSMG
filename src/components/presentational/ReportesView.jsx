import React, { useState } from 'react';
import '../../css/Reportes.css';

function ReportesView({ pacientes, filtros, onChange, onSubmit, onReset, resultados, onVolver, onEditFromReport, mensaje, errores = [], onExportItemPDF, onExportItemXML, onExportItemJSON }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTipo, setModalTipo] = useState('');

  const openModal = (tipo, registro) => {
    setModalTipo(tipo);
    setModalContent(JSON.stringify(registro, null, 2));
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setModalContent(''); setModalTipo(''); };

  const saveModal = () => {
    try {
      const parsed = JSON.parse(modalContent);
      onEditFromReport(modalTipo, parsed);
      closeModal();
    } catch (e) {
      alert('JSON inválido: ' + e.message);
    }
  };

  return (
    <div>
      <div className="header-pagina">Reportes</div>
      {mensaje && mensaje.texto && <div className={`mensaje-validacion mostrar ${mensaje.tipo}`}><span className="mensaje-texto">{mensaje.texto}</span></div>}
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
          <label>Buscar por paciente</label>
          <select value={filtros.pacienteId} onChange={(e) => onChange('pacienteId', e.target.value)}>
            <option value="">Todos los pacientes</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nombres}</option>
            ))}
          </select>
          
          <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
            <div style={{ flex: 1 }}>
              <label>Desde</label>
              <input type="date" value={filtros.fechaInicio} onChange={(e) => onChange('fechaInicio', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Hasta</label>
              <input type="date" value={filtros.fechaFin} onChange={(e) => onChange('fechaFin', e.target.value)} />
            </div>
          </div>
          
          <div className="botones">
            <button type="submit">Filtrar</button>
            <button type="reset" onClick={onReset}>Limpiar</button>
          </div>
        </form>
        
        <div className="lista-pacientes">
          <h3>Resultados ({resultados.length})</h3>
          {resultados.length === 0 ? <p>No hay resultados. Use los filtros para buscar.</p> : (
            <div className="pacientes-grid">
              {resultados.map((r, idx) => (
                <div key={idx} className="paciente-card resultado-card">
                  <div className="paciente-info">
                    <span className={`resultado-tipo ${r.tipo.toLowerCase()}`}>{r.tipo}</span>
                    <h4>{r.nombres || r.paciente || r.nombre || r.numeroFactura}</h4>
                    {r.cedula && <p><strong>Cédula:</strong> {r.cedula}</p>}
                    {r.especialidad && <p><strong>Especialidad:</strong> {r.especialidad}</p>}
                    {r.servicio && <p><strong>Servicio:</strong> {r.servicio}</p>}
                    {r.costo && <p><strong>Monto:</strong> ${r.costo.toFixed(2)}</p>}
                    {r.fecha && <p><strong>Fecha:</strong> {new Date(r.fecha).toLocaleDateString()}</p>}
                    {r.estado && <p><strong>Estado:</strong> {r.estado}</p>}
                  </div>
                  <div className="paciente-acciones">
                    <button type="button" className="btn-editar" style={{ background: '#10b981', backgroundImage: 'none', color: '#ffffff', border: '1px solid #059669' }} onClick={() => openModal(r.tipo, r)} title="Editar desde reportes">Editar</button>
                    <button type="button" className="btn-pdf" onClick={() => (typeof onExportItemPDF === 'function') ? onExportItemPDF(r) : alert('Exportador PDF no disponible')} title="PDF">PDF</button>
                    <button type="button" className="btn-export" onClick={() => (typeof onExportItemXML === 'function') ? onExportItemXML(r) : alert('Exportador XML no disponible')} title="XML">XML</button>
                    <button type="button" className="btn-export" onClick={() => (typeof onExportItemJSON === 'function') ? onExportItemJSON(r) : alert('Exportador JSON no disponible')} title="JSON">JSON</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Editar registro: {modalTipo}</h3>
            <textarea value={modalContent} onChange={(e) => setModalContent(e.target.value)} style={{ width: '100%', height: 260, fontFamily: 'monospace', fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={closeModal} className="btn-secondary">Cancelar</button>
              <button onClick={saveModal} className="btn-primary">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ReportesView;