// backend/services/clientService.js
const pool = require("../db/db");
const {
  validateBrazilianAddress,
  sanitizeAddress,
} = require("../validators/addressValidator");

class ClientService {
  async create(clientData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (clientData.address) {
        const addressValidation = validateBrazilianAddress(clientData.address);

        if (!addressValidation.isValid) {
          const errorMessages = Object.values(addressValidation.errors).join(
            ","
          );
          throw new Error(`Endereço invaálido: ${errorMessages}`);
        }

      }

      // Verificar se documento já existe
      if (clientData.documentNumber) {
        const existingClient = await this.getByDocument(
          clientData.documentNumber
        );
        if (existingClient) {
          throw new Error("Cliente com este documento já existe");
        }
      }

      // Verificar se email já existe
      if (clientData.email) {
        const existingEmail = await this.getByEmail(clientData.email, client);
        if (existingEmail) {
          throw new Error("Cliente com este email já existe");
        }
      }

      const sanitizedAddress = clientData.address
        ? sanitizeAddress(clientData.address)
        : {};

      const query = `
        INSERT INTO clients (name, document_number, document_type, email, phone, address, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        clientData.name,
        clientData.documentNumber,
        clientData.documentType || "CNPJ",
        clientData.email,
        clientData.phone || null,
        JSON.stringify(sanitizedAddress),
      ];

      const result = await client.query(query, values);

      // Criar módulo básico de torneios
      await this.createBasicModules(result.rows[0].id, client);

      await client.query("COMMIT");

      // Parse do endereço antes de retornar
      const createdClient = result.rows[0];

      if (typeof createdClient.address === "string") {
        try {
          createdClient.address = JSON.parse(createdClient.address);
        } catch (erro) {
          console.error("❌ Erro no parse do endereço:", parseError);
          createdClient.address = {};
        }
      }

      return createdClient;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Erro no ClientService.create:", error);
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

  async getAll() {
    try {
      const query = `
        SELECT * FROM clients 
        WHERE deleted_at IS NULL 
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query);

      // Parse do endereço para cada cliente
      const clients = result.rows.map((client) => ({
        ...client,
        address:
          typeof client.address === "string"
            ? JSON.parse(client.address)
            : client.address,
      }));

      return clients;
    } catch (error) {
      console.error("❌ Erro no ClientService.getAll:", error);
      throw error;
    }
  }

  async getById(clientId) {
    try {
      const query = `
        SELECT * FROM clients 
        WHERE id = $1 AND deleted_at IS NULL
      `;

      const result = await pool.query(query, [clientId]);

      if (result.rows.length === 0) {
        return null;
      }

      const client = result.rows[0];

      // Parse do endereço se for string
      if (typeof client.address === "string") {
        try {
          client.address = JSON.parse(client.address);
        } catch (parseError) {
          console.error("❌ Erro ao fazer parse do endereço:", parseError);
          client.address = {};
        }
      }

      return client;
    } catch (error) {
      console.error("❌ Erro no ClientService.getById:", error);
      throw error;
    }
  }

  async getByDocument(documentNumber, client = null) {
    const queryClient = client || pool;

    try {
      const query = `
        SELECT * FROM clients 
        WHERE document_number = $1 AND deleted_at IS NULL
      `;

      const result = await queryClient.query(query, [documentNumber]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("❌ Erro no ClientService.getByDocument:", error);
      throw error;
    }
  }

  async getByEmail(email, client = null) {
    const queryClient = client || pool;

    try {
      const query = `
        SELECT * FROM clients
        WHERE email = $1 AND deleted_at IS NULL
      `;

      const result = await queryClient.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("❌ Erro no ClientService.getByEmail:", error);
      throw error;
    }
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
      clientId,
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

    const result = await pool.query(query, [
      usageIncrement,
      clientId,
      moduleName,
    ]);
    return result.rows[0];
  }

  async update(id, clientData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verificar se cliente existe
      const existingClient = await this.getById(id);
      if (!existingClient) {
        throw new Error("Cliente não encontrado");
      }

      // Preparar endereço para salvar
      let addressToSave = existingClient.address || {};

      if (clientData.address) {
        const addressValidation = validateBrazilianAddress(clientData.address);

        if (!addressValidation.isValid) {
          const errorMessages = Object.values(addressValidation.errors).join(
            ","
          );
          throw new Error(`Endereço inválido: ${errorMessages}`);
        }

        addressToSave = sanitizeAddress(clientData.address);
      }

      // Verificar se documento já existe (se estiver sendo alterado)
      if (
        clientData.documentNumber &&
        clientData.documentNumber !== existingClient.document_number
      ) {
        const existingDoc = await this.getByDocument(
          clientData.documentNumber,
          client
        );
        if (existingDoc && existingDoc.id !== parseInt(id)) {
          throw new Error("Cliente com este documento já existe");
        }
      }

      // Verificar se email já existe (se estiver sendo alterado)
      if (clientData.email && clientData.email !== existingClient.email) {
        const existingEmail = await this.getByEmail(clientData.email, client);
        if (existingEmail && existingEmail.id !== parseInt(id)) {
          throw new Error("Cliente com este email já existe"); // CORRIGIDO: era newError
        }
      }

      const query = `
        UPDATE clients 
        SET name = $1, document_number = $2, document_type = $3, 
            email = $4, phone = $5, address = $6, updated_at = NOW()
        WHERE id = $7 AND deleted_at IS NULL
        RETURNING *
      `;

      const values = [
        clientData.name || existingClient.name,
        clientData.documentNumber || existingClient.document_number,
        clientData.documentType || existingClient.document_type,
        clientData.email || existingClient.email,
        clientData.phone !== undefined
          ? clientData.phone
          : existingClient.phone,
        JSON.stringify(addressToSave),
        id,
      ];

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error("Falha ao atualizar cliente");
      }

      await client.query("COMMIT");

      const updatedClient = result.rows[0];

      // Parse do endereço antes de retornar
      try {
        updatedClient.address = JSON.parse(updatedClient.address);
      } catch (parseError) {
        console.error(
          "❌ Erro ao fazer parse do endereço atualizado:",
          parseError
        );
        updatedClient.address = {};
      }

      return updatedClient;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Erro no ClientService.update:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id) {
    try {
      // Soft delete
      const query = `
        UPDATE clients 
        SET deleted_at = NOW() 
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return { id: result.rows[0].id };
    } catch (error) {
      console.error("❌ Erro no ClientService.delete:", error);
      throw error;
    }
  }
}

module.exports = new ClientService();
