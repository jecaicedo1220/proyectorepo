const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizarCorreo = (correo = '') => String(correo).trim().toLowerCase();

const authController = {
  register: async (req, res) => {
    try {
      const nombre = String(req.body.nombre || '').trim();
      const correo = normalizarCorreo(req.body.correo);
      const password = String(req.body.password || '');

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          error: 'La base de datos no esta conectada. Asegurate de haber ejecutado el comando "mongod".',
        });
      }

      if (!nombre || !correo || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
      }

      if (nombre.length < 2 || nombre.length > 80) {
        return res.status(400).json({ error: 'El nombre debe tener entre 2 y 80 caracteres' });
      }

      if (!emailRegex.test(correo)) {
        return res.status(400).json({ error: 'Correo electronico no valido' });
      }

      if (password.length < 8 || password.length > 72) {
        return res.status(400).json({ error: 'La contrasena debe tener entre 8 y 72 caracteres' });
      }

      const usuarioExistente = await User.findOne({ correo });
      if (usuarioExistente) {
        return res.status(400).json({ error: 'El correo ya esta registrado' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const usuario = new User({
        nombre,
        correo,
        password: passwordHash,
      });

      await usuario.save();
      console.log(`Usuario registrado: ${correo}`);
      res.status(201).json({ mensaje: 'Usuario registrado con exito' });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const correo = normalizarCorreo(req.body.correo);
      const password = String(req.body.password || '');

      if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y contrasena requeridos' });
      }

      const usuario = await User.findOne({ correo });
      if (!usuario) {
        return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
      }

      const passwordValida = await bcrypt.compare(password, usuario.password);
      if (!passwordValida) {
        return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
      }

      if (!process.env.JWT_SECRET) {
        console.error('Falta JWT_SECRET en el archivo .env');
        return res.status(500).json({ error: 'Error interno: falta configuracion JWT' });
      }

      const esAdmin = usuario.role === 'admin';
      console.log(`Login exitoso: ${correo} (Admin: ${esAdmin})`);

      const token = jwt.sign(
        { id: usuario._id, nombre: usuario.nombre, correo: usuario.correo, role: usuario.role, esAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          role: usuario.role,
          esAdmin,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  logout: (req, res) => {
    res.json({ mensaje: 'Sesion cerrada' });
  },

  resetPassword: async (req, res) => {
    try {
      const correo = normalizarCorreo(req.body.correo);
      const password = String(req.body.password || '');

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          error: 'La base de datos no esta conectada. Asegurate de haber ejecutado el comando "mongod".',
        });
      }

      if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y nueva contrasena requeridos' });
      }

      if (!emailRegex.test(correo)) {
        return res.status(400).json({ error: 'Correo electronico no valido' });
      }

      if (password.length < 8 || password.length > 72) {
        return res.status(400).json({ error: 'La contrasena debe tener entre 8 y 72 caracteres' });
      }

      const usuario = await User.findOne({ correo });
      if (!usuario) {
        return res.status(404).json({ error: 'No existe una cuenta con ese correo' });
      }

      usuario.password = await bcrypt.hash(password, 10);
      await usuario.save();

      res.json({ mensaje: 'Contrasena actualizada con exito' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = authController;
