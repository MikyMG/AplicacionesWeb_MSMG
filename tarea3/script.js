// Espera a que el DOM cargue
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("clienteForm");
  const resultado = document.getElementById("resultado");

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // Evita recarga de página

    // Toma los valores de los campos
    const nombres = document.getElementById("nombres").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const cedula = document.getElementById("cedula").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const correo = document.getElementById("correo").value.trim();

    // Validaciones
    const errores = [];

    if (!nombres) errores.push("El campo 'Nombres' es obligatorio.");
    if (!apellidos) errores.push("El campo 'Apellidos' es obligatorio.");
    if (!cedula || !/^\d{10}$/.test(cedula)) {
      errores.push("La 'Cédula' debe contener solo números (10 dígitos).");
    }
    if (!telefono || !/^\d{10}$/.test(telefono)) {
      errores.push("El 'Teléfono' debe contener solo números (10 dígitos).");
    }
    if (!direccion) errores.push("El campo 'Dirección' es obligatorio.");
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      errores.push("El 'Correo' no es válido.");
    }

    // Mostrar errores o resultado
    if (errores.length > 0) {
      resultado.innerHTML = `
        <div style="color: red;">
          <h3>Errores encontrados:</h3>
          <ul>
            ${errores.map(error => `<li>${error}</li>`).join("")}
          </ul>
        </div>
      `;
    } else {
      resultado.innerHTML = `
        <h2>Datos del Cliente</h2>
        <p><strong>Nombres:</strong> ${nombres}</p>
        <p><strong>Apellidos:</strong> ${apellidos}</p>
        <p><strong>Cédula:</strong> ${cedula}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        <p><strong>Dirección:</strong> ${direccion}</p>
        <p><strong>Correo:</strong> ${correo}</p>
      `;
    }
  });
});
