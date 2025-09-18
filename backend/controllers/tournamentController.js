const pool = require("../db/db");
const TournamentService = require("../services/tournamentService");

class TournamentController {
  async createDraft(req, res, next) {
    try {
      const tournamentData = req.body;
      const result = await TournamentService.createDraft(tournamentData);
      res.status(201).json({
        success: true,
        data: result,
        message: "Rascunho do torneio criado com sucesso.",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSportAndModalities(req, res, next) {
    try {
      const { id } = req.params;
      const { sportId, modalities } = req.body;

      const result = await TournamentService.updateSportAndModalities(
        id,
        sportId,
        modalities
      );
      res.json({
        success: true,
        data: result,
        message: "Esporte e modalidades atualizados com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCalendarAndFormat(req, res, next) {
    try {
      const { id } = req.params;
      const calendarData = req.body;
      console.log(calendarData)
      const result = await TournamentService.updateCalendarAndFormat(
        id,
        calendarData
      );
      res.json({
        success: true,
        data: result,
        message: "Configurações de calendário atualizadas com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFinalPhase(req, res, next) {
    try {
      const { id } = req.params;
      const finalPhaseData = req.body;
      const result = await TournamentService.updateFinalPhase(
        id,
        finalPhaseData
      );
      res.json({
        success: true,
        data: result,
        message: "Configurações da fase final atualizadas com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  async finalizeTournament(req, res, next) {
    try {
      const { id } = req.params;
      const result = TournamentService.finalizeTournament(id);
      res.json({
        success: true,
        data: result,
        message: "Torneio finalizado com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  async getTournamentSummary(req, res, next) {
    try {
      const { id } = req.params;
      const result = TournamentService.getTournamentSummary(id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDraft(req, res, next) {
    try {
      const { id } = req.params;
      await TournamentService.deleteDraft(id);
      res.json({
        success: true,
        message: "Rascunho deletado com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TournamentController();
