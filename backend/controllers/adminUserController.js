// controllers/adminUserController.js
const AdminUserService = require('../services/adminUserService');
const ClientService = require('../services/clientService');
const AuditService = require('../services/auditService');
const { getFirebaseAuth } = require('../config/firebase');

class AdminUserController {
  // Listar administradores do cliente
  async getClientAdmins(req, res, next) {
    try {
      const { clientId } = req.params;
      const { adminUserId } = req.user;

      const admins = await AdminUserService.getClientAdmins(clientId, adminUserId);

      res.json({
        success: true,
        data: admins
      });

    } catch (error) {
      next(error);
    }
  }

  // Convidar novo administrador
  async inviteAdmin(req, res, next) {
    try {
      const { clientId } = req.params;
      const { email, role = 'admin' } = req.body;
      const { adminUserId, role: inviterRole } = req.user;

      // Verificar se quem está convidando tem permissão
      if (inviterRole !== 'master') {
        return res.status(403).json({
          error: 'Apenas masters podem convidar novos administradores',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      if (!email) {
        return res.status(400).json({
          error: 'Email é obrigatório',
          code: 'MISSING_EMAIL'
        });
      }

      // Verificar se o usuário já existe no Firebase
      let firebaseUser;
      try {
        firebaseUser = await getFirebaseAuth().getUserByEmail(email);
      } catch (firebaseError) {
        if (firebaseError.code === 'auth/user-not-found') {
          return res.status(400).json({
            error: 'Usuário não encontrado no Firebase. O usuário deve se registrar primeiro.',
            code: 'USER_NOT_FOUND_FIREBASE'
          });
        }
        throw firebaseError;
      }

      // Verificar se já é admin deste cliente
      const existingAdmin = await AdminUserService.getByFirebaseUid(firebaseUser.uid);
      if (existingAdmin && existingAdmin.client_id === parseInt(clientId)) {
        return res.status(400).json({
          error: 'Usuário já é administrador deste cliente',
          code: 'USER_ALREADY_ADMIN'
        });
      }

      if (existingAdmin && existingAdmin.client_id !== parseInt(clientId)) {
        return res.status(400).json({
          error: 'Usuário já é administrador de outro cliente',
          code: 'USER_ADMIN_OTHER_CLIENT'
        });
      }

      // Criar novo admin
      const newAdmin = await AdminUserService.createFromFirebase(
        firebaseUser,
        parseInt(clientId),
        role,
        adminUserId
      );

      // Log de auditoria
      await AuditService.log({
        ...req.auditData,
        action: 'admin_invited',
        resourceType: 'admin_user',
        resourceId: newAdmin.id,
        newValues: { email: newAdmin.email, role: newAdmin.role }
      });

      res.status(201).json({
        success: true,
        data: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
          createdAt: newAdmin.created_at
        },
        message: 'Administrador convidado com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }

  // Alterar role de administrador
  async updateAdminRole(req, res, next) {
    try {
      const { clientId, adminId } = req.params;
      const { role } = req.body;
      const { adminUserId } = req.user;

      if (!role) {
        return res.status(400).json({
          error: 'Role é obrigatório',
          code: 'MISSING_ROLE'
        });
      }

      const validRoles = ['master', 'admin', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Role inválido',
          code: 'INVALID_ROLE',
          validRoles
        });
      }

      const oldAdmin = await AdminUserService.getById(adminId);
      const updatedAdmin = await AdminUserService.updateRole(adminId, role, adminUserId);

      // Log de auditoria
      await AuditService.log({
        ...req.auditData,
        action: 'admin_role_updated',
        resourceType: 'admin_user',
        resourceId: adminId,
        oldValues: { role: oldAdmin.role },
        newValues: { role: updatedAdmin.role }
      });

      res.json({
        success: true,
        data: {
          id: updatedAdmin.id,
          email: updatedAdmin.email,
          name: updatedAdmin.name,
          role: updatedAdmin.role,
          updatedAt: updatedAdmin.updated_at
        },
        message: 'Role atualizado com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }

  // Desativar administrador
  async deactivateAdmin(req, res, next) {
    try {
      const { clientId, adminId } = req.params;
      const { adminUserId } = req.user;

      const oldAdmin = await AdminUserService.getById(adminId);
      const deactivatedAdmin = await AdminUserService.deactivateUser(adminId, adminUserId);

      // Log de auditoria
      await AuditService.log({
        ...req.auditData,
        action: 'admin_deactivated',
        resourceType: 'admin_user',
        resourceId: adminId,
        oldValues: { isActive: oldAdmin.is_active },
        newValues: { isActive: deactivatedAdmin.is_active }
      });

      res.json({
        success: true,
        data: {
          id: deactivatedAdmin.id,
          email: deactivatedAdmin.email,
          isActive: deactivatedAdmin.is_active
        },
        message: 'Administrador desativado com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }

  // Obter torneios do usuário
  async getUserTournaments(req, res, next) {
    try {
      const { adminUserId, clientId } = req.user;

      const tournaments = await TournamentPermissionService.getUserTournaments(adminUserId, clientId);

      res.json({
        success: true,
        data: tournaments
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminUserController();