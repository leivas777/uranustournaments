// controllers/cepController.js
const CepService = require('../services/cepService');

class CepController {
  async getAddressByCep(req, res, next) {
    
    try {
      const { cep } = req.params;

      if (!cep) {
        return res.status(400).json({
          success: false,
          error: 'CEP é obrigatório',
          code: 'MISSING_CEP'
        });
      }

      // Validar formato do CEP
      const validation = CepService.validateCep(cep);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'CEP deve conter 8 dígitos numéricos',
          code: 'INVALID_CEP_FORMAT'
        });
      }

      const result = await CepService.getAddressByCep(cep);
      console.log(result)
      res.json(result);

    } catch (error) {
      // Log do erro para debugging
      console.error(`Erro ao buscar CEP ${req.params.cep}:`, error.message);

      if (error.message === 'CEP não encontrado') {
        return res.status(404).json({
          success: false,
          error: 'CEP não encontrado',
          code: 'CEP_NOT_FOUND'
        });
      }

      if (error.message.includes('Timeout')) {
        return res.status(408).json({
          success: false,
          error: 'Timeout ao buscar CEP. Tente novamente.',
          code: 'CEP_TIMEOUT'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar CEP',
        code: 'CEP_SERVICE_ERROR'
      });
    }
  }

  async validateCep(req, res, next) {
    try {
      const { cep } = req.params;

      const validation = CepService.validateCep(cep);

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CepController();