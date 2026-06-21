const express = require('express');
const reservasController = require('../controllers/reservasController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, reservasController.crear);
router.get('/', auth, reservasController.obtenerMisReservas);
router.patch('/:id/pagar', auth, reservasController.pagar);
router.delete('/:id', auth, reservasController.eliminar);

module.exports = router;
