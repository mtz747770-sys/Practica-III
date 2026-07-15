// Almacena los gastos en memoria mientras la app está abierta
const gastos = [];

const form = document.getElementById('expense-form');
const descInput = document.getElementById('expense-desc');
const amountInput = document.getElementById('expense-amount');
const list = document.getElementById('expense-list');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const descripcion = descInput.value.trim();
  const monto = parseFloat(amountInput.value);

  if (!descripcion || isNaN(monto) || monto <= 0) return;

  const gasto = {
    id: Date.now(),
    descripcion,
    monto
  };

  gastos.push(gasto);
  renderGasto(gasto);

  form.reset();
  descInput.focus();
});

function renderGasto(gasto) {
  const item = document.createElement('li');
  item.dataset.id = gasto.id;
  item.textContent = `${gasto.descripcion} - $${gasto.monto.toFixed(2)}`;
  list.appendChild(item);
}