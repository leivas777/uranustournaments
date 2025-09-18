// services/clientService.js
const pool = require('../db/db');

class ClientService {
  async create(clientData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar se documento já existe
      if (clientData.documentNumber) {
        const existingClient = await this.getByDocument(clientData.documentNumber);
        if (existingClient) {
          throw new Error('Cliente com este documento já existe');
        }
      }

      const query = `
        INSERT INTO clients (name, document_number, document_type, email, phone, address)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        clientData.name,
        clientData.documentNumber,
        clientData.documentType,
        clientData.email,
        clientData.phone,
        JSON.stringify(clientData.address || {})
      ];

      const result = await client.query(query, values);
      
      // Criar módulo básico de torneios
      await this.createBasicModules(result.rows[0].id, client);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createBasicModules(clientId, client) {
    const modulesQuery = `
      INSERT INTO client_modules (client_id, module_name, billing_type, price_per_unit, usage_limit)
      VALUES 
        ($1, 'tournaments', 'monthly', 29.90, NULL),
        ($1, 'analytics', 'monthly', 19.90, NULL)
    `;
    
    await client.query(modulesQuery, [clientId]);
  }

  async getById(clientId) {
    const query = `
      SELECT * FROM clients 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [clientId]);
    return result.rows[0];
  }

  async getByDocument(documentNumber) {
    const query = `
      SELECT * FROM clients 
      WHERE document_number = $1 AND deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [documentNumber]);
    return result.rows[0];
  }

  async updateSubscription(clientId, subscriptionData) {
    const query = `
      UPDATE clients 
      SET 
        subscription_plan = $1, 
        subscription_status = $2, 
        subscription_expires_at = $3, 
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [
      subscriptionData.plan,
      subscriptionData.status,
      subscriptionData.expiresAt,
      clientId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getClientModules(clientId) {
    const query = `
      SELECT * FROM client_modules 
      WHERE client_id = $1 
      ORDER BY module_name
    `;
    
    const result = await pool.query(query, [clientId]);
    return result.rows;
  }

  async updateModuleUsage(clientId, moduleName, usageIncrement = 1) {
    const query = `
      UPDATE client_modules 
      SET current_usage = current_usage + $1
      WHERE client_id = $2 AND module_name = $3 AND is_active = true
      RETURNING *
    `;
    
    const result = await pool.query(query, [usageIncrement, clientId, moduleName]);
    return result.rows[0];
  }
}

module.exports = new ClientService();