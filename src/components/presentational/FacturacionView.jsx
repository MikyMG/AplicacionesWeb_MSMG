import React from 'react';
import '../../css/Facturacion.css';

function FacturacionView({ pacientes, medicos, facturas, formData, onChange, onSubmit, onReset, onVolver, mensaje, errores = [], onEdit, editingId, onExportFacturaPDF, onExportAllPDF, onExportFacturaXML, onExportAllXML, onExportFacturaJSON, onExportAllJSON }) {
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

      <div className="header-pagina">Gestión de Facturación</div>
      <div className="container">
        <div className="boton-retorno"><button onClick={onVolver} className="btn-retorno">← Volver</button></div>
        <form onSubmit={onSubmit}>
          <h2>Datos del Paciente</h2>
          <label>Paciente</label>
          <select value={formData.pacienteId} onChange={(e) => onChange('pacienteId', e.target.value)}>
            <option value="">Seleccione...</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nombres}</option>
            ))}
          </select>

          <label>Médico</label>
          <select value={formData.medico} onChange={(e) => onChange('medico', e.target.value)}>
            <option value="">Seleccione...</option>
            {medicos.map(m => (
              <option key={m.id} value={m.nombre}>{m.nombre} - {m.especialidad}</option>
            ))}
          </select>

          <label>Servicio</label>
          <input type="text" value={formData.servicio} onChange={(e) => onChange('servicio', e.target.value)} />

          <label>Costo</label>
          <input type="number" value={formData.costo} onChange={(e) => onChange('costo', e.target.value)} />

          <label>Método de Pago</label>
          <select value={formData.metodoPago} onChange={(e) => onChange('metodoPago', e.target.value)}>
            <option value="">Seleccione...</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
          </select>

          <div className="botones">
            <button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</button>
            <button type="reset" onClick={onReset}>Cancelar</button>
            <button type="button" className="btn-export" onClick={onExportAllPDF}>Exportar PDF</button>
            <button type="button" className="btn-export" onClick={onExportAllXML}>Exportar XML</button>
            <button type="button" className="btn-export" onClick={onExportAllJSON}>Exportar JSON</button>
          </div>
        </form>

        <div className="lista-pacientes">
          <h3>Facturas Generadas ({facturas.length})</h3>
          {facturas.length === 0 ? <p>No hay facturas</p> : (
            <div className="pacientes-grid">
              {facturas.slice().reverse().map(f => (
                <div key={f.id} className="paciente-card factura-card">
                  <div className="paciente-info">
                    <h4>{f.numeroFactura}</h4>
                    <p><strong>Paciente:</strong> {f.paciente}</p>
                    <p><strong>Servicio:</strong> {f.servicio}</p>
                    <p><strong>Monto:</strong> ${f.costo.toFixed(2)}</p>
                  </div>
                  <div className="paciente-acciones">
                    <button type="button" onClick={() => onExportFacturaPDF(f)} className="btn-pdf">PDF</button>
                    <button type="button" onClick={() => onExportFacturaXML(f)} className="btn-export">XML</button>
                    <button type="button" onClick={() => onExportFacturaJSON(f)} className="btn-export">JSON</button>
                    <button type="button" onClick={() => onEdit(f)} className="btn-editar" style={{ background: '#10b981', backgroundImage: 'none', color: '#ffffff', border: '1px solid #059669' }} title="Editar factura">Editar</button>
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

export default FacturacionView;