const User = require('../models/User');

const admin = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.usuario?.id).select('role');

    if (!usuario || usuario.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso solo para administradores' });
    }

    req.usuario.role = usuario.role;
    req.usuario.esAdmin = true;
    next();
  } catch (error) {
    res.status(500).json({ error: 'No se pudo validar el rol de administrador' });
  }
};

module.exports = admin;
