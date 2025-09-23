const pool = require("../db/db");

class RoleService {
  async getAllRoles() {
    try {
      const query = `
        SELECT r.*, 
               COUNT(rp.permission_id) as permission_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        WHERE r.is_active = true
        GROUP BY r.id
        ORDER BY r.level ASC
            `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("❌ Erro no RoleService.getAllRoles:", error);
      throw error;
    }
  }

  async getRoleById(roleId) {
    try {
      const query = `
        SELECT r.*,
               json_agg(
                 json_build_object(
                   'id', p.id,
                   'name', p.name,
                   'display_name', p.display_name,
                   'module', p.module,
                   'action', p.action
                 )
               ) FILTER (WHERE p.id IS NOT NULL) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
        WHERE r.id = $1 AND r.is_active = true
        GROUP BY r.id
            `;

      const result = await pool.query(query, [roleId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("❌ Erro no RoleService.getRoleById:", error);
      throw error;
    }
  }

  async getUserRoles(userId, clientId = null){
    try{
        const query = `
        SELECT r.*, ur.client_id, ur.is_active as tole_active, ur.expires_at,
            c.name as client_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN clients c ON ur.client_id = c.id
        WHERE ur.user_id = $1
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ${clientId ? 'AND ur.client_id = $2': ''}
        ORDER BY r.level ASC
        `;

        const params = clientId ? [userId, clientId]: [userId]
        const result = await pool.query(query, params)
        return result.rows
    }catch(error){
      console.error('❌ Erro no RoleService.getUserRoles:', error);
      throw error;
    }
  }
  async getUserPermissions(userId, clientId = null) {
    try {
      const query = `
        SELECT DISTINCT p.name, p.display_name, p.module, p.action
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1 
        AND ur.is_active = true
        AND p.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ${clientId ? 'AND ur.client_id = $2' : ''}
        ORDER BY p.module, p.action
      `;
      
      const params = clientId ? [userId, clientId] : [userId];
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro no RoleService.getUserPermissions:', error);
      throw error;
    }
  }

  async assignRoleToUser(userId, roleId, clientId = null, assignedBy = null, expiresAt = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar se a role existe
      const roleQuery = 'SELECT * FROM roles WHERE id = $1 AND is_active = true';
      const roleResult = await client.query(roleQuery, [roleId]);
      
      if (roleResult.rows.length === 0) {
        throw new Error('Role não encontrada');
      }

      // Verificar se o usuário existe
      const userQuery = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
      const userResult = await client.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se já existe a atribuição
      const existingQuery = `
        SELECT * FROM user_roles 
        WHERE user_id = $1 AND role_id = $2 AND client_id = $3
      `;
      const existingResult = await client.query(existingQuery, [userId, roleId, clientId]);

      if (existingResult.rows.length > 0) {
        // Atualizar se existir
        const updateQuery = `
          UPDATE user_roles 
          SET is_active = true, expires_at = $4, updated_at = NOW()
          WHERE user_id = $1 AND role_id = $2 AND client_id = $3
          RETURNING *
        `;
        const result = await client.query(updateQuery, [userId, roleId, clientId, expiresAt]);
        await client.query('COMMIT');
        return result.rows[0];
      } else {
        // Inserir nova atribuição
        const insertQuery = `
          INSERT INTO user_roles (user_id, role_id, client_id, assigned_by, expires_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const result = await client.query(insertQuery, [userId, roleId, clientId, assignedBy, expiresAt]);
        await client.query('COMMIT');
        return result.rows[0];
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro no RoleService.assignRoleToUser:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async removeRoleFromUser(userId, roleId, clientId = null) {
    try {
      const query = `
        UPDATE user_roles 
        SET is_active = false, updated_at = NOW()
        WHERE user_id = $1 AND role_id = $2 AND client_id = $3
        RETURNING *
      `;
      
      const result = await pool.query(query, [userId, roleId, clientId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro no RoleService.removeRoleFromUser:', error);
      throw error;
    }
  }

  async hasPermission(userId, permissionName, clientId = null) {
    try {
      const query = `
        SELECT COUNT(*) > 0 as has_permission
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1 
        AND p.name = $2
        AND ur.is_active = true
        AND p.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ${clientId ? 'AND ur.client_id = $3' : ''}
      `;
      
      const params = clientId ? [userId, permissionName, clientId] : [userId, permissionName];
      const result = await pool.query(query, params);
      return result.rows[0].has_permission;
    } catch (error) {
      console.error('❌ Erro no RoleService.hasPermission:', error);
      throw error;
    }
  }

  async isMasterAdmin(userId) {
    try {
      const query = `
        SELECT COUNT(*) > 0 as is_master
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1 
        AND r.name = 'master_admin'
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0].is_master;
    } catch (error) {
      console.error('❌ Erro no RoleService.isMasterAdmin:', error);
      throw error;
    }
  }
}

module.exports = new RoleService()
