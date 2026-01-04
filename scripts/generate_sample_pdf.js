const fs = require('fs');
const { jsPDF } = require('jspdf');

// Datos de ejemplo (si no hay pacientes en localStorage)
const pacienteEjemplo = {
  nombres: 'Juan Pérez',
  cedula: '0102030405',
  edad: '34',
  sexo: 'M',
  tipoSangre: 'O+',
  email: 'juan.perez@ejemplo.com',
  telefono: '+593 9 8765 4321',
  direccion: 'Av. Universidad 123, Portoviejo',
  observaciones: 'Paciente con historial de alergias leves. Control recomendado cada 6 meses.'
};

function rgb(arr) { return { r: arr[0], g: arr[1], b: arr[2] }; }

function createPdf(p) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const primario = [193, 14, 26]; // #c10e1a
  const cajaBg = [245, 245, 245];

  // Encabezado más alto y caja para logo (logo a la izquierda)
  const headerH = 82;
  doc.setFillColor(...primario);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), headerH, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Ficha del paciente', doc.internal.pageSize.getWidth() / 2, headerH / 2 + 6, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // intentar cargar logo local (solo en script si existe)
  let logoData = null;
  try {
    const logoPath = require('path').resolve(__dirname, '..', 'src', 'assets', 'logo-uleam.png');
    if (require('fs').existsSync(logoPath)) {
      const data = require('fs').readFileSync(logoPath);
      logoData = 'data:image/png;base64,' + data.toString('base64');
    }
  } catch (e) { logoData = null; }

  if (logoData) {
    const logoBoxW = 72;
    const logoBoxH = 48;
    const logoX = 40; // izquierda
    const logoY = 12;
    doc.setFillColor(255,255,255);
    doc.setDrawColor(...primario);
    if (typeof doc.roundedRect === 'function') {
      doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 6, 6, 'FD');
    } else { doc.rect(logoX, logoY, logoBoxW, logoBoxH, 'FD'); }
    try { doc.addImage(logoData, 'PNG', logoX + 8, logoY + 6, logoBoxW - 16, logoBoxH - 12); } catch (err) {}
  }

  let y = headerH + 18;
  const left = 40;
  const width = doc.internal.pageSize.getWidth() - left * 2;

  // tarjeta con más padding
  const cardH = 160;
  doc.setFillColor(...cajaBg);
  doc.setDrawColor(...primario);
  if (typeof doc.roundedRect === 'function') { doc.roundedRect(left, y, width, cardH, 6,6,'FD'); } else { doc.rect(left, y, width, cardH, 'FD'); }

  doc.setTextColor(...primario);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(p.nombres || '—', left + 16, y + 36);

  doc.setFontSize(10);
  doc.setTextColor(0,0,0);
  doc.setFont('helvetica', 'normal');

  const col1X = left + 16;
  const col2X = left + Math.floor(width / 2) + 8;
  const labelOffset = 90;
  let rowY = y + 56;
  const rowGap = 22;

  const rowsLeft = [ ['Cédula', p.cedula || ''], ['Sexo', p.sexo || ''], ['Email', p.email || ''], ['Dirección', p.direccion || ''] ];
  const rowsRight = [ ['Edad', p.edad || ''], ['Tipo de Sangre', p.tipoSangre || ''], ['Teléfono', p.telefono || ''] ];

  rowsLeft.forEach(([label, val], i) => {
    const ry = rowY + i * rowGap;
    doc.setTextColor(...primario);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${label}:`, col1X, ry);

    doc.setTextColor(0,0,0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const valueLines = doc.splitTextToSize(String(val || '—'), Math.floor(width / 2) - labelOffset - 20);
    doc.text(valueLines, col1X + labelOffset, ry);
  });

  rowsRight.forEach(([label, val], i) => {
    const ry = rowY + i * rowGap;
    doc.setTextColor(...primario);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${label}:`, col2X, ry);

    doc.setTextColor(0,0,0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const valueLines = doc.splitTextToSize(String(val || '—'), Math.floor(width / 2) - labelOffset - 20);
    doc.text(valueLines, col2X + labelOffset, ry);
  });

  y += cardH + 18;

  if (p.observaciones) {
    if (y > doc.internal.pageSize.getHeight() - 120) { doc.addPage(); y = 40; }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primario);
    doc.setFontSize(13);
    doc.text('Observaciones', left, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0,0,0);
    const obsLines = doc.splitTextToSize(p.observaciones, width);
    doc.text(obsLines, left, y);
    y += obsLines.length * 14 + 12;
  }

  if (y > doc.internal.pageSize.getHeight() - 100) { doc.addPage(); y = 40; }
  doc.setDrawColor(...primario);
  doc.setLineWidth(0.6);
  doc.line(left, doc.internal.pageSize.getHeight() - 80, doc.internal.pageSize.getWidth() - left, doc.internal.pageSize.getHeight() - 80);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Policlínico Uleam • ' + new Date().getFullYear(), left, doc.internal.pageSize.getHeight() - 60);

  return doc;
}

// generar y guardar
const doc = createPdf(pacienteEjemplo);
const arrayBuf = doc.output('arraybuffer');
const buffer = Buffer.from(arrayBuf);
const outPath = './sample_paciente.pdf';
fs.writeFileSync(outPath, buffer);
console.log('PDF generado en:', outPath);