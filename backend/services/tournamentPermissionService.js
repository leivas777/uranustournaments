// services/tournamentPermissionService.js
const pool = require("../db/db");

class TournamentPermissionService {
  async grantAccess(tournamentId, adminUserId, permissionLevel, grantedBy) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verificar se quem está concedendo tem permissão
      const granterPermission = await this.getUserPermission(
        tournamentId,
        grantedBy
      );
      if (
        !granterPermission ||
        (granterPermission.permission_level !== "owner" &&
          granterPermission.permission_level !== "editor")
      ) {
        throw new Error("Sem permissão para conceder acesso");
      }

      const query = `
        INSERT INTO tournament_permissions (tournament_id, admin_user_id, permission_level, granted_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tournament_id, admin_user_id) 
        DO UPDATE SET permission_level = $3, granted_by = $4, granted_at = NOW()
        RETURNING *
      `;

      const result = await client.query(query, [
        tournamentId,
        adminUserId,
        permissionLevel,
        grantedBy,
      ]);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async revokeAccess(tournamentId, adminUserId, revokedBy) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verificar se quem está revogando tem permissão
      const revokerPermission = await this.getUserPermission(
        tournamentId,
        revokedBy
      );
      if (
        !revokerPermission ||
        revokerPermission.permission_level !== "owner"
      ) {
        throw new Error("Apenas o owner pode revogar acesso");
      }

      // Não permitir que o owner revogue seu próprio acesso
      const targetPermission = await this.getUserPermission(
        tournamentId,
        adminUserId
      );
      if (
        targetPermission &&
        targetPermission.permission_level === "owner" &&
        adminUserId === revokedBy
      ) {
        throw new Error("Owner não pode revogar seu próprio acesso");
      }

      const query = `
        DELETE FROM tournament_permissions 
        WHERE tournament_id = $1 AND admin_user_id = $2 AND permission_level != 'owner'
        RETURNING *
      `;

      const result = await client.query(query, [tournamentId, adminUserId]);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async checkAccess(tournamentId, adminUserId, requiredLevel = "viewer") {
    try {
      // Buscar permissão do usuário
      const permission = await this.getUserPermission(
        tournamentId,
        adminUserId
      );

      if (!permission) {
        // Verificar se o torneio tem acesso aberto
        const tournament = await this.getTournamentAccessControl(tournamentId);
        return tournament && tournament.access_control === "open";
      }

      // Verificar nível de permissão
      const permissionLevels = {
        viewer: 1,
        editor: 2,
        owner: 3,
      };

      const userLevel = permissionLevels[permission.permission_level] || 0;
      const requiredLevelNum = permissionLevels[requiredLevel] || 0;

      return userLevel >= requiredLevelNum;
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      return false;
    }
  }

  async getUserPermission(tournamentId, adminUserId) {
    const query = `
      SELECT tp.*, au.role as user_role
      FROM tournament_permissions tp
      JOIN admin_users au ON tp.admin_user_id = au.id
      WHERE tp.tournament_id = $1 AND tp.admin_user_id = $2
    `;

    const result = await pool.query(query, [tournamentId, adminUserId]);
    return result.rows[0];
  }

  async getTournamentAccessControl(tournamentId) {
    const query = `
      SELECT access_control, allowed_admins, created_by
      FROM tournaments 
      WHERE id = $1
    `;

    const result = await pool.query(query, [tournamentId]);
    return result.rows[0];
  }

  async getTournamentPermissions(tournamentId) {
    const query = `
      SELECT 
        tp.*,
        au.name as admin_name,
        au.email as admin_email,
        au.role as admin_role,
        granter.name as granted_by_name
      FROM tournament_permissions tp
      JOIN admin_users au ON tp.admin_user_id = au.id
      LEFT JOIN admin_users granter ON tp.granted_by = granter.id
      WHERE tp.tournament_id = $1
      ORDER BY tp.permission_level DESC, tp.granted_at ASC
    `;

    const result = await pool.query(query, [tournamentId]);
    return result.rows;
  }

  async createOwnerPermission(tournamentId, ownerId) {
    const query = `
      INSERT INTO tournament_permissions (tournament_id, admin_user_id, permission_level, granted_by)
      VALUES ($1, $2, 'owner', $2)
      RETURNING *
    `;

    const result = await pool.query(query, [tournamentId, ownerId]);
    return result.rows[0];
  }

  async getUserTournaments(adminUserId, clientId) {
    const query = `
      SELECT DISTINCT
        t.*,
        tp.permission_level,
        CASE 
          WHEN tp.permission_level IS NOT NULL THEN tp.permission_level
          WHEN t.access_control = 'open' THEN 'viewer'
          ELSE NULL
        END as effective_permission
      FROM tournaments t
      LEFT JOIN tournament_permissions tp ON t.id = tp.tournament_id AND tp.admin_user_id = $1
      WHERE t.client_id = $2 
        AND (
          tp.admin_user_id = $1 
          OR t.access_control = 'open'
          OR t.created_by = $1
        )
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [adminUserId, clientId]);
    return result.rows;
  }
}

module.exports = new TournamentPermissionService();
