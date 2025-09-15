const { body, param, validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Dados de entrada inválidos",
      details: errors.array(),
    });
  }
  next();
};


const tournamentValidation = [
    body('name').trim().isLength({ min:3, max: 255}).withMessage('Nome deve ter entre 3 a 255 caracteres'),
    body('clubName').trim().isLength({min: 2, max: 255}).withMessage('Nome do clube deve ter entre 2 e 255 caracteres'),
    body('cityId').isInt({min:1}).withMessage('ID da cidade deve ser um número válido'),
    body('tournamentFormatId').isInt({min:1}).withMessage('Formato do torneio deve ser válido'),
    validateRequest
]

module.exports = {validateRequest, tournamentValidation}