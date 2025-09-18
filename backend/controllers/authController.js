// controllers/authController.js
const AdminUserService = require('../services/adminUserService');
const ClientService = require('../services/clientService');
const TournamentPermissionService = require('../services/tournamentPermissionService');
const AuditService = require('../services/auditService');
const { getFirebaseAuth } = require('../config/firebase');

class AuthController {
  // Login/Registro de usuário
  async loginOrRegister(req, res, next) {
    try {
      const { firebaseToken, clientData } = req.body;

      if (!firebaseToken) {
        return res.status(400).json({
          error: 'Token do Firebase é obrigatório',
          code: 'MISSING_FIREBASE_TOKEN'
        });
      }

      // Verificar token do Firebase
      const decodedToken = await getFirebaseAuth().verifyIdToken(firebaseToken);
      
      // Buscar usuário existente
      let adminUser = await AdminUserService.getByFirebaseUid(decodedToken.uid);

      if (adminUser) {
        // Usuário já existe - fazer login
        await AdminUserService.updateLastLogin(decodedToken.uid);
        
        return res.json({
          success: true,
          data: {
            user: {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name,
              role: adminUser.role,
              clientId: adminUser.client_id,
              clientName: adminUser.client_name
            },
            isNewUser: false
          }
        });
      }

      // Usuário novo - precisa de dados do cliente
      if (!clientData) {
        return res.status(400).json({
          error: 'Dados do cliente são obrigatórios para novos usuários',
          code: 'MISSING_CLIENT_DATA'
        });
      }

      // Criar cliente
      const client = await ClientService.create(clientData);

      // Criar usuário admin master
      adminUser = await AdminUserService.createFromFirebase(
        {
          uid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture
        },
        client.id,
        'master' // Primeiro usuário é sempre master
      );

      // Log de auditoria
      await AuditService.log({
        clientId: client.id,
        adminUserId: adminUser.id,
        action: 'user_registered',
        resourceType: 'admin_user',
        resourceId: adminUser.id,
        newValues: { email: adminUser.email, role: adminUser.role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
            clientId: adminUser.client_id,
            clientName: client.name
          },
          client: {
            id: client.id,
            name: client.name
          },
          isNewUser: true
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Obter perfil do usuário logado
  async getProfile(req, res, next) {
    try {
      const { adminUserId } = req.user;

      const adminUser = await AdminUserService.getById(adminUserId);
      
      if (!adminUser) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          avatarUrl: adminUser.avatar_url,
          role: adminUser.role,
          permissions: adminUser.permissions,
          clientId: adminUser.client_id,
          clientName: adminUser.client_name,
          lastLoginAt: adminUser.last_login_at,
          createdAt: adminUser.created_at
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Logout (invalidar token no Firebase)
  async logout(req, res, next) {
    try {
      const { firebaseUid } = req.user;

      // Revogar tokens do usuário no Firebase
      await getFirebaseAuth().revokeRefreshTokens(firebaseUid);

      // Log de auditoria
      await AuditService.log({
        ...req.auditData,
        action: 'user_logout',
        resourceType: 'admin_user',
        resourceId: req.user.adminUserId
      });

      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();