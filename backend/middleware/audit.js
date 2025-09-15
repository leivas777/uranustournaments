// middleware/audit.js
const AuditService = require('../services/auditService');

const auditAction = (action, resourceType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Só auditar se a operação foi bem-sucedida
      if (res.statusCode >= 200 && res.statusCode < 300 && req.auditData) {
        const auditData = {
          ...req.auditData,
          action,
          resourceType,
          resourceId: req.params.tournamentId || req.params.clientId || null,
          oldValues: req.oldValues || {},
          newValues: req.body || {}
        };

        // Executar auditoria de forma assíncrona
        AuditService.log(auditData).catch(error => {
          console.error('Erro na auditoria:', error);
        });
      }

      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = { auditAction };