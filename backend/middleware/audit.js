// middleware/audit.js
const AuditService = require('../services/auditService');

const auditAction = (action, entityType) => {
  return (req, res, next) => {
    // Por enquanto, apenas log - você pode implementar auditoria completa depois
    console.log(`📋 Audit: ${action} on ${entityType} by user ${req.user?.email || 'unknown'}`);
    
    // Adicionar informações de auditoria ao request
    req.auditInfo = {
      action,
      entityType,
      userId: req.user?.id,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    next();
  };
};

module.exports = { auditAction };