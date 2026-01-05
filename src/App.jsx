import React, { useState, useEffect } from 'react';
import './css/App.css';
import Login from './components/containers/LoginContainer';
import ResetPassword from './components/containers/ResetPasswordContainer';
import useLocalStorage from './hooks/useLocalStorage';
import Dashboard from './components/containers/Dashboard';
import Encabezado from './components/Encabezado';
import Pacientes from './components/containers/PacientesContainer';
import Citas from './components/containers/CitasContainer';
import Medicos from './components/containers/MedicosContainer';
import Especialidades from './components/containers/EspecialidadesContainer';
import Facturacion from './components/containers/FacturacionContainer';
import Reportes from './components/containers/ReportesContainer';
import Historial from './components/containers/HistorialContainer';

function App() {
  const [usuarioActivo, setUsuarioActivo] = useLocalStorage('sesionUsuario', null);
  const [paginaActual, setPaginaActual] = useState('dashboard');
  const [baseDatos, setBaseDatos] = useLocalStorage('policlinico_datos', {
    pacientes: [],
    citas: [],
    medicos: [],
    especialidades: [],
    facturas: [],
    historias: []
  });

  const handleLogin = (usuario) => {
    setUsuarioActivo(usuario);
    localStorage.setItem('sesionUsuario', JSON.stringify(usuario));
    setPaginaActual('dashboard');
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      setUsuarioActivo(null);
      localStorage.removeItem('sesionUsuario');
      setPaginaActual('dashboard');
    }
  };

  const actualizarDatos = (tipo, nuevosDatos) => {
    setBaseDatos(prev => ({
      ...prev,
      [tipo]: nuevosDatos
    }));
  };

  const puedeAcceder = (rolTexto, pagina) => {
    const permisos = {
      Administrador: ['dashboard','pacientes','citas','historial','medicos','especialidades','facturacion','reportes'],
      Médico: ['dashboard','pacientes','historial'],
      Enfermera: ['dashboard','pacientes','citas','historial','reportes']
    };
    const allowed = permisos[rolTexto] || [];
    return allowed.includes(pagina);
  };

  // si por alguna vía se solicita una página no permitida, mostrar aviso temporal y volver al dashboard
  useEffect(() => {
    // detectar si la URL incluye parámetros de restablecimiento y abrir la página correspondiente
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('resetToken') || params.get('token');
      if (t && !usuarioActivo) {
        setPaginaActual('reset-password');
        return; // no necesitamos comprobar permisos en este escenario
      }
    } catch (err) {
      // noop
    }

    // proteger cuando no hay usuario aún
    if (!usuarioActivo) return;
    if (!puedeAcceder(usuarioActivo.rol, paginaActual)) {
      // mostrar aviso temporal en el encabezado
      const aviso = document.createElement('div');
      aviso.className = 'aviso-acceso-denegado';
      aviso.textContent = 'Acceso no permitido para su rol. Se ha redirido al tablero.';
      aviso.style.position = 'fixed';
      aviso.style.top = '12px';
      aviso.style.right = '12px';
      aviso.style.background = '#f8d7da';
      aviso.style.color = '#842029';
      aviso.style.padding = '10px 14px';
      aviso.style.borderRadius = '6px';
      aviso.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      document.body.appendChild(aviso);
      setTimeout(() => { aviso.remove(); }, 2500);

      setPaginaActual('dashboard');
    }
  }, [paginaActual, usuarioActivo]);

  if (!usuarioActivo) {
    if (paginaActual === 'reset-password') {
      return (
        <div className="App">
          <ResetPassword onVolver={() => setPaginaActual('login')} />
        </div>
      );
    }

    return (
      <div className="App">
        <Login onLogin={handleLogin} onGoToResetPage={() => setPaginaActual('reset-password')} />
      </div>
    );
  }

  return (
    <div className="App">
      <Encabezado />
      {paginaActual === 'dashboard' && (
        <Dashboard 
          baseDatos={baseDatos}
          usuario={usuarioActivo}
          onNavigate={setPaginaActual}
          onLogout={handleLogout}
        />
      )}
      {paginaActual === 'pacientes' && (
        <Pacientes 
          baseDatos={baseDatos}
          onActualizar={(datos) => actualizarDatos('pacientes', datos)}
          onVolver={() => setPaginaActual('dashboard')}
        />
      )}
      {paginaActual === 'citas' && (
        <Citas 
          baseDatos={baseDatos}
          onActualizar={(datos) => actualizarDatos('citas', datos)}
          onVolver={() => setPaginaActual('dashboard')}
        />
      )}
      {paginaActual === 'medicos' && (
        <Medicos 
          baseDatos={baseDatos}
          onActualizar={(datos) => actualizarDatos('medicos', datos)}
          onVolver={() => setPaginaActual('dashboard')}
        />
      )}
      {paginaActual === 'especialidades' && (
        <Especialidades 
          baseDatos={baseDatos}
          onActualizar={(datos) => actualizarDatos('especialidades', datos)}
          onVolver={() => setPaginaActual('dashboard')}
        />
      )}
      {paginaActual === 'facturacion' && (
        <Facturacion 
          baseDatos={baseDatos}
          onActualizar={(datos) => actualizarDatos('facturas', datos)}
          onVolver={() => setPaginaActual('dashboard')}
        />
      )}
      {paginaActual === 'reportes' && (
        <Reportes 
          baseDatos={baseDatos}
          onActualizar={(tipo, datos) => actualizarDatos(tipo, datos)}
          onVolver={() => setPaginaActual('dashboard')}
        />
      )}
      {paginaActual === 'historial' && (
        <Historial 
          baseDatos={baseDatos}
          onActualizar={(tipo, datos) => actualizarDatos(tipo, datos)}
          onVolver={() => setPaginaActual('dashboard')}
        />
      )}
    </div>
  );
}

export default App;