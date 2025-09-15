// tests/services/tournamentService.test.js
const TournamentService = require('../../services/tournamentServices')
const pool = require('../../db/db');

// Mock do pool de conexões
jest.mock('../../db/db');

describe('TournamentService', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDraft', () => {
    it('deve criar um rascunho de torneio com sucesso', async () => {
      const tournamentData = {
        name: 'Torneio Teste',
        clubName: 'Clube Teste',
        cityId: 1,
        tournamentFormatId: 1,
      };

      const expectedResult = {
        id: 1,
        name: 'Torneio Teste',
        club_name: 'Clube Teste',
        city_id: 1,
        tournament_format_id: 1,
        status: 'draft',
        created_at: new Date(),
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [expectedResult] }) // INSERT
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await TournamentService.createDraft(tournamentData);

      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
      expect(result).toEqual(expectedResult);
    });

    it('deve fazer rollback em caso de erro', async () => {
      const tournamentData = {
        name: 'Torneio Teste',
        clubName: 'Clube Teste',
        cityId: 1,
        tournamentFormatId: 1,
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // INSERT fails

      await expect(TournamentService.createDraft(tournamentData)).rejects.toThrow('Database error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('updateSportAndModalities', () => {
    it('deve atualizar esporte e modalidades com sucesso', async () => {
      const tournamentId = 1;
      const sportId = 2;
      const modalities = [
        {
          modalityTypeId: 1,
          maxParticipants: 16,
          categories: [
            { name: 'Categoria A', maxParticipants: 8 }
          ]
        }
      ];

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Tournament check
        .mockResolvedValueOnce(undefined) // UPDATE sport
        .mockResolvedValueOnce(undefined) // DELETE modalities
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT modality
        .mockResolvedValueOnce(undefined) // INSERT category
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await TournamentService.updateSportAndModalities(tournamentId, sportId, modalities);

      expect(result).toEqual({
        tournamentId,
        sportId,
        modalitiesCount: 1
      });
    });

    it('deve lançar erro se torneio não for encontrado', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // Tournament check - empty

      await expect(
        TournamentService.updateSportAndModalities(1, 2, [])
      ).rejects.toThrow('Torneio não encontrado ou não está no modo edição');
    });
  });

  describe('updateCalendarAndFormat', () => {
    it('deve atualizar calendário e formato com sucesso', async () => {
      const tournamentId = 1;
      const calendarData = {
        autoCalendarId: 1,
        maxParticipants: 32,
        modalityFormats: [
          { modalityId: 1, gameFormatId: 1 }
        ]
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Tournament check
        .mockResolvedValueOnce(undefined) // UPDATE tournament
        .mockResolvedValueOnce(undefined) // UPDATE modality format
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await TournamentService.updateCalendarAndFormat(tournamentId, calendarData);

      expect(result.tournamentId).toBe(tournamentId);
      expect(result.autoCalendarId).toBe(calendarData.autoCalendarId);
    });
  });

  describe('finalizeTournament', () => {
    it('deve finalizar torneio com sucesso', async () => {
      const tournamentId = 1;
      const expectedResult = {
        id: 1,
        name: 'Torneio Teste',
        status: 'active',
        finalized_at: new Date()
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'draft' }] }) // Tournament check
        .mockResolvedValueOnce({ rows: [expectedResult] }) // UPDATE status
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await TournamentService.finalizeTournament(tournamentId);

      expect(result).toEqual(expectedResult);
    });

    it('deve lançar erro se torneio já foi finalizado', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'active' }] }); // Tournament check

      await expect(
        TournamentService.finalizeTournament(1)
      ).rejects.toThrow('Torneio já foi finalizado');
    });
  });
});