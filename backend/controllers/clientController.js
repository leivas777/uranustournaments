// controllers/clientController.js
const ClientService = require('../services/clientService');
const AuditService = require('../services/auditService');

class ClientController {
  // Obter dados do cliente
  async getClient(req, res, next) {
    try {
      const { clientId } = req.params;

      const client = await ClientService.getById(clientId);
      
      if (!client) {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          code: 'CLIENT_NOT_FOUND'
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
          createdAt: client.created_at
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Atualizar dados do cliente
  async updateClient(req, res, next) {
    try {
      const { clientId } = req.params;
      const updateData = req.body;
      const { role } = req.user;

      // Apenas masters podem atualizar dados do cliente
      if (role !== 'master') {
        return res.status(403).json({
          error: 'Apenas masters podem atualizar dados do cliente',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      const oldClient = await ClientService.getById(clientId);
      if (!oldClient) {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          code: 'CLIENT_NOT_FOUND'
        });
      }

      // Aqui você implementaria o método updateClient no ClientService
      // const updatedClient = await ClientService.update(clientId, updateData);

      // Log de auditoria
      await AuditService.log({
        ...req.auditData,
        action: 'client_updated',
        resourceType: 'client',
        resourceId: clientId,
        oldValues: { name: oldClient.name, email: oldClient.email },
        newValues: updateData
      });

      res.json({
        success: true,
        message: 'Cliente atualizado com sucesso'
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
        data: modules
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
        data: logs
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientController();