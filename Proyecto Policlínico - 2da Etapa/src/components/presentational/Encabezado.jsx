import React from 'react';
import logo from '../../assets/images/logo-uleam.png';

export default function Encabezado({ usuario, onLogout, onNavigate }) {
	return (
		<header className="encabezado">
			<div className="encabezado-contenido">
				<img src={logo} alt="Logo ULEAM" className="logo-uleam" />
				<div className="texto-uleam">
					<h1>UNIVERSIDAD LAICA ELOY ALFARO DE MANABÍ</h1>
					<p className="subtitulo">Sistema de Consultas Médicas</p>
					<p className="policlinico">POLICLÍNICO UNIVERSITARIO</p>
				</div>
				<div style={{marginLeft: 'auto'}}>
					{usuario && <div style={{fontWeight:600, color:'#333'}}>{usuario.nombre || usuario.email}</div>}
					{onLogout && (
						<button type="button" onClick={onLogout} className="btn-cerrar-sesion">
							Cerrar sesión
						</button>
					)}
				</div>
			</div>
		</header>
	);
}
