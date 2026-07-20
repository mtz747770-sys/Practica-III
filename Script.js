// Almacena los gastos en memoria mientras la app está abierta
const gastos = [];

const form = document.getElementById('expense-form');
const descInput = document.getElementById('expense-desc');
const amountInput = document.getElementById('expense-amount');
const list = document.getElementById('expense-list');
const categoriaInput = document.getElementById('categoria');
const fechaInput = document.getElementById('fecha');
const filtroFecha = document.getElementById('filtro-fecha');

// Elementos para establecer el límite de gastos
const limiteGastoInput = document.getElementById('limite-gasto');
const guardarLimiteBtn = document.getElementById('guardar-limite');
const limiteTexto = document.getElementById('limite-texto');
const totalGastadoTexto = document.getElementById('total-gastado');
const disponibleTexto = document.getElementById('disponible');
const mensajeLimite = document.getElementById('mensaje-limite');

let limiteGasto = 0;

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

  const totalActual = calcularTotalGastos();
  const totalConNuevoGasto = totalActual + monto;

  // Evita registrar un gasto que supere el límite
  if (limiteGasto > 0 && totalConNuevoGasto > limiteGasto) {
    const disponible = limiteGasto - totalActual;

    alert(
      `No se puede agregar el gasto. Solo tienes $${disponible.toFixed(2)} disponibles.`
    );

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
  actualizarInformacionLimite();
});

filtroFecha.addEventListener('change', () => {
  actualizarVista();
});

// Guarda el límite ingresado por el usuario
guardarLimiteBtn.addEventListener('click', () => {
  const nuevoLimite = parseFloat(limiteGastoInput.value);

  if (isNaN(nuevoLimite) || nuevoLimite <= 0) {
    alert('Ingresa un límite mayor que cero.');
    return;
  }

  const totalActual = calcularTotalGastos();

  if (nuevoLimite < totalActual) {
    alert(
      `El límite no puede ser menor al total gastado de $${totalActual.toFixed(2)}.`
    );
    return;
  }

  limiteGasto = nuevoLimite;
  limiteGastoInput.value = '';

  actualizarInformacionLimite();
});

// Calcula el total de todos los gastos registrados
function calcularTotalGastos() {
  return gastos.reduce((total, gasto) => {
    return total + gasto.monto;
  }, 0);
}

// Actualiza la información relacionada con el límite
function actualizarInformacionLimite() {
  const totalGastado = calcularTotalGastos();
  const disponible = limiteGasto - totalGastado;

  limiteTexto.textContent =
    `Límite establecido: $${limiteGasto.toFixed(2)}`;

  totalGastadoTexto.textContent =
    `Total gastado: $${totalGastado.toFixed(2)}`;

  disponibleTexto.textContent =
    `Disponible: $${Math.max(disponible, 0).toFixed(2)}`;

  if (limiteGasto === 0) {
    mensajeLimite.textContent = 'Aún no se ha establecido un límite.';
  } else if (totalGastado >= limiteGasto) {
    mensajeLimite.textContent = 'Has alcanzado tu límite de gastos.';
  } else if (totalGastado >= limiteGasto * 0.8) {
    mensajeLimite.textContent = 'Estás cerca de alcanzar tu límite.';
  } else {
    mensajeLimite.textContent = 'Tus gastos están dentro del límite.';
  }
}

// Devuelve solo los gastos que cumplen con el filtro seleccionado
function obtenerGastosFiltrados(filtro) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return gastos.filter(g => {
    const fechaGasto = new Date(g.fecha + 'T00:00:00');

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

    return true;
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

  const colores = [
    '#ff6384',
    '#36a2eb',
    '#ffce56',
    '#4bc0c0',
    '#9966ff',
    '#ff9f40',
    '#8ac926'
  ];

  categorias.forEach((cat, i) => {
    const valor = totales[cat];
    const barHeight = (valor / maxTotal) * chartHeight;
    const x = i * barWidth + 10;
    const y = chartCanvas.height - barHeight - 20;

    ctx.fillStyle = colores[i % colores.length];
    ctx.fillRect(x, y, barWidth - 20, barHeight);

    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';

    ctx.fillText(
      cat,
      x + (barWidth - 20) / 2,
      chartCanvas.height - 5
    );

    ctx.fillStyle = '#666666';
    ctx.font = '11px sans-serif';

    ctx.fillText(
      `$${valor.toFixed(0)}`,
      x + (barWidth - 20) / 2,
      y - 5
    );
  });
}

actualizarInformacionLimite();