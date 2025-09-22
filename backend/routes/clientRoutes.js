// routes/clientRoutes.js
const express = require("express");
const router = express.Router();
const ClientController = require("../controllers/clientController");
const { authenticateFirebase } = require("../middleware/firebaseAuth");
const {
  requireClientAccess,
  requireRole,
} = require("../middleware/authorization");
const { auditAction } = require("../middleware/audit");
const clientController = require("../controllers/clientController");

// Todas as rotas precisam de autenticação

//Criar cliente
router.post("/", ClientController.create);
router.get("/", ClientController.getAll);
router.get("/:id", ClientController.getById);
router.delete("/:id", clientController.delete);
router.put("/:id", clientController.update);

// Dados do cliente
router.get(
  "/clients/:clientId",
  requireClientAccess(),
  ClientController.getClient
);

router.put(
  "/clients/:clientId",
  requireClientAccess(),
  requireRole(["master"]),
  auditAction("client_updated", "client"),
  ClientController.updateClient
);

// Módulos do cliente
router.get(
  "/clients/:clientId/modules",
  requireClientAccess(),
  ClientController.getClientModules
);

// Logs de auditoria
router.get(
  "/clients/:clientId/audit-logs",
  requireClientAccess(),
  requireRole(["master", "admin"]),
  ClientController.getAuditLogs
);

module.exports = router;
