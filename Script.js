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
 
  actualizarVista();
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
 
    if (filtro = 'hoy') {
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
function actualizarVista() {
  const filtro = filtroFecha.value;
  const gastosFiltrados = obtenerGastosFiltrados(filtro);
 
  list.innerHTML = '';
  gastosFiltrados.forEach(renderGasto);
 
  renderChart(gastosFiltrados);
}
 
function renderGasto(gasto) {
  const item = document.createElement('li');
 
  item.dataset.id = gasto.id;
  item.textContent =
    `${gasto.descripcion} - $${gasto.monto.toFixed(2)} - ${gasto.categoria} - ${gasto.fecha}`;
 
  list.appendChild(item);
}
 
const chartCanvas = document.getElementById('expense-chart');
const ctx = chartCanvas.getContext('2d');
 
function renderChart(gastosAMostrar = gastos) {
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
 
  // Agrupa el total gastado por categoría
  const totales = {};
 
  gastosAMostrar.forEach(g => {
    totales[g.categoria] = (totales[g.categoria] || 0) + g.monto;
  });
 
  const categorias = Object.keys(totales);
 
  if (categorias.length === 0) return;
 
  const maxTotal = Math.max(...Object.values(totales));
  const barWidth = chartCanvas.width / categorias.length;
  const chartHeight = chartCanvas.height - 40;
 
  categorias.forEach((cat, i) => {
    const valor = totales[cat];
    const barHeight = (valor / maxTotal) * chartHeight;
    const x = i * barWidth + 10;
    const y = chartCanvas.height - barHeight - 20;
 
    ctx.fillStyle = '#2575fc';
    ctx.fillRect(x, y, barWidth - 20, barHeight);
 
    ctx.fillStyle = '#222';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(cat, x + (barWidth - 20) / 2, chartCanvas.height - 5);
    ctx.fillText(`$${valor.toFixed(0)}`, x + (barWidth - 20) / 2, y - 5);
  });
}
 