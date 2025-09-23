// backend/routes/clientRoutes.js (versão de debug)
const express = require("express");
const router = express.Router();

// Verificar se o controller existe
let ClientController;
try {
  ClientController = require("../controllers/clientController");
  console.log('✅ ClientController carregado com sucesso');
  console.log('Métodos disponíveis:', Object.getOwnPropertyNames(Object.getPrototypeOf(ClientController)));
} catch (error) {
  console.error('❌ Erro ao carregar ClientController:', error);
  throw error;
}

// Verificar middlewares
let authenticateFirebase;
try {
  const firebaseAuth = require("../middleware/firebaseAuth");
  authenticateFirebase = firebaseAuth.authenticateFirebase;
  console.log('✅ authenticateFirebase carregado');
} catch (error) {
  console.error('❌ Erro ao carregar firebaseAuth:', error);
  authenticateFirebase = (req, res, next) => {
    console.log('⚠️ Usando middleware de auth placeholder');
    req.user = { id: 1, email: 'test@test.com' }; // Mock para debug
    next();
  };
}

let requireClientAccess, requireRole, requirePermission, requireAnyPermission;
try {
  const authorization = require("../middleware/authorization");
  requireClientAccess = authorization.requireClientAccess;
  requireRole = authorization.requireRole;
  requirePermission = authorization.requirePermission;
  requireAnyPermission = authorization.requireAnyPermission;
  console.log('✅ Middlewares de autorização carregados');
} catch (error) {
  console.error('❌ Erro ao carregar authorization:', error);
  // Criar placeholders
  requireClientAccess = () => (req, res, next) => next();
  requireRole = () => (req, res, next) => next();
  requirePermission = () => (req, res, next) => next();
  requireAnyPermission = () => (req, res, next) => next();
}

let auditAction;
try {
  const audit = require("../middleware/audit");
  auditAction = audit.auditAction;
  console.log('✅ auditAction carregado');
} catch (error) {
  console.error('❌ Erro ao carregar audit:', error);
  auditAction = (action, entityType) => (req, res, next) => {
    console.log(`📋 Audit placeholder: ${action} on ${entityType}`);
    next();
  };
}

// Aplicar autenticação em todas as rotas
router.use(authenticateFirebase);

// === ROTAS BÁSICAS (uma por vez para debug) ===

// Testar rota GET primeiro
router.get("/", 
  requireAnyPermission(['clients.read', 'clients.manage']),
  ClientController.getAll
);


router.post("/", 
  requirePermission('clients.create'),
  auditAction("client_created", "client"),
  ClientController.create
);

router.get("/:id", 
  requireAnyPermission(['clients.read', 'clients.manage']),
  requireClientAccess('id'),
  ClientController.getById
);

router.put("/:id", 
  requireAnyPermission(['clients.update', 'clients.manage']),
  requireClientAccess('id'),
  auditAction("client_updated", "client"),
  ClientController.update
);

router.delete("/:id", 
  requirePermission('clients.delete'),
  requireClientAccess('id'),
  auditAction("client_deleted", "client"),
  ClientController.delete
);


console.log('✅ Rotas de cliente carregadas (modo debug)');

module.exports = router;