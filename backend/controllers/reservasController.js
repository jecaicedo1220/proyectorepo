const mongoose = require('mongoose');
const Reserva = require('../models/Reserva');
const { obtenerServicio } = require('../config/services');

const metodosPago = ['pse', 'nequi', 'daviplata', 'tarjeta'];
const horaRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const telefonoRegex = /^[0-9+\-\s()]{7,20}$/;

const esFechaPasada = (fecha) => {
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  return fecha < inicioHoy;
};

const reservasController = {
  crear: async (req, res) => {
    try {
      const servicioSolicitado = String(req.body.servicio || '').trim();
      const fechaTexto = String(req.body.fecha || '').trim();
      const hora = String(req.body.hora || '').trim();
      const telefono = String(req.body.telefono || '').trim();
      const notas = String(req.body.notas || '').trim();
      const usuario_id = req.usuario.id;

      if (!servicioSolicitado || !fechaTexto || !hora || !telefono) {
        return res.status(400).json({ error: 'Servicio, fecha, hora y telefono son requeridos' });
      }

      const servicio = obtenerServicio(servicioSolicitado);
      if (!servicio) {
        return res.status(400).json({ error: 'Servicio no valido' });
      }

      const fecha = new Date(`${fechaTexto}T00:00:00`);
      if (Number.isNaN(fecha.getTime()) || esFechaPasada(fecha)) {
        return res.status(400).json({ error: 'La fecha debe ser valida y no puede estar en el pasado' });
      }

      if (!horaRegex.test(hora)) {
        return res.status(400).json({ error: 'Hora no valida' });
      }

      if (!telefonoRegex.test(telefono)) {
        return res.status(400).json({ error: 'Telefono no valido' });
      }

      if (notas.length > 500) {
        return res.status(400).json({ error: 'Las notas no pueden superar 500 caracteres' });
      }

      const reservaExistente = await Reserva.findOne({
        fecha,
        hora,
        estado: { $ne: 'cancelada' },
      });

      if (reservaExistente) {
        return res.status(409).json({ error: 'Ese horario ya esta reservado. Elige otra hora.' });
      }

      const reserva = new Reserva({
        usuario_id,
        cliente: req.usuario.nombre,
        servicio: servicio.nombre,
        fecha,
        hora,
        telefono,
        notas,
        monto: servicio.precio,
      });

      await reserva.save();
      res.status(201).json({ mensaje: 'Reserva creada con exito', reserva });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  obtenerMisReservas: async (req, res) => {
    try {
      const usuario_id = req.usuario.id;
      const reservas = await Reserva.find({ usuario_id }).sort({ fecha: 1 });
      res.json(reservas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  pagar: async (req, res) => {
    try {
      const { id } = req.params;
      const metodoPago = String(req.body.metodoPago || '').trim();
      const usuario_id = req.usuario.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Id de reserva no valido' });
      }

      if (!metodoPago || !metodosPago.includes(metodoPago)) {
        return res.status(400).json({ error: 'Metodo de pago no valido' });
      }

      const reserva = await Reserva.findById(id);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      if (reserva.usuario_id.toString() !== usuario_id) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      if (reserva.pagada || reserva.estadoPago === 'pagada') {
        return res.status(400).json({ error: 'La reserva ya esta marcada como pagada' });
      }

      if (!reserva.monto || reserva.monto <= 0) {
        const servicio = obtenerServicio(reserva.servicio);
        reserva.monto = servicio?.precio || 0;
      }

      reserva.metodoPago = metodoPago;
      reserva.estadoPago = 'pendiente_verificacion';
      reserva.fechaSolicitudPago = new Date();
      reserva.pagada = false;
      reserva.fechaPago = null;
      await reserva.save();

      res.json({ mensaje: 'Pago exitoso. Tu pago quedo en revision.', reserva });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const usuario_id = req.usuario.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Id de reserva no valido' });
      }

      const reserva = await Reserva.findById(id);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      if (reserva.usuario_id.toString() !== usuario_id) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      if (reserva.pagada || reserva.estadoPago === 'pagada') {
        return res.status(400).json({ error: 'No se puede cancelar una cita que ya ha sido pagada.' });
      }

      await Reserva.findByIdAndDelete(id);
      res.json({ mensaje: 'Reserva eliminada' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = reservasController;
