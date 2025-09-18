// controllers/tournamentPermissionController.js
const TournamentPermissionService = require('../services/tournamentPermissionService');
const AdminUserService = require('../services/adminUserService');
const AuditService = require('../services/auditService');

class TournamentPermissionController {
  // Listar permissões de um torneio
  async getTournamentPermissions(req, res, next) {
    try {
      const { tournamentId } = req.params;

      const permissions = await TournamentPermissionService.getTournamentPermissions(tournamentId);

      res.json({
        success: true,
        data: permissions
      });

    } catch (error) {
      next(error);
    }
  }

  // Conceder acesso a um torneio
  async grantAccess(req, res, next) {
    try {
      const { tournamentId } = req.params;
      const { adminUserId, permissionLevel } = req.body;
      const { adminUserId: granterId } = req.user;

      if (!adminUserId || !permissionLevel) {
        return res.status(400).json({
          error: 'ID do administrador e nível de permissão são obrigatórios',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      const validLevels = ['owner', 'editor', 'viewer'];
      if (!validLevels.includes(permissionLevel)) {
        return res.status(400).json({
          error: 'Nível de permissão inválido',
          code: 'INVALID_PERMISSION_LEVEL',
          validLevels
        });
      }

      // Verificar se o usuário existe
      const targetUser = await AdminUserService.getById(adminUserId);
      if (!targetUser) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      const permission = await TournamentPermissionService.grantAccess(
        tournamentId,
        adminUserId,
        permissionLevel,
        granterId
      );

      // Log de auditoria
      await AuditService.log({
        ...req.auditData,
        action: 'tournament_access_granted',
        resourceType: 'tournament_permission',
        resourceId: permission.id,
        newValues: {
          tournamentId,
          adminUserId,
          permissionLevel,
          grantedBy: granterId
        }
      });

      res.status(201).json({
        success: true,
        data: permission,
        message: 'Acesso concedido com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }

  // Revogar acesso de um torneio
  async revokeAccess(req, res, next) {
    try {
      const { tournamentId, adminUserId } = req.params;
      const { adminUserId: revokerId } = req.user;

      const revokedPermission = await TournamentPermissionService.revokeAccess(
        tournamentId,
        adminUserId,
        revokerId
      );

      if (!revokedPermission) {
        return res.status(404).json({
          error: 'Permissão não encontrada',
          code: 'PERMISSION_NOT_FOUND'
        });
      }

      // Log de auditoria
      await AuditService.log({
        ...req.auditData,
        action: 'tournament_access_revoked',
        resourceType: 'tournament_permission',
        resourceId: revokedPermission.id,
        oldValues: {
          tournamentId,
          adminUserId,
          permissionLevel: revokedPermission.permission_level
        }
      });

      res.json({
        success: true,
        data: revokedPermission,
        message: 'Acesso revogado com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }

  // Verificar acesso de um usuário a um torneio
  async checkAccess(req, res, next) {
    try {
      const { tournamentId, adminUserId } = req.params;
      const { level = 'viewer' } = req.query;

      const hasAccess = await TournamentPermissionService.checkAccess(
        tournamentId,
        adminUserId,
        level
      );

      const userPermission = await TournamentPermissionService.getUserPermission(
        tournamentId,
        adminUserId
      );

      res.json({
        success: true,
        data: {
          hasAccess,
          permissionLevel: userPermission?.permission_level || null,
          effectiveLevel: hasAccess ? (userPermission?.permission_level || 'viewer') : null
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TournamentPermissionController();