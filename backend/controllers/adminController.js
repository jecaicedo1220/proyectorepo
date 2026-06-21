const mongoose = require('mongoose');
const Reserva = require('../models/Reserva');

const validarObjectId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Id de reserva no valido' });
    return false;
  }

  return true;
};

const adminController = {
  obtenerEstadisticas: async (req, res) => {
    try {
      const totalReservas = await Reserva.countDocuments();
      const pendientes = await Reserva.countDocuments({ estado: 'pendiente' });
      const confirmadas = await Reserva.countDocuments({ estado: 'confirmada' });
      const pagadas = await Reserva.countDocuments({ pagada: true, estadoPago: 'pagada' });
      const pagosPendientes = await Reserva.countDocuments({ estadoPago: 'pendiente_verificacion' });
      const clientesUnicos = await Reserva.distinct('usuario_id');
      const ultimaReserva = await Reserva.findOne().sort({ fechaCreacion: -1 });

      res.json({
        totalReservas,
        pendientes,
        confirmadas,
        pagadas,
        pagosPendientes,
        clientesRegistrados: clientesUnicos.length,
        ultimaReserva: ultimaReserva ? ultimaReserva.fechaCreacion : null,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  obtenerTodasLasReservas: async (req, res) => {
    try {
      const reservas = await Reserva.find()
        .populate('usuario_id', 'nombre correo')
        .sort({ fecha: -1 });
      res.json(reservas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  confirmarReserva: async (req, res) => {
    try {
      const { id } = req.params;
      if (!validarObjectId(id, res)) return;

      const reserva = await Reserva.findByIdAndUpdate(
        id,
        { estado: 'confirmada', fechaConfirmacion: new Date() },
        { new: true }
      );

      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      res.json({ mensaje: 'Reserva confirmada', reserva });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  confirmarPago: async (req, res) => {
    try {
      const { id } = req.params;
      if (!validarObjectId(id, res)) return;

      const reserva = await Reserva.findById(id);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      if (reserva.estadoPago !== 'pendiente_verificacion') {
        return res.status(400).json({ error: 'La reserva no tiene un pago pendiente de verificacion' });
      }

      reserva.estadoPago = 'pagada';
      reserva.pagada = true;
      reserva.fechaPago = new Date();
      await reserva.save();

      res.json({ mensaje: 'Pago confirmado', reserva });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  eliminarReserva: async (req, res) => {
    try {
      const { id } = req.params;
      if (!validarObjectId(id, res)) return;

      const reserva = await Reserva.findByIdAndDelete(id);

      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      res.json({ mensaje: 'Reserva eliminada por admin' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  eliminarTodas: async (req, res) => {
    try {
      const resultado = await Reserva.deleteMany({});
      res.json({
        mensaje: `${resultado.deletedCount} reservas eliminadas`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = adminController;
