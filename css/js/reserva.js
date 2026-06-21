document.addEventListener('DOMContentLoaded', async function () {
  const reservaForm = document.getElementById('reservaForm');
  const fechaInput = document.getElementById('fecha');
  const welcomeText = document.getElementById('welcomeText');
  const reservationList = document.getElementById('reservationList');
  const logoutButton = document.getElementById('logoutButton');
  const refreshButton = document.getElementById('refreshButton');
  const pendingCount = document.getElementById('pendingCount');
  const confirmedCount = document.getElementById('confirmedCount');
  const cancelledCount = document.getElementById('cancelledCount');
  const appToast = document.getElementById('appToast');

  const paymentModal = document.getElementById('paymentModal');
  const closePaymentModal = document.getElementById('closePaymentModal');
  const cancelPayment = document.getElementById('cancelPayment');
  const confirmPayment = document.getElementById('confirmPayment');
  const paymentService = document.getElementById('paymentService');
  const paymentDate = document.getElementById('paymentDate');
  const paymentHour = document.getElementById('paymentHour');
  const paymentAmount = document.getElementById('paymentAmount');
  const paymentReceipt = document.getElementById('paymentReceipt');

  const usuario = API.getUser();
  const token = API.getToken();
  let reservasActuales = [];
  let reservaSeleccionada = null;
  let metodoSeleccionado = '';

  const etiquetasPago = {
    pse: 'PSE',
    nequi: 'Nequi',
    daviplata: 'Daviplata',
    tarjeta: 'Tarjeta',
  };
  const preciosServicios = {
    'Manicura clasica': 30000,
    'Manicura en gel': 60000,
    'Manicura y pedicura': 70000,
    'Unas acrilicas': 100000,
    'Diseno Personalizado': 12000,
  };

  if (!usuario || !token) {
    alert('Debes iniciar sesion para reservar.');
    window.location = 'login.html';
    return;
  }

  welcomeText.textContent = `Bienvenido, ${usuario.nombre}`;
  fechaInput.min = new Date().toISOString().split('T')[0];

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function normalizarEstado(item) {
    return item.estado || 'pendiente';
  }

  function obtenerMonto(item) {
    return Number(item.monto || preciosServicios[item.servicio] || 0);
  }

  function estadoPago(item) {
    if (item.pagada || item.estadoPago === 'pagada') return 'pagada';
    if (item.estadoPago === 'pendiente_verificacion') return 'pendiente_verificacion';
    return 'sin_pago';
  }

  function formatMoney(value) {
    return `$${Number(value).toLocaleString('es-CO')} COP`;
  }

  function formatDate(value) {
    return new Date(value).toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatCreated(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function mostrarMensaje(mensaje, tipo = 'success') {
    appToast.textContent = mensaje;
    appToast.className = `app-toast is-visible app-toast-${tipo}`;

    window.clearTimeout(mostrarMensaje.timer);
    mostrarMensaje.timer = window.setTimeout(() => {
      appToast.className = 'app-toast';
    }, 3600);
  }

  function renderMetrics(reservas) {
    pendingCount.textContent = reservas.filter((item) => normalizarEstado(item) === 'pendiente').length;
    confirmedCount.textContent = reservas.filter((item) => normalizarEstado(item) === 'confirmada').length;
    cancelledCount.textContent = reservas.filter((item) => normalizarEstado(item) === 'cancelada').length;
  }

  function renderReservations(reservas) {
    renderMetrics(reservas || []);

    if (!reservas || reservas.length === 0) {
      reservationList.innerHTML = '<div class="user-empty">No tienes reservas registradas todavia.</div>';
      return;
    }

    reservationList.innerHTML = reservas
      .map((item) => {
        const estado = normalizarEstado(item);
        const pago = estadoPago(item);
        const estaPagada = pago === 'pagada';
        const pagoPendiente = pago === 'pendiente_verificacion';
        const estadoTexto = estado === 'confirmada' ? 'Confirmada' : estado === 'cancelada' ? 'Cancelada' : 'Pendiente';
        const pagoTexto = estaPagada ? 'Pagado' : pagoPendiente ? 'Pago en revision' : 'Sin pagar';
        const aviso = estado === 'confirmada'
          ? 'Tu reserva fue confirmada. Te esperamos en la fecha y hora elegidas.'
          : 'Tu reserva esta pendiente de confirmacion. Te contactaremos pronto.';

        return `
          <article class="user-reservation-card user-reservation-${escapeHTML(estado)}">
            <div class="user-reservation-main">
              <div class="user-reservation-info">
                <div class="user-reservation-title">
                  <h2>${escapeHTML(item.servicio)}</h2>
                  <span class="status-pill status-${escapeHTML(estado)}">${escapeHTML(estadoTexto)}</span>
                  <span class="status-pill payment-${estaPagada ? 'paid' : 'unpaid'}">${escapeHTML(pagoTexto)}</span>
                </div>
                <div class="reservation-meta">
                  <span>Fecha: ${escapeHTML(formatDate(item.fecha))}</span>
                  <span>Hora: ${escapeHTML(item.hora)}</span>
                  <span>Telefono: ${escapeHTML(item.telefono || 'No registrado')}</span>
                </div>
                <div class="reservation-alert ${estado === 'confirmada' ? 'reservation-alert-confirmed' : ''}">
                  ${escapeHTML(aviso)}
                </div>
                ${pagoPendiente ? `
                  <div class="payment-confirmed">
                    <strong>Pago en revision</strong>
                    <span>Metodo: ${escapeHTML(etiquetasPago[item.metodoPago] || item.metodoPago)} - Monto: ${escapeHTML(formatMoney(obtenerMonto(item)))}</span>
                    <span>Solicitado el ${escapeHTML(formatCreated(item.fechaSolicitudPago))}</span>
                  </div>
                ` : ''}
                ${estaPagada ? `
                  <div class="payment-confirmed">
                    <strong>Pago confirmado</strong>
                    <span>Metodo: ${escapeHTML(etiquetasPago[item.metodoPago] || item.metodoPago)} - Monto: ${escapeHTML(formatMoney(obtenerMonto(item)))}</span>
                    <span>Pagado el ${escapeHTML(formatCreated(item.fechaPago))}</span>
                  </div>
                ` : ''}
                <div class="reservation-created">Reserva realizada el ${escapeHTML(formatCreated(item.fechaCreacion))}</div>
              </div>
              <div class="user-reservation-actions">
                ${estaPagada || pagoPendiente ? '' : `<button class="pay-now-button" type="button" onclick="abrirPago('${escapeHTML(item._id)}')">Pagar ahora</button>`}
                <button class="cancel-reservation-button" type="button" onclick="eliminarReserva('${escapeHTML(item._id)}')">Cancelar cita</button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  async function cargarReservas() {
    try {
      const reservas = await API.obtenerMisReservas();
      if (Array.isArray(reservas)) {
        reservasActuales = reservas;
        renderReservations(reservas);
      } else if (reservas.error) {
        mostrarMensaje(reservas.error, 'error');
      }
    } catch (error) {
      console.error('Error cargando reservas:', error);
    }
  }

  function cerrarPago() {
    paymentModal.classList.remove('is-open');
    paymentModal.setAttribute('aria-hidden', 'true');
    reservaSeleccionada = null;
    metodoSeleccionado = '';
    paymentReceipt.innerHTML = '';
    paymentReceipt.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.payment-option').forEach((option) => option.classList.remove('is-selected'));
  }

  window.abrirPago = function (id) {
    reservaSeleccionada = reservasActuales.find((item) => item._id === id);
    if (!reservaSeleccionada) return;

    paymentService.textContent = reservaSeleccionada.servicio;
    paymentDate.textContent = formatDate(reservaSeleccionada.fecha);
    paymentHour.textContent = reservaSeleccionada.hora;
    paymentAmount.textContent = formatMoney(obtenerMonto(reservaSeleccionada));
    confirmPayment.textContent = `Enviar pago ${formatMoney(obtenerMonto(reservaSeleccionada)).replace(' COP', '')}`;
    confirmPayment.disabled = false;
    paymentReceipt.innerHTML = '';
    paymentReceipt.setAttribute('aria-hidden', 'true');
    paymentModal.classList.add('is-open');
    paymentModal.setAttribute('aria-hidden', 'false');
  };

  document.querySelectorAll('.payment-option').forEach((option) => {
    option.addEventListener('click', function () {
      metodoSeleccionado = this.dataset.method;
      document.querySelectorAll('.payment-option').forEach((item) => item.classList.remove('is-selected'));
      this.classList.add('is-selected');
    });
  });

  confirmPayment.addEventListener('click', async function () {
    if (!reservaSeleccionada) return;
    if (!metodoSeleccionado) {
      mostrarMensaje('Selecciona un metodo de pago.', 'error');
      return;
    }

    confirmPayment.disabled = true;
    confirmPayment.textContent = 'Procesando pago...';

    const resultado = await API.pagarReserva(reservaSeleccionada._id, metodoSeleccionado);
    if (resultado.error) {
      mostrarMensaje(resultado.error, 'error');
      confirmPayment.disabled = false;
      confirmPayment.textContent = `Enviar pago ${formatMoney(obtenerMonto(reservaSeleccionada)).replace(' COP', '')}`;
      return;
    }

    const reservaPagada = resultado.reserva || reservaSeleccionada;
    paymentReceipt.innerHTML = `
      <strong>Pago exitoso</strong>
      <span>Servicio: ${escapeHTML(reservaPagada.servicio)}</span>
      <span>Metodo: ${escapeHTML(etiquetasPago[metodoSeleccionado] || metodoSeleccionado)}</span>
      <span>Total: ${escapeHTML(formatMoney(obtenerMonto(reservaPagada)))}</span>
      <small>El administrador revisara este pago para marcarlo como confirmado.</small>
    `;
    paymentReceipt.setAttribute('aria-hidden', 'false');
    mostrarMensaje(resultado.mensaje || 'Pago exitoso. Tu pago quedo en revision.');
    confirmPayment.disabled = false;
    window.setTimeout(() => {
      cerrarPago();
      cargarReservas();
    }, 1600);
  });

  closePaymentModal.addEventListener('click', cerrarPago);
  cancelPayment.addEventListener('click', cerrarPago);
  paymentModal.addEventListener('click', function (event) {
    if (event.target === paymentModal) cerrarPago();
  });

  reservaForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const servicio = document.getElementById('servicio').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const telefono = document.getElementById('telefono').value.trim();
    const notas = document.getElementById('notas').value.trim();

    if (!fecha || !hora || !telefono) {
      mostrarMensaje('Selecciona fecha, hora y telefono para continuar.', 'error');
      return;
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(telefono)) {
      mostrarMensaje('Ingresa un telefono valido.', 'error');
      return;
    }

    try {
      const resultado = await API.crearReserva(servicio, fecha, hora, telefono, notas);
      if (resultado.error) {
        mostrarMensaje(resultado.error, 'error');
      } else {
        mostrarMensaje('Reserva registrada con exito.');
        reservaForm.reset();
        cargarReservas();
      }
    } catch (error) {
      mostrarMensaje(error.message, 'error');
    }
  });

  refreshButton.addEventListener('click', cargarReservas);
  logoutButton.addEventListener('click', function () {
    API.logout();
    window.location = 'login.html';
  });

  cargarReservas();
});

async function eliminarReserva(id) {
  if (!confirm('Deseas cancelar esta cita?')) return;
  try {
    const resultado = await API.eliminarReserva(id);
    if (resultado.error) {
      alert('Error: ' + resultado.error);
    } else {
      alert('Cita cancelada');
      location.reload();
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
