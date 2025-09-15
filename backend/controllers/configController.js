const pool = require("../db/db");

class ConfigController {
  async getSports(req, res, next) {
    try {
      const result = await pool.query(
        "SELECT sportid, sportname, ptbr FROM sport ORDER BY ptbr"
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  }

  async getTournamentFormats(req, res, next) {
    try {
      const result = pool.query(`
                SELECT tf.id, tf.name, tt.name as type_name
                FROM tournamentformat tf
                JOIN tournamnttypes tt ON tf.tournament_type_id = tt.id
                ORDER BY tt.name, tf.name
            `);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  }

  async getModalityType(req, res, next) {
    try {
      const result = pool.query(`
                SELECT mt.id, mt.name, m.name, as modality_name
                FROM modalitytype mt
                JOIN modality m ON mt.modality_id = m.id
                ORDER BY m.name, mt.name
            `);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  }

  async getGameFormats(req, res, next) {
    try {
      const result = await pool.query(
        "SELECT id, name, description FROM gameformat ORDER BY name"
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  }

  async getAutoCalendarOptions(req, res, next) {
    try {
      const resul = pool.query(
        `SELECT id, option FROM autocalendaroption ORDER BY id`
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConfigController();
