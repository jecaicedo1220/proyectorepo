const mongoose = require('mongoose');

const contactoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
  },
  correo: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  mensaje: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Contacto', contactoSchema);
