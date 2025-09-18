// routes/tournamentPermissionRoutes.js
const express = require('express');
const router = express.Router();
const TournamentPermissionController = require('../controllers/tournamentPermissionController');
const { authenticateFirebase } = require('../middleware/firebaseAuth');
const { requireTournamentAccess } = require('../middleware/authorization');
const { auditAction } = require('../middleware/audit');

// Todas as rotas precisam de autenticação
router.use(authenticateFirebase);

// Listar permissões de um torneio
router.get('/tournaments/:tournamentId/permissions',
  requireTournamentAccess('viewer'),
  TournamentPermissionController.getTournamentPermissions
);

// Conceder acesso
router.post('/tournaments/:tournamentId/permissions',
  requireTournamentAccess('owner'),
  auditAction('tournament_access_granted', 'tournament_permission'),
  TournamentPermissionController.grantAccess
);

// Revogar acesso
router.delete('/tournaments/:tournamentId/permissions/:adminUserId',
  requireTournamentAccess('owner'),
  auditAction('tournament_access_revoked', 'tournament_permission'),
  TournamentPermissionController.revokeAccess
);

// Verificar acesso
router.get('/tournaments/:tournamentId/permissions/:adminUserId/check',
  requireTournamentAccess('viewer'),
  TournamentPermissionController.checkAccess
);

module.exports = router;