// --- 1. CONFIGURACIÓN DE SONIDOS ---
// Rutas relativas corregidas para que funcionen en cualquier computadora
const sonidoExito = new Audio('sonidos/UI Clicks Positive/PositiveClick1_8bitSFX_AudioJackGames.wav'); 
const sonidoError = new Audio('sonidos/UI Clicks Negative/NegativeClick1_8bitSFX_AudioJackGames.wav'); 
const sonidoBoton = new Audio('sonidos/UI Clicks Neutral/NeutralClick1_8bitSFX_AudioJackGames.wav');

// Función auxiliar para reiniciar el sonido en clics rápidos
function reproducirSonido(audio) {
  audio.currentTime = 0;
  audio.play().catch(e => console.log("Esperando interacción", e));
}

// --- 2. VARIABLES Y ELEMENTOS DEL DOM ---
// Almacena los gastos en memoria mientras la app está abierta
const gastos = [];
let limiteActual = 0; // Variable global para almacenar el límite

const form = document.getElementById('expense-form');
const descInput = document.getElementById('expense-desc');
const amountInput = document.getElementById('expense-amount');
const list = document.getElementById('expense-list');
const categoriaInput = document.getElementById('categoria');
const fechaInput = document.getElementById('fecha');
const filtroFecha = document.getElementById('filtro-fecha');

// --- 3. LÓGICA DEL FORMULARIO PARA AGREGAR GASTOS ---
form.addEventListener('submit', (e) => {
  e.preventDefault();
 
  const descripcion = descInput.value.trim();
  const monto = parseFloat(amountInput.value);
  const categoria = categoriaInput.value;
  const fecha = fechaInput.value;
 
  // Validación con sonido de error
  if (
    !descripcion ||
    isNaN(monto) ||
    monto <= 0 ||
    categoria === '' ||
    fecha === ''
  ) {
    reproducirSonido(sonidoError);
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
 
  // Sonido de éxito al agregar
  reproducirSonido(sonidoExito);
 
  form.reset();
  descInput.focus();
 
  actualizarVista(gasto.id);
});
 
filtroFecha.addEventListener('change', () => {
  actualizarVista();
});
 
// --- 4. LÓGICA DE FILTRADO (Corrección aplicada) ---
function obtenerGastosFiltrados(filtro) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
 
  return gastos.filter(g => {
    const fechaGasto = new Date(g.fecha + 'T00:00:00');
 
    // Corregido: Uso de comparación estricta (===) en lugar de asignación (=)
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
 
// --- 5. ACTUALIZACIÓN DE VISTA Y CÁLCULOS ---
function actualizarVista(idNuevoGasto = null) {
  const filtro = filtroFecha.value;
  const gastosFiltrados = obtenerGastosFiltrados(filtro);
 
  // 1. Dibuja la lista
  list.innerHTML = '';
  gastosFiltrados.forEach(g => renderGasto(g, g.id === idNuevoGasto));
 
  // 2. Dibuja el gráfico
  renderChart(gastosFiltrados);

  // 3. Actualiza las estadísticas del panel de presupuesto
  const gastoAcumulado = document.getElementById('gastoAcumulado');
  const gastoDisponible = document.getElementById('gastoDisponible');

  // Calcular total gastado
  const totalGastado = gastos.reduce((total, g) => total + g.monto, 0);
  gastoAcumulado.textContent = `$${totalGastado.toFixed(2)}`;

  // Calcular disponible
  if (limiteActual > 0) {
      const disponible = limiteActual - totalGastado;
      gastoDisponible.textContent = `$${disponible.toFixed(2)}`;
      
      // Si te pasas del límite, el texto se pone rojo
      if (disponible < 0) {
          gastoDisponible.style.color = "red";
      } else {
          gastoDisponible.style.color = "var(--acento)";
      }
  } else {
      gastoDisponible.textContent = `$0.00`;
  }
}
 
function renderGasto(gasto, esNuevo = false) {
  const item = document.createElement('li');
 
  item.dataset.id = gasto.id;
  item.textContent =
    `${gasto.descripcion} - $${gasto.monto.toFixed(2)} - ${gasto.categoria} - ${gasto.fecha}`;
 
  // Animación de entrada para el nuevo elemento
  if (esNuevo) {
    item.classList.add('nuevo-gasto');
  }
 
  list.appendChild(item);
}

// --- 6. ANIMACIÓN Y LÓGICA DEL BOTÓN "FIJAR LÍMITE" ---
const guardarLimiteBtn = document.getElementById('guardarLimite');
const inputLimite = document.getElementById('limiteGasto');
const informacionLimite = document.getElementById('informacionLimite');

guardarLimiteBtn.addEventListener('click', () => {
  // Reproducir sonido al hacer clic
  reproducirSonido(sonidoBoton);

  // Guardar el límite y actualizar la UI
  const nuevoLimite = parseFloat(inputLimite.value);
  
  if (!isNaN(nuevoLimite) && nuevoLimite > 0) {
      limiteActual = nuevoLimite;
      informacionLimite.textContent = `$${limiteActual.toFixed(2)}`;
      inputLimite.value = ''; // Limpiar el input
      actualizarVista(); // Forzar actualización para calcular el disponible
  } else {
      reproducirSonido(sonidoError);
      alert("Por favor, ingresa una cantidad válida para el límite.");
  }

  // Animación visual del botón (forzar reflow)
  guardarLimiteBtn.classList.remove('guardado');
  void guardarLimiteBtn.offsetWidth; 
  guardarLimiteBtn.classList.add('guardado');
});
 
// --- 7. ANIMACIONES DE GRÁFICO (Canvas) ---
const chartCanvas = document.getElementById('expense-chart');
const ctx = chartCanvas.getContext('2d');
let animationFrameId = null;
 
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
 
function renderChart(gastosAMostrar = gastos) {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
 
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
 
  const duracion = 500;
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
 
      ctx.fillStyle = '#3b82f6'; // Azul acorde al nuevo diseño
      ctx.fillRect(x, y, barWidth - 20, barHeight);
 
      ctx.fillStyle = '#1e293b'; // Color de texto oscuro del diseño
      ctx.font = 'bold 11px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(cat, x + (barWidth - 20) / 2, chartCanvas.height - 5);
 
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