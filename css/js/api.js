const API_HOST = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? window.location.hostname
  : 'localhost';
const API_URL = window.JELLYSPA_API_URL || `http://${API_HOST}:5000/api`;
const API_FALLBACK_URL = API_HOST === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'http://127.0.0.1:5000/api';

const API = {
  getToken: () => sessionStorage.getItem('token'),
  setToken: (token) => sessionStorage.setItem('token', token),
  clearToken: () => sessionStorage.removeItem('token'),
  getUser: () => {
    try {
      return JSON.parse(sessionStorage.getItem('usuario'));
    } catch (error) {
      return null;
    }
  },
  setUser: (usuario) => sessionStorage.setItem('usuario', JSON.stringify(usuario)),
  clearUser: () => sessionStorage.removeItem('usuario'),

  headers: () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API.getToken()}`,
  }),

  request: async (url, options = {}) => {
    let res;
    let finalUrl = url;

    try {
      res = await fetch(url, options);
    } catch (error) {
      if (!window.JELLYSPA_API_URL && url.startsWith(API_URL)) {
        finalUrl = url.replace(API_URL, API_FALLBACK_URL);

        try {
          res = await fetch(finalUrl, options);
        } catch (fallbackError) {
          return {
            error: `No se pudo conectar con el servidor en ${API_URL} ni en ${API_FALLBACK_URL}. Inicia el backend con "npm.cmd start" dentro de la carpeta backend.`,
          };
        }
      } else {
        return {
          error: `No se pudo conectar con el servidor en ${finalUrl}. Inicia el backend con "npm.cmd start" dentro de la carpeta backend.`,
        };
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok && !data.error) {
      data.error = 'No se pudo completar la solicitud';
    }

    return data;
  },

  register: async (nombre, correo, password) => API.request(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, correo, password }),
  }),

  login: async (correo, password) => {
    const data = await API.request(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password }),
    });

    if (data.token) {
      API.setToken(data.token);
      API.setUser(data.usuario);
    }

    return data;
  },

  resetPassword: async (correo, password) => API.request(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  }),

  logout: () => {
    API.clearToken();
    API.clearUser();
  },

  crearReserva: async (servicio, fecha, hora, telefono, notas) => API.request(`${API_URL}/reservas`, {
    method: 'POST',
    headers: API.headers(),
    body: JSON.stringify({ servicio, fecha, hora, telefono, notas }),
  }),

  obtenerMisReservas: async () => API.request(`${API_URL}/reservas`, {
    headers: API.headers(),
  }),

  eliminarReserva: async (id) => API.request(`${API_URL}/reservas/${id}`, {
    method: 'DELETE',
    headers: API.headers(),
  }),

  pagarReserva: async (id, metodoPago) => API.request(`${API_URL}/reservas/${id}/pagar`, {
    method: 'PATCH',
    headers: API.headers(),
    body: JSON.stringify({ metodoPago }),
  }),

  obtenerEstadisticas: async () => API.request(`${API_URL}/admin/stats`, {
    headers: API.headers(),
  }),

  obtenerTodasLasReservas: async () => API.request(`${API_URL}/admin/reservas`, {
    headers: API.headers(),
  }),

  eliminarReservaAdmin: async (id) => API.request(`${API_URL}/admin/reservas/${id}`, {
    method: 'DELETE',
    headers: API.headers(),
  }),

  confirmarReservaAdmin: async (id) => API.request(`${API_URL}/admin/reservas/${id}/confirmar`, {
    method: 'PATCH',
    headers: API.headers(),
  }),

  confirmarPagoAdmin: async (id) => API.request(`${API_URL}/admin/reservas/${id}/confirmar-pago`, {
    method: 'PATCH',
    headers: API.headers(),
  }),

  eliminarTodasLasReservas: async () => API.request(`${API_URL}/admin/reservas`, {
    method: 'DELETE',
    headers: API.headers(),
  }),

  enviarMensajeContacto: async (nombre, correo, mensaje) => API.request(`${API_URL}/contacto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, correo, mensaje }),
  }),
};
