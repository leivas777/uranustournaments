// backend/middleware/auth.js (usando sua configuração Firebase)
const firebaseConfig = require('../config/firebase');
const jwtService = require('../services/jwtService');
const userService = require('../services/userService');
const roleService = require('../services/roleService');

class AuthMiddleware {
  // Middleware principal de autenticação
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Token de autenticação não fornecido',
          code: 'NO_TOKEN'
        });
      }

      const token = jwtService.extractTokenFromHeader(authHeader);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Formato de token inválido',
          code: 'INVALID_TOKEN_FORMAT'
        });
      }

      let user;
      let authMethod = 'unknown';

      // Verificar se Firebase está configurado e tentar autenticação Firebase primeiro
      if (firebaseConfig.isFirebaseConfigured()) {
        console.log('🔥 Tentando autenticação Firebase...');
        const firebaseResult = await firebaseConfig.verifyFirebaseToken(token);
        
        if (firebaseResult.success) {
          console.log('✅ Autenticação Firebase bem-sucedida');
          user = await userService.createOrUpdateFromFirebase(firebaseResult.user);
          authMethod = 'firebase';
        } else {
          console.log('❌ Falha na autenticação Firebase:', firebaseResult.error);
        }
      }

      // Se Firebase falhou ou não está configurado, tentar JWT local
      if (!user) {
        console.log('🔑 Tentando autenticação JWT local...');
        try {
          const decoded = jwtService.verifyToken(token);
          user = await userService.getUserById(decoded.userId);
          authMethod = 'jwt';
          
          if (!user) {
            return res.status(401).json({
              success: false,
              error: 'Usuário não encontrado',
              code: 'USER_NOT_FOUND'
            });
          }
          
          console.log('✅ Autenticação JWT bem-sucedida');
        } catch (jwtError) {
          console.log('❌ Falha na autenticação JWT:', jwtError.message);
          return res.status(401).json({
            success: false,
            error: 'Token inválido ou expirado',
            code: 'INVALID_TOKEN',
            details: jwtError.message
          });
        }
      }

      // Verificar se usuário está ativo
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Usuário desativado',
          code: 'USER_INACTIVE'
        });
      }

      // Buscar roles e permissões do usuário
      const userWithRoles = await userService.getUserWithRoles(user.id);
      
      // Adicionar informações do usuário ao request
      req.user = userWithRoles;
      req.userId = user.id;
      req.authMethod = authMethod;
      
      console.log(`✅ Usuário autenticado via ${authMethod}: ${user.email} (ID: ${user.id})`);
      
      // Atualizar último login
      await userService.updateLastLogin(user.id);
      
      next();

    } catch (error) {
      console.error('❌ Erro no middleware de autenticação:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno de autenticação',
        code: 'AUTH_ERROR'
      });
    }
  }

  // Middleware para verificar permissões específicas
  requirePermission(permissionName) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            code: 'NOT_AUTHENTICATED'
          });
        }

        // Verificar se é Master Admin (tem todas as permissões)
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
  }

  // Middleware para verificar se usuário pertence a um cliente específico
  requireClientAccess(clientIdParam = 'clientId') {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            code: 'NOT_AUTHENTICATED'
          });
        }

        const clientId = req.params[clientIdParam] || req.body.clientId || req.query.clientId;
        
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
  }

  // Middleware opcional (não falha se não autenticado)
  optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('⚠️ Nenhum token fornecido - continuando sem autenticação');
      return next();
    }

    // Tentar autenticar, mas não falhar se não conseguir
    this.authenticate(req, res, (error) => {
      if (error) {
        console.log('⚠️ Autenticação opcional falhou, continuando sem usuário');
      }
      next();
    });
  }

  // Middleware para verificar se é Master Admin
  requireMasterAdmin(req, res, next) {
    return this.requirePermission('system.admin')(req, res, next);
  }

  // Middleware para verificar múltiplas permissões (OR)
  requireAnyPermission(permissions) {
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
  }
}

module.exports = new AuthMiddleware();