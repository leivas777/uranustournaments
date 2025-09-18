// routes/adminUserRoutes.js
const express = require('express');
const router = express.Router();
const AdminUserController = require('../controllers/adminUserController');
const { authenticateFirebase } = require('../middleware/firebaseAuth');
const { requireRole, requireClientAccess } = require('../middleware/authorization');
const { auditAction } = require('../middleware/audit');

// Todas as rotas precisam de autenticação
router.use(authenticateFirebase);

// Rotas de administradores por cliente
router.get('/clients/:clientId/admins', 
  requireClientAccess(),
  AdminUserController.getClientAdmins
);

router.post('/clients/:clientId/admins/invite',
  requireClientAccess(),
  requireRole(['master']),
  auditAction('admin_invited', 'admin_user'),
  AdminUserController.inviteAdmin
);

router.put('/clients/:clientId/admins/:adminId/role',
  requireClientAccess(),
  requireRole(['master']),
  auditAction('admin_role_updated', 'admin_user'),
  AdminUserController.updateAdminRole
);

router.delete('/clients/:clientId/admins/:adminId',
  requireClientAccess(),
  requireRole(['master']),
  auditAction('admin_deactivated', 'admin_user'),
  AdminUserController.deactivateAdmin
);

// Torneios do usuário
router.get('/my-tournaments', AdminUserController.getUserTournaments);

module.exports = router;