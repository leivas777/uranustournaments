// routes/cepRoutes.js
const express = require('express');
const router = express.Router();
const CepController = require('../controllers/cepCentroller');


router.get('/test', (req, res) => {
  console.log('🧪 Rota de teste CEP chamada');
  res.json({
    success: true,
    message: 'Rota CEP funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota para buscar endereço por CEP
router.get('/:cep', CepController.getAddressByCep);

// Rota para validar formato do CEP
router.get('/:cep/validate', CepController.validateCep);

module.exports = router;