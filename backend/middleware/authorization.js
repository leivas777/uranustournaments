// middleware/authorization.js
const TournamentPermissionService = require('../services/tournamentPermissionService');

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Permissão insuficiente',
        code: 'INSUFFICIENT_ROLE',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

const requireTournamentAccess = (permissionLevel = 'viewer') => {
  return async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const { adminUserId, role } = req.user;

      // Masters sempre têm acesso
      if (role === 'master') {
        req.tournamentPermission = 'owner'; // Masters têm permissão de owner
        return next();
      }

      const hasAccess = await TournamentPermissionService.checkAccess(
        tournamentId,
        adminUserId,
        permissionLevel
      );

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Acesso negado ao torneio',
          code: 'TOURNAMENT_ACCESS_DENIED',
          required: permissionLevel
        });
      }

      // Adicionar nível de permissão na requisição
      const userPermission = await TournamentPermissionService.getUserPermission(tournamentId, adminUserId);
      req.tournamentPermission = userPermission?.permission_level || 'viewer';

      next();
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      res.status(500).json({ 
        error: 'Erro ao verificar permissões',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

const requireClientAccess = () => {
  return (req, res, next) => {
    const { clientId } = req.params;
    
    if (!clientId) {
      return res.status(400).json({ 
        error: 'ID do cliente é obrigatório',
        code: 'MISSING_CLIENT_ID'
      });
    }

    if (parseInt(clientId) !== req.user.clientId) {
      return res.status(403).json({ 
        error: 'Acesso negado ao cliente',
        code: 'CLIENT_ACCESS_DENIED'
      });
    }

    next();
  };
};

module.exports = { 
  requireRole, 
  requireTournamentAccess, 
  requireClientAccess 
};