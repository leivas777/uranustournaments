// services/auditService.js
const pool = require('../db/db');

class AuditService {
  async log(auditData) {
    try {
      const query = `
        INSERT INTO audit_logs (
          client_id, admin_user_id, action, resource_type, resource_id,
          old_values, new_values, ip_address, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;

      const values = [
        auditData.clientId,
        auditData.adminUserId,
        auditData.action,
        auditData.resourceType,
        auditData.resourceId,
        JSON.stringify(auditData.oldValues || {}),
        JSON.stringify(auditData.newValues || {}),
        auditData.ipAddress,
        auditData.userAgent
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error);
      // Não falhar a operação principal por erro de auditoria
    }
  }

  async getClientLogs(clientId, limit = 100, offset = 0) {
    const query = `
      SELECT 
        al.*,
        au.name as admin_name,
        au.email as admin_email
      FROM audit_logs al
      LEFT JOIN admin_users au ON al.admin_user_id = au.id
      WHERE al.client_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [clientId, limit, offset]);
    return result.rows;
  }

  async getTournamentLogs(tournamentId, limit = 50) {
    const query = `
      SELECT 
        al.*,
        au.name as admin_name,
        au.email as admin_email
      FROM audit_logs al
      LEFT JOIN admin_users au ON al.admin_user_id = au.id
      WHERE al.resource_type = 'tournament' AND al.resource_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [tournamentId, limit]);
    return result.rows;
  }
}

module.exports = new AuditService();