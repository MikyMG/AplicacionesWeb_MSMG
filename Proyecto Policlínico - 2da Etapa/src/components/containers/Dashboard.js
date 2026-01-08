import React from 'react';
import '../../assets/styles/Dashboard.css';
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

          
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
