const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cliente: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
  },
  servicio: {
    type: String,
    required: true,
    trim: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  hora: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):[0-5]\d$/,
  },
  telefono: {
    type: String,
    default: '',
    trim: true,
    maxlength: 20,
  },
  notas: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada'],
    default: 'pendiente',
  },
  pagada: {
    type: Boolean,
    default: false,
  },
  estadoPago: {
    type: String,
    enum: ['sin_pago', 'pendiente_verificacion', 'pagada', 'rechazada'],
    default: 'sin_pago',
  },
  metodoPago: {
    type: String,
    enum: ['pse', 'nequi', 'daviplata', 'tarjeta', ''],
    default: '',
  },
  monto: {
    type: Number,
    required: true,
    min: 0,
  },
  fechaPago: {
    type: Date,
    default: null,
  },
  fechaSolicitudPago: {
    type: Date,
    default: null,
  },
  fechaConfirmacion: {
    type: Date,
    default: null,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
});

reservaSchema.index({ fecha: 1, hora: 1, estado: 1 });

module.exports = mongoose.model('Reserva', reservaSchema);
