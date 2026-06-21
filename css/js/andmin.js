document.addEventListener('DOMContentLoaded', async function () {
  const container = document.getElementById('adminTableContainer');
  const refreshAdmin = document.getElementById('refreshAdmin');
  const logoutAdmin = document.getElementById('logoutAdmin');
  const pendingReservations = document.getElementById('pendingReservations');
  const confirmedReservations = document.getElementById('confirmedReservations');
  const paidReservations = document.getElementById('paidReservations');
  const totalReservations = document.getElementById('totalReservations');

  const token = API.getToken();
  const usuario = API.getUser();

  if (!token || !usuario?.esAdmin) {
    alert('Debes iniciar sesion como admin.');
    window.location = 'login.html';
    return;
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function formatMoney(value) {
    return `$${Number(value || 0).toLocaleString('es-CO')} COP`;
  }

  function estadoPago(item) {
    if (item.pagada || item.estadoPago === 'pagada') return 'pagada';
    if (item.estadoPago === 'pendiente_verificacion') return 'pendiente_verificacion';
    return 'sin_pago';
  }

  function renderMetrics(reservas) {
    const confirmadas = reservas.filter((item) => item.estado === 'confirmada').length;
    const pagadas = reservas.filter((item) => estadoPago(item) === 'pagada').length;
    const pendientes = reservas.filter((item) => !item.estado || item.estado === 'pendiente').length;

    pendingReservations.textContent = pendientes;
    confirmedReservations.textContent = confirmadas;
    paidReservations.textContent = pagadas;
    totalReservations.textContent = reservas.length;
  }

  function renderTable(reservas) {
    renderMetrics(reservas || []);

    if (!reservas || reservas.length === 0) {
      container.innerHTML = '<div class="admin-empty">No hay reservas aun</div>';
      return;
    }

    const rows = reservas
      .map((item, index) => {
        const estado = item.estado || 'pendiente';
        const pago = estadoPago(item);
        const estadoTexto = estado === 'confirmada' ? 'Confirmada' : estado === 'cancelada' ? 'Cancelada' : 'Pendiente';
        const pagoTexto = pago === 'pagada'
          ? `Pagado (${item.metodoPago || 'sin metodo'})`
          : pago === 'pendiente_verificacion'
            ? `En revision (${item.metodoPago || 'sin metodo'})`
            : 'Sin pagar';
        const cliente = item.cliente || item.usuario_id?.nombre || 'Anonimo';
        const id = escapeHTML(item._id);

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(cliente)}</td>
            <td>${escapeHTML(item.telefono || 'No registrado')}</td>
            <td>${escapeHTML(item.servicio)}</td>
            <td>${escapeHTML(new Date(item.fecha).toLocaleDateString('es-CO'))}</td>
            <td>${escapeHTML(item.hora)}</td>
            <td>${escapeHTML(formatMoney(item.monto))}</td>
            <td><span class="admin-status admin-status-${escapeHTML(estado)}">${escapeHTML(estadoTexto)}</span></td>
            <td><span class="admin-status ${pago === 'pagada' ? 'admin-status-paid' : 'admin-status-unpaid'}">${escapeHTML(pagoTexto)}</span></td>
            <td class="admin-table-actions">
              ${estado === 'confirmada' ? '' : `<button onclick="confirmarReservaAdmin('${id}')" class="admin-confirm-button">Confirmar cita</button>`}
              ${pago === 'pendiente_verificacion' ? `<button onclick="confirmarPagoAdmin('${id}')" class="admin-confirm-button">Confirmar pago</button>` : ''}
              <button onclick="eliminarReservaAdmin('${id}')" class="admin-delete-button">Eliminar</button>
            </td>
          </tr>
        `;
      })
      .join('');

    container.innerHTML = `
      <div class="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Telefono</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Pago</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  async function cargarReservas() {
    try {
      const reservas = await API.obtenerTodasLasReservas();
      if (Array.isArray(reservas)) {
        renderTable(reservas);
      } else if (reservas.error) {
        alert('Error: ' + reservas.error);
      }
    } catch (error) {
      console.error('Error cargando reservas:', error);
    }
  }

  cargarReservas();
  refreshAdmin.addEventListener('click', cargarReservas);
  logoutAdmin.addEventListener('click', function () {
    API.logout();
    window.location = 'login.html';
  });
});

async function eliminarReservaAdmin(id) {
  if (!confirm('Deseas eliminar esta reserva?')) return;
  try {
    const resultado = await API.eliminarReservaAdmin(id);
    if (resultado.error) {
      alert('Error: ' + resultado.error);
    } else {
      alert('Reserva eliminada');
      location.reload();
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function confirmarReservaAdmin(id) {
  try {
    const resultado = await API.confirmarReservaAdmin(id);
    if (resultado.error) {
      alert('Error: ' + resultado.error);
    } else {
      alert('Reserva confirmada');
      location.reload();
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function confirmarPagoAdmin(id) {
  if (!confirm('Confirmar este pago?')) return;
  try {
    const resultado = await API.confirmarPagoAdmin(id);
    if (resultado.error) {
      alert('Error: ' + resultado.error);
    } else {
      alert('Pago confirmado');
      location.reload();
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
