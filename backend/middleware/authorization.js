const roleService = require('../services/roleService')
const TournamentPermissionService = require('../services/tournamentPermissionService');

const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Verificar se é Master Admin (equivale ao "master" antigo)
      const isMaster = await roleService.isMasterAdmin(req.user.id);
      if (isMaster && allowedRoles.includes('master')) {
        console.log('👑 Master Admin - role master concedida');
        return next();
      }

      // Mapear roles antigas para novas permissões
      const rolePermissionMap = {
        'master': ['system.admin'],
        'admin': ['clients.manage', 'users.manage', 'tournaments.manage'],
        'client_admin': ['tournaments.create', 'tournaments.update', 'tournaments.delete'],
        'user': ['tournaments.read']
      };

      // Verificar se usuário tem alguma das roles permitidas
      let hasRequiredRole = false;
      
      for (const role of allowedRoles) {
        if (role === 'master' && isMaster) {
          hasRequiredRole = true;
          break;
        }
        
        // Verificar se tem as permissões equivalentes à role
        const requiredPermissions = rolePermissionMap[role] || [];
        const hasAllPermissions = requiredPermissions.every(permission => 
          req.user.permissions.includes(permission)
        );
        
        if (hasAllPermissions) {
          hasRequiredRole = true;
          break;
        }
        
        // Verificar se tem role diretamente pelo nome
        const hasRoleByName = req.user.roles.some(userRole => {
          const roleName = userRole.name;
          return (
            (role === 'admin' && (roleName === 'client_admin_principal' || roleName === 'master_admin')) ||
            (role === 'client_admin' && (roleName === 'client_admin_basico' || roleName === 'client_admin_principal')) ||
            (role === 'user' && roleName === 'client_user_basico')
          );
        });
        
        if (hasRoleByName) {
          hasRequiredRole = true;
          break;
        }
      }

      if (!hasRequiredRole) {
        console.log(`❌ Role negada. Requeridas: ${allowedRoles.join(', ')} para usuário ${req.user.email}`);
        return res.status(403).json({
          success: false,
          error: 'Role insuficiente',
          code: 'INSUFFICIENT_ROLE',
          required_roles: allowedRoles,
          user_roles: req.user.roles.map(r => r.name)
        });
      }

      console.log(`✅ Role concedida: ${allowedRoles.join(', ')} para usuário ${req.user.email}`);
      next();

    } catch (error) {
      console.error('❌ Erro ao verificar role:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar role',
        code: 'ROLE_CHECK_ERROR'
      });
    }
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

const requireClientAccess = (clientIdParam = 'clientId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const clientId = req.params[clientIdParam] || req.params.id || req.body.clientId || req.query.clientId;
      
      if (!clientId) {
        return res.status(400).json({
          success: false,
          error: 'ID do cliente não fornecido',
          code: 'CLIENT_ID_REQUIRED'
        });
      }

      // Verificar se é Master Admin
      const isMaster = await roleService.isMasterAdmin(req.user.id);
      if (isMaster) {
        console.log('👑 Master Admin - acesso ao cliente concedido');
        req.clientId = parseInt(clientId);
        return next();
      }

      // Verificar se usuário tem acesso ao cliente
      const userRoles = await roleService.getUserRoles(req.user.id, clientId);
      
      if (userRoles.length === 0) {
        console.log(`❌ Acesso negado ao cliente ${clientId} para usuário ${req.user.email}`);
        return res.status(403).json({
          success: false,
          error: 'Acesso negado ao cliente',
          code: 'CLIENT_ACCESS_DENIED',
          client_id: clientId
        });
      }

      console.log(`✅ Acesso ao cliente ${clientId} concedido para usuário ${req.user.email}`);
      req.clientId = parseInt(clientId);
      next();

    } catch (error) {
      console.error('❌ Erro ao verificar acesso ao cliente:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar acesso ao cliente',
        code: 'CLIENT_ACCESS_ERROR'
      });
    }
  };

  
};

const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Verificar se é Master Admin
      const isMaster = await roleService.isMasterAdmin(req.user.id);
      if (isMaster) {
        console.log('👑 Master Admin - permissão concedida automaticamente');
        return next();
      }

      // Verificar permissão específica
      const hasPermission = req.user.permissions.includes(permissionName);
      
      if (!hasPermission) {
        console.log(`❌ Permissão negada: ${permissionName} para usuário ${req.user.email}`);
        return res.status(403).json({
          success: false,
          error: 'Permissão insuficiente',
          code: 'INSUFFICIENT_PERMISSION',
          required_permission: permissionName,
          user_permissions: req.user.permissions
        });
      }

      console.log(`✅ Permissão concedida: ${permissionName} para usuário ${req.user.email}`);
      next();

    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Verificar se é Master Admin
      const isMaster = await roleService.isMasterAdmin(req.user.id);
      if (isMaster) {
        return next();
      }

      // Verificar se tem pelo menos uma das permissões
      const hasAnyPermission = permissions.some(permission => 
        req.user.permissions.includes(permission)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          error: 'Permissão insuficiente',
          code: 'INSUFFICIENT_PERMISSION',
          required_permissions: permissions,
          user_permissions: req.user.permissions
        });
      }

      next();

    } catch (error) {
      console.error('❌ Erro ao verificar permissões:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};


module.exports = { 
  requireRole, 
  requireTournamentAccess, 
  requireClientAccess,
  requireAnyPermission,
  requirePermission
};