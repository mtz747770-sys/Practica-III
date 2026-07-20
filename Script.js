// Almacena los gastos en memoria mientras la app está abierta
const gastos = [];
 
const form = document.getElementById('expense-form');
const descInput = document.getElementById('expense-desc');
const amountInput = document.getElementById('expense-amount');
const list = document.getElementById('expense-list');
const categoriaInput = document.getElementById('categoria');
const fechaInput = document.getElementById('fecha');
const filtroFecha = document.getElementById('filtro-fecha');
 
form.addEventListener('submit', (e) => {
  e.preventDefault();
 
  const descripcion = descInput.value.trim();
  const monto = parseFloat(amountInput.value);
  const categoria = categoriaInput.value;
  const fecha = fechaInput.value;
 
  if (
    !descripcion ||
    isNaN(monto) ||
    monto <= 0 ||
    categoria === '' ||
    fecha === ''
  ) {
    return;
  }
 
  const gasto = {
    id: Date.now(),
    descripcion,
    monto,
    categoria,
    fecha
  };
 
  gastos.push(gasto);
 
  form.reset();
  descInput.focus();
 
  actualizarVista(gasto.id);
});
 
filtroFecha.addEventListener('change', () => {
  actualizarVista();
});
 
// Devuelve solo los gastos que cumplen con el filtro seleccionado
function obtenerGastosFiltrados(filtro) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
 
  return gastos.filter(g => {
    const fechaGasto = new Date(g.fecha + 'T00:00:00');
 
    // Corregido: era "filtro = 'hoy'" (asignación) en vez de "filtro === 'hoy'" (comparación)
    if (filtro === 'hoy') {
      return fechaGasto.getTime() === hoy.getTime();
    } else if (filtro === 'semana') {
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay());
 
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
 
      return fechaGasto >= inicioSemana && fechaGasto <= finSemana;
    } else if (filtro === 'mes') {
      return (
        fechaGasto.getMonth() === hoy.getMonth() &&
        fechaGasto.getFullYear() === hoy.getFullYear()
      );
    }
 
    return true; // 'todos'
  });
}
 
// Vuelve a dibujar la lista y el gráfico según el filtro activo
function actualizarVista(idNuevoGasto = null) {
  const filtro = filtroFecha.value;
  const gastosFiltrados = obtenerGastosFiltrados(filtro);
 
  list.innerHTML = '';
  gastosFiltrados.forEach(g => renderGasto(g, g.id === idNuevoGasto));
 
  renderChart(gastosFiltrados);
}
 
function renderGasto(gasto, esNuevo = false) {
  const item = document.createElement('li');
 
  item.dataset.id = gasto.id;
  item.textContent =
    `${gasto.descripcion} - $${gasto.monto.toFixed(2)} - ${gasto.categoria} - ${gasto.fecha}`;
 
  // Si el item recién se agregó, le damos la animación de entrada
  if (esNuevo) {
    item.classList.add('nuevo-gasto');
  }
 
  list.appendChild(item);
}
 
const chartCanvas = document.getElementById('expense-chart');
const ctx = chartCanvas.getContext('2d');
 
let animationFrameId = null;
 
// Suaviza el crecimiento de las barras (easing tipo "ease-out")
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
 
function renderChart(gastosAMostrar = gastos) {
  // Cancela cualquier animación de barras que siga corriendo
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
 
  // Agrupa el total gastado por categoría
  const totales = {};
 
  gastosAMostrar.forEach(g => {
    totales[g.categoria] = (totales[g.categoria] || 0) + g.monto;
  });
 
  const categorias = Object.keys(totales);
 
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
 
  if (categorias.length === 0) return;
 
  const maxTotal = Math.max(...Object.values(totales));
  const barWidth = chartCanvas.width / categorias.length;
  const chartHeight = chartCanvas.height - 40;
 
  const duracion = 500; // ms
  const inicio = performance.now();
 
  function dibujarFrame(ahora) {
    const transcurrido = ahora - inicio;
    const progreso = Math.min(transcurrido / duracion, 1);
    const progresoSuavizado = easeOutCubic(progreso);
 
    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
 
    categorias.forEach((cat, i) => {
      const valor = totales[cat];
      const barHeightFinal = (valor / maxTotal) * chartHeight;
      const barHeight = barHeightFinal * progresoSuavizado;
 
      const x = i * barWidth + 10;
      const y = chartCanvas.height - barHeight - 20;
 
      ctx.fillStyle = '#2575fc';
      ctx.fillRect(x, y, barWidth - 20, barHeight);
 
      ctx.fillStyle = '#222';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(cat, x + (barWidth - 20) / 2, chartCanvas.height - 5);
 
      // El monto solo aparece cuando la barra casi terminó de crecer, para que no "salte"
      if (progreso > 0.7) {
        ctx.globalAlpha = (progreso - 0.7) / 0.3;
        ctx.fillText(`$${valor.toFixed(0)}`, x + (barWidth - 20) / 2, y - 5);
        ctx.globalAlpha = 1;
      }
    });
 
    if (progreso < 1) {
      animationFrameId = requestAnimationFrame(dibujarFrame);
    }
  }
 
  animationFrameId = requestAnimationFrame(dibujarFrame);
}
 
// ===== Animación del botón "Guardar límite" al hacer clic =====
const guardarLimiteBtn = document.getElementById('guardarLimite');
 
guardarLimiteBtn.addEventListener('click', () => {
  guardarLimiteBtn.classList.remove('guardado');
  // Forzar reflow para que la animación se pueda repetir en clics seguidos
  void guardarLimiteBtn.offsetWidth;
  guardarLimiteBtn.classList.add('guardado');
});
 