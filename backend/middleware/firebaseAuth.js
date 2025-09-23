// backend/middleware/firebaseAuth.js (versão atualizada)
const firebaseConfig = require('../config/firebase');
const jwtService = require('../services/jwtService');
const userService = require('../services/userService');

const authenticateFirebase = async (req, res, next) => {
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
    
    // Adicionar informações do usuário ao request (mantendo compatibilidade)
    req.user = userWithRoles;
    req.userId = user.id;
    req.authMethod = authMethod;
    
    // Atualizar último login
    await userService.updateLastLogin(user.id);
    
    console.log(`✅ Usuário autenticado via ${authMethod}: ${user.email} (ID: ${user.id})`);
    next();

  } catch (error) {
    console.error('❌ Erro no middleware de autenticação Firebase:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = { authenticateFirebase };