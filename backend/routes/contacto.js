const express = require('express');
const contactoController = require('../controllers/contactoController');

const router = express.Router();

router.post('/', contactoController.enviar);

module.exports = router;
