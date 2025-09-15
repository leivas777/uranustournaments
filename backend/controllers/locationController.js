const pool = require("../db/db");

class LocationController {
  async getFederativeUnities(req, res, next) {
    try {
      const result = await pool.query(
        "SELECT id, federativeunity FROM federativeunities ORDER BY federativeunity"
      );
      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }
  async getCitiesByStates(req, res, next) {
    try {
      const { stateId } = req.params;
      const result = await pool.query(
        "SELECT id, city FROM cities WHERE federalunityid = $1 ORDER BY city",
        [stateId]
      );
      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LocationController();
