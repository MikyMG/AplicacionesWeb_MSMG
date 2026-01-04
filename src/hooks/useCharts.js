import { useEffect, useRef } from 'react';

export default function useCharts(baseDatos) {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const pieChartInstance = useRef(null);

  const palette = ['#c10e1a', '#e63946', '#f77f00', '#fcbf49', '#06a77d', '#4cc9f0', '#7209b7', '#999999', '#ff6b6b', '#ffb86b'];
  const pickColors = (n) => {
    const colors = [];
    for (let i = 0; i < n; i++) {
      colors.push(palette[i % palette.length]);
    }
    return colors;
  };

  useEffect(() => {
    let scriptAdded = false;

    const ensureChartAndRender = () => {
      if (window.Chart) {
        renderCharts();
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.async = true;
        script.onload = () => renderCharts();
        document.body.appendChild(script);
        scriptAdded = true;
      }
    };

    const renderCharts = () => {
      const Chart = window.Chart;
      if (!Chart) return;

      // --- Datos para barras: citas por día de la semana (Lun..Dom)
      const weekLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const weekCounts = new Array(7).fill(0);
      (baseDatos.citas || []).forEach(c => {
        try {
          const d = new Date(c.fecha);
          if (isNaN(d)) return;
          const idx = (d.getDay() + 6) % 7;
          weekCounts[idx]++;
        } catch (e) { /* ignore */ }
      });

      if (barChartInstance.current) { barChartInstance.current.destroy(); barChartInstance.current = null; }

      if (barChartRef.current) {
        const ctx1 = barChartRef.current.getContext('2d');
        barChartInstance.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: weekLabels,
            datasets: [{
              label: 'Citas por día',
              data: weekCounts,
              backgroundColor: 'rgba(193, 14, 26, 0.85)',
              borderColor: 'rgba(193, 14, 26, 1)',
              borderWidth: 1,
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
          }
        });
      }

      // Donut: distribución de especialidades
      const especiales = (baseDatos.especialidades && baseDatos.especialidades.length > 0)
        ? baseDatos.especialidades.map(e => e.especialidad || e.nombre || e.descripcion || 'Otra')
        : (baseDatos.medicos || []).map(m => m.especialidad || 'General');

      const freq = {};
      especiales.forEach(name => { freq[name] = (freq[name] || 0) + 1; });

      const labels = Object.keys(freq);
      const counts = labels.map(l => freq[l]);

      if (pieChartInstance.current) { pieChartInstance.current.destroy(); pieChartInstance.current = null; }

      if (pieChartRef.current) {
        const ctx2 = pieChartRef.current.getContext('2d');
        pieChartInstance.current = new Chart(ctx2, {
          type: 'doughnut',
          data: { labels, datasets: [{ data: counts, backgroundColor: pickColors(labels.length), borderWidth: 2 }] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
              legend: {
                position: 'left',
                align: 'start',
                labels: {
                  boxWidth: 12,
                  padding: 8,
                  usePointStyle: true,
                  // limitar ancho de etiqueta y usar texto completo siempre que sea posible
                }
              },
              tooltip: { enabled: true }
            },
            layout: { padding: { left: 10, right: 10, top: 6, bottom: 6 } }
          }
        });
      }
    };

    ensureChartAndRender();

    return () => {
      if (barChartInstance.current) { barChartInstance.current.destroy(); barChartInstance.current = null; }
      if (pieChartInstance.current) { pieChartInstance.current.destroy(); pieChartInstance.current = null; }
      if (scriptAdded) {
        const scripts = Array.from(document.querySelectorAll('script[src*="chart.js"]'));
        scripts.forEach(s => s.parentNode && s.parentNode.removeChild(s));
      }
    };
  }, [baseDatos]);

  return { barChartRef, pieChartRef };
}
