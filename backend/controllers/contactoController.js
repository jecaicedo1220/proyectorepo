const Contacto = require('../models/Contacto');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactoController = {
  enviar: async (req, res) => {
    try {
      const nombre = String(req.body.nombre || '').trim();
      const correo = String(req.body.correo || '').trim().toLowerCase();
      const mensaje = String(req.body.mensaje || '').trim();

      if (!nombre || !correo || !mensaje) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
      }

      if (nombre.length < 2 || nombre.length > 80) {
        return res.status(400).json({ error: 'El nombre debe tener entre 2 y 80 caracteres' });
      }

      if (!emailRegex.test(correo)) {
        return res.status(400).json({ error: 'Correo electronico no valido' });
      }

      if (mensaje.length < 10 || mensaje.length > 1000) {
        return res.status(400).json({ error: 'El mensaje debe tener entre 10 y 1000 caracteres' });
      }

      const contacto = new Contacto({
        nombre,
        correo,
        mensaje,
      });

      await contacto.save();
      res.status(201).json({ mensaje: 'Mensaje enviado con exito' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = contactoController;
