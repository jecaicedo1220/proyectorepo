require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

connectDB();

const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevelopmentOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch (error) {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'null' || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS'));
  },
}));

app.use(express.json({ limit: '20kb' }));

const crearLimitador = ({ windowMs, max }) => {
  const intentos = new Map();

  return (req, res, next) => {
    const ahora = Date.now();
    const clave = `${req.ip}:${req.baseUrl || req.path}`;
    const actual = intentos.get(clave) || { total: 0, resetAt: ahora + windowMs };

    if (actual.resetAt <= ahora) {
      actual.total = 0;
      actual.resetAt = ahora + windowMs;
    }

    actual.total += 1;
    intentos.set(clave, actual);

    if (actual.total > max) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo mas tarde.' });
    }

    next();
  };
};

const authLimiter = crearLimitador({ windowMs: 15 * 60 * 1000, max: 30 });
const writeLimiter = crearLimitador({ windowMs: 15 * 60 * 1000, max: 80 });

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/reservas', writeLimiter, require('./routes/reservas'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contacto', writeLimiter, require('./routes/contacto'));

app.use((err, req, res, next) => {
  if (err.message === 'Origen no permitido por CORS') {
    return res.status(403).json({ error: err.message });
  }

  console.error('Error no controlado:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en puerto ${PORT}`);
});
