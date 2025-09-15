// tests/controllers/tournamentController.test.js
const request = require('supertest');
const express = require('express');
const TournamentController = require('../../controllers/tournamentController');
const TournamentService = require('../../services/tournamentServices');

// Mock do service
jest.mock('../../services/tournamentService');

const app = express();
app.use(express.json());

// Rotas para teste
app.post('/tournaments/draft', TournamentController.createDraft);
app.put('/tournaments/:tournamentId/sport', TournamentController.updateSportAndModalities);
app.put('/tournaments/:tournamentId/calendar', TournamentController.updateCalendarAndFormat);
app.put('/tournaments/:tournamentId/final-phase', TournamentController.updateFinalPhase);
app.put('/tournaments/:tournamentId/finalize', TournamentController.finalizeTournament);

describe('TournamentController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /tournaments/draft', () => {
    it('deve criar rascunho com dados válidos', async () => {
      const tournamentData = {
        name: 'Torneio Teste',
        clubName: 'Clube Teste',
        cityId: 1,
        tournamentFormatId: 1
      };

      const expectedResult = { id: 1, ...tournamentData, status: 'draft' };
      TournamentService.createDraft.mockResolvedValue(expectedResult);

      const response = await request(app)
        .post('/tournaments/draft')
        .send(tournamentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expectedResult);
      expect(TournamentService.createDraft).toHaveBeenCalledWith(tournamentData);
    });

    it('deve retornar erro 500 se service falhar', async () => {
      TournamentService.createDraft.mockRejectedValue(new Error('Database error'));

      await request(app)
        .post('/tournaments/draft')
        .send({})
        .expect(500);
    });
  });

  describe('PUT /tournaments/:tournamentId/sport', () => {
    it('deve atualizar esporte e modalidades', async () => {
      const tournamentId = 1;
      const updateData = {
        sportId: 2,
        modalities: [{ modalityTypeId: 1, maxParticipants: 16 }]
      };

      TournamentService.updateSportAndModalities.mockResolvedValue({
        tournamentId,
        sportId: 2,
        modalitiesCount: 1
      });

      const response = await request(app)
        .put(`/tournaments/${tournamentId}/sport`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(TournamentService.updateSportAndModalities).toHaveBeenCalledWith(
        tournamentId.toString(),
        updateData.sportId,
        updateData.modalities
      );
    });
  });

  describe('PUT /tournaments/:tournamentId/finalize', () => {
    it('deve finalizar torneio', async () => {
      const tournamentId = 1;
      const expectedResult = { id: 1, status: 'active' };

      TournamentService.finalizeTournament.mockResolvedValue(expectedResult);

      const response = await request(app)
        .put(`/tournaments/${tournamentId}/finalize`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expectedResult);
    });
  });
});