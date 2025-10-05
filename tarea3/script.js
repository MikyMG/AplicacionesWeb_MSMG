// Espera a que el DOM cargue
document.addEventListener("DOMContentLoaded", () => {
  // Obtiene el formulario y la caja de resultados
  const form = document.getElementById("clienteForm");
  const resultado = document.getElementById("resultado");

  // Maneja el envío del formulario
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // Evita que la página se recargue

    // Toma los valores de los campos
    const nombres = document.getElementById("nombres").value;
    const apellidos = document.getElementById("apellidos").value;
    const cedula = document.getElementById("cedula").value;
    const telefono = document.getElementById("telefono").value;
    const direccion = document.getElementById("direccion").value;
    const correo = document.getElementById("correo").value;

    // Mouestra los datos dentro de la caja resultado
    resultado.innerHTML = `
      <h2>Datos del Cliente</h2>
      <p><strong>Nombres:</strong> ${nombres}</p>
      <p><strong>Apellidos:</strong> ${apellidos}</p>
      <p><strong>Cédula:</strong> ${cedula}</p>
      <p><strong>Teléfono:</strong> ${telefono}</p>
      <p><strong>Dirección:</strong> ${direccion}</p>
      <p><strong>Correo:</strong> ${correo}</p>
    `;
  });
});