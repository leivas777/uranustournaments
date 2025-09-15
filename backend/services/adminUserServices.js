// services/adminUserService.js
const pool = require('../db/db');
const { getFirebaseAuth } = require('../config/firebase');

class AdminUserService {
  async createFromFirebase(firebaseUser, clientId, role = 'admin', createdBy = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar se o usuário já existe
      const existingUser = await this.getByFirebaseUid(firebaseUser.uid);
      if (existingUser) {
        throw new Error('Usuário já existe');
      }

      const query = `
        INSERT INTO admin_users (firebase_uid, client_id, email, name, avatar_url, role, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        firebaseUser.uid,
        clientId,
        firebaseUser.email,
        firebaseUser.displayName || firebaseUser.email.split('@')[0],
        firebaseUser.photoURL,
        role,
        createdBy
      ];

      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getByFirebaseUid(firebaseUid) {
    const query = `
      SELECT 
        au.*,
        c.name as client_name,
        c.subscription_status,
        c.subscription_plan,
        c.subscription_expires_at
      FROM admin_users au
      JOIN clients c ON au.client_id = c.id
      WHERE au.firebase_uid = $1 AND au.is_active = true AND c.deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [firebaseUid]);
    return result.rows[0];
  }

  async getById(adminUserId) {
    const query = `
      SELECT 
        au.*,
        c.name as client_name,
        c.subscription_status
      FROM admin_users au
      JOIN clients c ON au.client_id = c.id
      WHERE au.id = $1 AND au.is_active = true
    `;
    
    const result = await pool.query(query, [adminUserId]);
    return result.rows[0];
  }

  async getClientAdmins(clientId, requestingUserId) {
    // Verificar se o usuário tem permissão
    const requestingUser = await this.getById(requestingUserId);
    if (requestingUser.client_id !== clientId) {
      throw new Error('Não autorizado');
    }

    const query = `
      SELECT 
        id, email, name, avatar_url, role, is_active, 
        last_login_at, created_at,
        creator.name as created_by_name
      FROM admin_users au
      LEFT JOIN admin_users creator ON au.created_by = creator.id
      WHERE au.client_id = $1
      ORDER BY 
        CASE au.role 
          WHEN 'master' THEN 1 
          WHEN 'admin' THEN 2 
          ELSE 3 
        END,
        au.created_at ASC
    `;
    
    const result = await pool.query(query, [clientId]);
    return result.rows;
  }

  async updateRole(adminUserId, newRole, updatedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updatingUser = await this.getById(updatedBy);
      const targetUser = await this.getById(adminUserId);

      if (!updatingUser || !targetUser) {
        throw new Error('Usuário não encontrado');
      }

      if (updatingUser.client_id !== targetUser.client_id) {
        throw new Error('Não autorizado');
      }

      // Apenas master pode alterar roles
      if (updatingUser.role !== 'master') {
        throw new Error('Apenas master pode alterar roles');
      }

      // Não pode alterar próprio role
      if (adminUserId === updatedBy) {
        throw new Error('Não é possível alterar seu próprio role');
      }

      const query = `
        UPDATE admin_users 
        SET role = $1, updated_at = NOW()
        WHERE id = $2 AND client_id = $3
        RETURNING *
      `;
      
      const result = await client.query(query, [newRole, adminUserId, targetUser.client_id]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateLastLogin(firebaseUid) {
    const query = `
      UPDATE admin_users 
      SET last_login_at = NOW()
      WHERE firebase_uid = $1
      RETURNING id
    `;
    
    await pool.query(query, [firebaseUid]);
  }

  async deactivateUser(adminUserId, deactivatedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const deactivatingUser = await this.getById(deactivatedBy);
      const targetUser = await this.getById(adminUserId);

      if (deactivatingUser.client_id !== targetUser.client_id) {
        throw new Error('Não autorizado');
      }

      if (deactivatingUser.role !== 'master') {
        throw new Error('Apenas master pode desativar usuários');
      }

      if (adminUserId === deactivatedBy) {
        throw new Error('Não é possível desativar a si mesmo');
      }

      const query = `
        UPDATE admin_users 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [adminUserId]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new AdminUserService();