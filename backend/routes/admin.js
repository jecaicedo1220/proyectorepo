const express = require('express');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.get('/stats', auth, admin, adminController.obtenerEstadisticas);
router.get('/reservas', auth, admin, adminController.obtenerTodasLasReservas);
router.patch('/reservas/:id/confirmar', auth, admin, adminController.confirmarReserva);
router.patch('/reservas/:id/confirmar-pago', auth, admin, adminController.confirmarPago);
router.delete('/reservas/:id', auth, admin, adminController.eliminarReserva);
router.delete('/reservas', auth, admin, adminController.eliminarTodas);

module.exports = router;
