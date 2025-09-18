// routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/clientController');
const { authenticateFirebase } = require('../middleware/firebaseAuth');
const { requireClientAccess, requireRole } = require('../middleware/authorization');
const { auditAction } = require('../middleware/audit');

// Todas as rotas precisam de autenticação
router.use(authenticateFirebase);

// Dados do cliente
router.get('/clients/:clientId',
  requireClientAccess(),
  ClientController.getClient
);

router.put('/clients/:clientId',
  requireClientAccess(),
  requireRole(['master']),
  auditAction('client_updated', 'client'),
  ClientController.updateClient
);

// Módulos do cliente
router.get('/clients/:clientId/modules',
  requireClientAccess(),
  ClientController.getClientModules
);

// Logs de auditoria
router.get('/clients/:clientId/audit-logs',
  requireClientAccess(),
  requireRole(['master', 'admin']),
  ClientController.getAuditLogs
);

module.exports = router;