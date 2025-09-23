// backend/routes/auth.js (versão corrigida)
const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const jwtService = require('../services/jwtService');
const firebaseConfig = require('../config/firebase');
const authMiddleware = require('../middleware/auth');

// ===== ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) =====

// POST /api/auth/login - Login com email/senha (desenvolvimento)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      });
    }

    console.log(`🔑 Tentativa de login para: ${email}`);

    // Buscar usuário por email
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar se usuário está ativo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Usuário desativado',
        code: 'USER_INACTIVE'
      });
    }

    // Para desenvolvimento, aceitar qualquer senha para usuários sem Firebase
    // Em produção, você deve implementar hash de senha adequado
    if (!user.firebase_uid) {
      console.log('⚠️ Login de desenvolvimento - senha não verificada');
    }

    // Buscar usuário com roles
    const userWithRoles = await userService.getUserWithRoles(user.id);

    // Gerar token JWT
    const token = jwtService.generateToken({
      userId: user.id,
      email: user.email
    });

    // Atualizar último login
    await userService.updateLastLogin(user.id);

    console.log(`✅ Login bem-sucedido para: ${email}`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userWithRoles.id,
          email: userWithRoles.email,
          name: userWithRoles.name,
          avatar_url: userWithRoles.avatar_url,
          roles: userWithRoles.roles.map(r => ({
            name: r.name,
            display_name: r.display_name,
            client_id: r.client_id
          })),
          permissions: userWithRoles.permissions
        }
      },
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/firebase - Login com token Firebase
router.post('/firebase', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Token Firebase é obrigatório',
        code: 'MISSING_TOKEN'
      });
    }

    console.log('🔥 Tentativa de login Firebase');

    // Verificar token Firebase
    const firebaseResult = await firebaseConfig.verifyFirebaseToken(idToken);
    
    if (!firebaseResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Token Firebase inválido',
        code: 'INVALID_FIREBASE_TOKEN',
        details: firebaseResult.error
      });
    }

    // Criar ou atualizar usuário
    const user = await userService.createOrUpdateFromFirebase(firebaseResult.user);

    // Buscar usuário com roles
    const userWithRoles = await userService.getUserWithRoles(user.id);

    // Gerar token JWT
    const token = jwtService.generateToken({
      userId: user.id,
      email: user.email
    });

    console.log(`✅ Login Firebase bem-sucedido para: ${user.email}`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userWithRoles.id,
          email: userWithRoles.email,
          name: userWithRoles.name,
          avatar_url: userWithRoles.avatar_url,
          firebase_uid: userWithRoles.firebase_uid,
          email_verified: userWithRoles.email_verified,
          roles: userWithRoles.roles.map(r => ({
            name: r.name,
            display_name: r.display_name,
            client_id: r.client_id
          })),
          permissions: userWithRoles.permissions
        }
      },
      message: 'Login Firebase realizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no login Firebase:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/register - Registro de usuário (desenvolvimento)
router.post('/register', async (req, res) => {
  try {
    const { email, name, phone } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email e nome são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    console.log(`👤 Tentativa de registro para: ${email}`);

    // Criar usuário
    const user = await userService.createUser({
      email,
      name,
      phone: phone || null
    });

    // Buscar usuário com roles
    const userWithRoles = await userService.getUserWithRoles(user.id);

    // Gerar token JWT
    const token = jwtService.generateToken({
      userId: user.id,
      email: user.email
    });

    console.log(`✅ Registro bem-sucedido para: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userWithRoles.id,
          email: userWithRoles.email,
          name: userWithRoles.name,
          roles: userWithRoles.roles.map(r => ({
            name: r.name,
            display_name: r.display_name,
            client_id: r.client_id
          })),
          permissions: userWithRoles.permissions
        }
      },
      message: 'Usuário registrado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    
    if (error.message.includes('já existe')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'USER_EXISTS'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ===== ROTAS PROTEGIDAS (COM AUTENTICAÇÃO) =====

// GET /api/auth/me - Informações do usuário autenticado
router.get('/me', 
  authMiddleware.authenticate,
  async (req, res) => {
    try {
      console.log(`👤 Usuário ${req.user.email} solicitando próprias informações`);

      res.json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          phone: req.user.phone,
          avatar_url: req.user.avatar_url,
          firebase_uid: req.user.firebase_uid,
          email_verified: req.user.email_verified,
          last_login: req.user.last_login,
          roles: req.user.roles.map(r => ({
            name: r.name,
            display_name: r.display_name,
            client_id: r.client_id,
            client_name: r.client_name
          })),
          permissions: req.user.permissions
        }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar informações do usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// POST /api/auth/refresh - Renovar token
router.post('/refresh',
  authMiddleware.authenticate,
  async (req, res) => {
    try {
      console.log(`🔄 Renovando token para usuário: ${req.user.email}`);

      // Gerar novo token
      const token = jwtService.generateToken({
        userId: req.user.id,
        email: req.user.email
      });

      res.json({
        success: true,
        data: { token },
        message: 'Token renovado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

module.exports = router;