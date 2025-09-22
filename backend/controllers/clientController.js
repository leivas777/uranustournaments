// controllers/clientController.js
const ClientService = require("../services/clientService");
const AuditService = require("../services/auditService");

class ClientController {
  async create(req, res) {
    try {
      const clientData = req.body;

      if (!clientData.name || !clientData.email || !clientData.documentNumber) {
        return res.status(400).json({
          success: false,
          error: "Dados obrigatórios não fornecidos",
          code: "MISSING_REQUIRED_FIELDS",
        });
      }

      if (!clientData.address) {
        return res.status(400).json({
          success: false,
          error: "Endereço é obrigatório",
          code: "MISSING_ADDRESS",
        });
      }

      const result = await ClientService.create(clientData);

      res.status(201).json({
        success: true,
        data: result,
        message: "Cliente criado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro ao criar cliente:", error);

      if (error.message.includes("já existe")) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: "DUPLICATE_CLIENT",
        });
      }

      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async getAll(req, res) {
    try {
      const result = await ClientService.getAll();

      res.json({
        success: true,
        data: result,
        count: result.length,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar clientes:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      });
    }
  }

  // Obter dados do cliente
  async getClient(req, res, next) {
    try {
      const { clientId } = req.params;

      const client = await ClientService.getById(clientId);

      if (!client) {
        return res.status(404).json({
          error: "Cliente não encontrado",
          code: "CLIENT_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: {
          id: client.id,
          name: client.name,
          documentNumber: client.document_number,
          documentType: client.document_type,
          email: client.email,
          phone: client.phone,
          address: client.address,
          subscriptionPlan: client.subscription_plan,
          subscriptionStatus: client.subscription_status,
          subscriptionExpiresAt: client.subscription_expires_at,
          createdAt: client.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await ClientService.getById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Cliente não encontrado",
          code: "CLIENT_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar cliente:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      });
    }
  }

  // Atualizar dados do cliente
  async updateClient(req, res, next) {
    try {
      const { clientId } = req.params;
      const updateData = req.body;
      // const { role } = req.user;

      // // Apenas masters podem atualizar dados do cliente
      // if (role !== "master") {
      //   return res.status(403).json({
      //     error: "Apenas masters podem atualizar dados do cliente",
      //     code: "INSUFFICIENT_PERMISSIONS",
      //   });
      // }

      const oldClient = await ClientService.getById(clientId);
      console.log(oldClient);
      if (!oldClient) {
        return res.status(404).json({
          error: "Cliente não encontrado",
          code: "CLIENT_NOT_FOUND",
        });
      }

      // Aqui você implementaria o método updateClient no ClientService
      const updatedClient = await ClientService.update(clientId, updateData);

      // Log de auditoria
      await AuditService.log({
        ...req.auditData,
        action: "client_updated",
        resourceType: "client",
        resourceId: clientId,
        oldValues: { name: oldClient.name, email: oldClient.email },
        newValues: updateData,
      });

      res.json({
        success: true,
        message: "Cliente atualizado com sucesso",
        // data: updatedClient
      });
    } catch (error) {
      next(error);
    }
  }

  // Obter módulos do cliente
  async getClientModules(req, res, next) {
    try {
      const { clientId } = req.params;

      const modules = await ClientService.getClientModules(clientId);

      res.json({
        success: true,
        data: modules,
      });
    } catch (error) {
      next(error);
    }
  }

  // Obter logs de auditoria do cliente
  async getAuditLogs(req, res, next) {
    try {
      const { clientId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const logs = await AuditService.getClientLogs(
        clientId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const clientData = req.body;

      const result = await ClientService.update(id, clientData);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Cliente não encontrado",
          code: "CLIENT_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: result,
        message: "Cliente atualizado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro ao atualizar cliente:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await ClientService.delete(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Cliente não encontrado",
          code: "CLIENT_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        message: "Cliente deletado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro ao deletar cliente:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      });
    }
  }
}

module.exports = new ClientController();
