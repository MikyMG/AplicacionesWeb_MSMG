import React, { useState } from 'react';
import '../../css/Dashboard.css';
import useCharts from '../../hooks/useCharts';

function Dashboard({ baseDatos, usuario, onNavigate, onLogout }) {
  const { barChartRef, pieChartRef } = useCharts(baseDatos);


  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return '¡Buenos días! ☀️';
    if (hora >= 12 && hora < 18) return '¡Buenas tardes! 🌤️';
    return '¡Buenas noches! 🌙';
  };

  return (
    <div className="dashboard">

      <div className="main-container">
        <aside className="sidebar">
          <h2>Menú Principal</h2>
          <nav>
            <ul>
              {(() => {
                // definir permisos por rol
                const rol = (usuario && usuario.rol) || '';
                const permisos = {
                  Administrador: ['pacientes','citas','historial','medicos','especialidades','facturacion','reportes'],
                  Médico: ['pacientes','historial'],
                  Enfermera: ['pacientes','citas','historial','reportes']
                };
                const allowed = permisos[rol] || [];

                const items = [
                  { key: 'pacientes', label: 'Pacientes' },
                  { key: 'citas', label: 'Citas Médicas' },
                  { key: 'historial', label: 'Historia Clínica' },
                  { key: 'medicos', label: 'Médicos' },
                  { key: 'especialidades', label: 'Especialidades Médicas' },
                  { key: 'facturacion', label: 'Facturación' },
                  { key: 'reportes', label: 'Reportes' }
                ];

                return items.filter(it => allowed.includes(it.key)).map(it => (
                  <li key={it.key}><button onClick={() => onNavigate(it.key)}>{it.label}</button></li>
                ));
              })()}

              <li><button onClick={onLogout} className="logout">Cerrar Sesión</button></li>
            </ul>
          </nav>
        </aside>

        <main className="content">
          <h1>
            {getSaludo()} <span style={{ color: '#c10e1a' }}>{usuario.rol}</span>
          </h1>

          <div className="cards">
            <div className="card">
              <h3>{baseDatos.pacientes.length}</h3>
              <p>Pacientes</p>
            </div>
            <div className="card">
              <h3>{baseDatos.medicos.length}</h3>
              <p>Médicos</p>
            </div>
            <div className="card">
              <h3>{baseDatos.citas.length}</h3>
              <p>Citas</p>
            </div>
            <div className="card">
              <h3>{baseDatos.especialidades.length}</h3>
              <p>Especialidades</p>
            </div>
          </div>

          <section className="charts">
            <div className="chart-box">
              <h3>Citas por Semana</h3>
              <canvas ref={barChartRef}></canvas>
            </div>
            <div className="chart-box">
              <h3>Distribución de Especialidades</h3>
              <canvas ref={pieChartRef}></canvas>
            </div>
          </section>

          <section className="storage-inspector" style={{ marginTop: 20 }}>
            <h3>Datos guardados (localStorage)</h3>
            <StorageInspector />
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

function StorageInspector() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState([]);

  const toggle = () => {
    if (!visible) {
      const arr = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          try {
            const val = JSON.parse(localStorage.getItem(key));
            arr.push({ key, value: val });
          } catch (e) {
            arr.push({ key, value: localStorage.getItem(key) });
          }
        }
      } catch (err) {
        // noop
      }
      setData(arr);
    }
    setVisible(!visible);
  };

  return (
    <div>
      <button onClick={toggle} className="btn">{visible ? 'Ocultar datos guardados' : 'Mostrar datos guardados'}</button>
      {visible && (
        <div style={{ marginTop: 12, maxHeight: 240, overflow: 'auto', background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #e6e6e6' }}>
          {data.length === 0 && <div>No hay entradas en localStorage</div>}
          {data.map(d => (
            <div key={d.key} style={{ marginBottom: 8 }}>
              <strong>{d.key}:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '6px 0' }}>{JSON.stringify(d.value, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}