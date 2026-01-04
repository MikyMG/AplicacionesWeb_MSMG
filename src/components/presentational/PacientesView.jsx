import React from 'react';
import '../../css/Pacientes.css';
import { clasificarIMC } from '../../services/validators';

function PacientesView({ pacientes, formData, onChange, onSubmit, onReset, onDelete, onVolver, mensaje, errores = [], onExportPacientePDF, onExportAllPDF, onExportPacienteJSON, onExportAllJSON, onExportPacienteXML, onExportAllXML, onEdit, editingId }) {
  return (
    <div className="pacientes-page">
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
      
      <div className="header-pagina">Gestión de Pacientes</div>
      
      <div className="container">
        <div className="boton-retorno">
          <button onClick={onVolver} className="btn-retorno">← Volver</button>
        </div>

        <form onSubmit={onSubmit}>
          <h2>Datos Personales</h2>
          
          <label>Nombres y Apellidos</label>
          <input type="text" name="nombres" value={formData.nombres} onChange={(e) => onChange('nombres', e.target.value)} placeholder="Nombres y Apellidos" />
          
          <label>Cédula</label>
          <input type="text" name="cedula" value={formData.cedula} onChange={(e) => onChange('cedula', e.target.value)} placeholder="Cédula" maxLength={10} inputMode="numeric" pattern="\d{10}" />
          
          <label>Fecha de Nacimiento <small style={{fontSize:12, color:'#666'}}></small></label>
          <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={(e) => onChange('fechaNacimiento', e.target.value)} />
          
          <label>Edad</label>
          <input type="text" name="edad" value={formData.edad ? `${formData.edad} años` : ''} readOnly />
          
          <label>Sexo</label>
          <select name="sexo" value={formData.sexo} onChange={(e) => onChange('sexo', e.target.value)}>
            <option value="">Seleccione...</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
          
          <label>Estado Civil</label>
          <select name="estadoCivil" value={formData.estadoCivil} onChange={(e) => onChange('estadoCivil', e.target.value)}>
            <option value="">Seleccione...</option>
            <option value="Soltero(a)">Soltero(a)</option>
            <option value="Casado(a)">Casado(a)</option>
            <option value="Divorciado(a)">Divorciado(a)</option>
            <option value="Viudo(a)">Viudo(a)</option>
          </select>

          <label>Tipo de Sangre</label>
          <select name="tipoSangre" value={formData.tipoSangre} onChange={(e) => onChange('tipoSangre', e.target.value)}>
            <option value="">Seleccione...</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>

          <label>Nacionalidad</label>
          <select name="nacionalidad" value={formData.nacionalidad} onChange={(e) => onChange('nacionalidad', e.target.value)}>
            <option value="">Seleccione...</option>
            <option value="Ecuatoriana">Ecuatoriana</option>
            <option value="Otra">Otra</option>
          </select>

          <label>Lugar de Nacimiento</label>
          <input type="text" name="lugarNacimiento" value={formData.lugarNacimiento} onChange={(e) => onChange('lugarNacimiento', e.target.value)} placeholder="Ciudad, País" />

          <label>Ocupación</label>
          <select name="ocupacion" value={formData.ocupacion} onChange={(e) => onChange('ocupacion', e.target.value)}>
            <option value="">Seleccione...</option>
            <option value="Estudiante">Estudiante</option>
            <option value="Empleado">Empleado</option>
            <option value="Independiente">Independiente</option>
            <option value="Otro">Otro</option>
          </select>

          <h2>Datos de Contacto</h2>

          <label>Dirección Domiciliaria</label>
          <input type="text" name="direccion" value={formData.direccion} onChange={(e) => onChange('direccion', e.target.value)} placeholder="Dirección completa" />

          <label>Ciudad</label>
          <select name="ciudad" value={formData.ciudad} onChange={(e) => onChange('ciudad', e.target.value)}>
            <option value="">Seleccione...</option>
            <option value="Portoviejo">Portoviejo</option>
            <option value="Manta">Manta</option>
            <option value="Quito">Quito</option>
            <option value="Otro">Otro</option>
          </select>

          <label>Provincia</label>
          <select name="provincia" value={formData.provincia} onChange={(e) => onChange('provincia', e.target.value)}>
            <option value="">Seleccione...</option>
            <option value="Manabí">Manabí</option>
            <option value="Pichincha">Pichincha</option>
            <option value="Guayas">Guayas</option>
            <option value="Otro">Otra</option>
          </select>

          <label>Teléfono Celular</label>
          <input type="text" name="telefono" value={formData.telefono} onChange={(e) => onChange('telefono', e.target.value)} placeholder="Ej: 09xxxxxxxx" maxLength={10} inputMode="numeric" pattern="\d{10}" />
          
          <label>Correo Electrónico</label>
          <input type="email" name="email" value={formData.email} onChange={(e) => onChange('email', e.target.value)} placeholder="correo@ejemplo.com" />

          <h2>Datos Médicos del Paciente</h2>
          
          <label>Peso (kg)</label>
          <input type="number" name="peso" step="0.1" value={formData.peso} onChange={(e) => onChange('peso', e.target.value)} placeholder="kg" />
          
          <label>Estatura (m)</label>
          <input type="number" name="estatura" step="0.01" value={formData.estatura} onChange={(e) => onChange('estatura', e.target.value)} placeholder="m" />
          
          <label>IMC (Índice de Masa Corporal)</label>
          {(() => {
            const info = clasificarIMC(formData.imc);
            const display = formData.imc ? `${formData.imc}${info && info.label ? ' - ' + info.label : ''}` : '';
            return <input type="text" name="imc" value={display} readOnly placeholder="IMC" title={display} />;
          })()}
          {formData.imc && (() => {
            const info = clasificarIMC(formData.imc);
            return null;
          })()} 
          
          <label>Alergias</label>
          <input type="text" name="alergias" value={formData.alergias} onChange={(e) => onChange('alergias', e.target.value)} placeholder="Ejemplo: Penicilina, mariscos, polen..." />

          <label>Enfermedades Crónicas</label>
          <input type="text" name="enfermedades" value={formData.enfermedades} onChange={(e) => onChange('enfermedades', e.target.value)} placeholder="Ejemplo: Diabetes, hipertensión..." />

          <label>Tratamientos Actuales</label>
          <input type="text" name="tratamientos" value={formData.tratamientos} onChange={(e) => onChange('tratamientos', e.target.value)} placeholder="Medicamentos o terapias que recibe actualmente..." />

          <label>Observaciones Generales</label>
          <textarea name="observaciones" value={formData.observaciones} onChange={(e) => onChange('observaciones', e.target.value)} placeholder="Observaciones generales"></textarea>

          <div className="botones">
            <button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</button>
            <button type="reset" onClick={onReset}>Cancelar</button>
            <button type="button" className="btn-export" onClick={onExportAllPDF}>Exportar PDF</button>
            <button type="button" className="btn-export" onClick={onExportAllXML}>Exportar XML</button>
            <button type="button" className="btn-export" onClick={onExportAllJSON}>Exportar JSON</button>
          </div>
        </form>
        
        <div className="lista-pacientes">
          <h3>Pacientes Registrados ({pacientes.length})</h3>
          {pacientes.length === 0 ? (
            <p>No hay pacientes registrados</p>
          ) : (
            <div className="pacientes-grid">
              {pacientes.map(p => (
                <div key={p.id} className="paciente-card">
                  <div className="paciente-info">
                    <h4>{p.nombres}</h4>
                    <p><strong>Cédula:</strong> {p.cedula}</p>
                    <p><strong>Edad:</strong> {p.edad ? `${p.edad} años` : ''}</p>
                  </div>
                  <div className="paciente-acciones">
                    <button type="button" onClick={() => onExportPacientePDF(p)} className="btn-pdf">PDF</button>
                    <button type="button" onClick={() => onExportPacienteXML(p)} className="btn-export">XML</button>
                    <button type="button" onClick={() => onExportPacienteJSON(p)} className="btn-export">JSON</button>
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="btn-editar"
                      style={{ background: '#10b91eff', backgroundImage: 'none', WebkitAppearance: 'none', appearance: 'none', color: '#ffffff', border: '1px solid #1cd025ff', opacity: 1 }}
                      title="Editar paciente"
                    >Editar</button>
                    <button onClick={() => onDelete(p.id)} className="btn-eliminar">Eliminar</button>
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

export default PacientesView;