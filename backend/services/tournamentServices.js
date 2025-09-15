// services/tournamentService.js
const pool = require("../db/db");

class TournamentService {
  async createDraft(tournamentData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const query = `
            INSERT INTO tournaments(name, club_name, city_id, tournament_format_id, status)
            VALUES($1, $2, $3, $4, 'draft')
            RETURNING id, name, club_name, city_id, tournament_format_id, status, created_at
            `;
      const values = [
        tournamentData.name,
        tournamentData.clubName,
        tournamentData.cityId,
        tournamentData.tournamentFormatId,
      ];

      const result = await client.query(query, values);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateSportAndModalities(tournamentId, sportId, modalities) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const tournamentCheck = await client.query(
        "SELECT id FROM tournaments WHERE id = $1 AND status= $2",
        [tournamentId, "draft"]
      );
      if (tournamentCheck.rows.length === 0) {
        throw new Error("Torneio não encontrado ou não está no modo edição");
      }

      await client.query("UPDATE tournaments SET sport_id = $1 WHERE id = $2", [
        sportId,
        tournamentId,
      ]);

      await client.query(
        "DELETE FROM tournament_modalities WHERE tournament_id = $1",
        [tournamentId]
      );
      for (const modality of modalities) {
        const modalityQuery = `
            INSERT INTO tournament_modalities (tournament_id, modality_type_id, max_participants)
            VALUES($1, $2, $3)
            RETURNING id
            `;

        const modalityResult = await client.query(modalityQuery, [
          tournamentId,
          modality.modalityTypeId,
          modality.maxParticipants,
        ]);

        for (const category of modality.categories || []) {
          await client.query(
            `
                    INSERT INTO tournament_category (tournament_modality_id, category_name, max_participants)
                    VALUES ($1, $2, $3)
                    `,
            [modalityResult.rows[0].id, category.name, category.maxParticipants]
          );
        }
      }
      await client.query("COMMIT");
      return { tournamentId, sportId, modalitiesCount: modalities.length };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // NOVO MÉTODO: updateCalendarAndFormat
  async updateCalendarAndFormat(tournamentId, calendarData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verificar se o torneio existe e está em draft
      const tournamentCheck = await client.query(
        "SELECT id FROM tournaments WHERE id = $1 AND status = $2",
        [tournamentId, "draft"]
      );
      
      if (tournamentCheck.rows.length === 0) {
        throw new Error("Torneio não encontrado ou não está no modo edição");
      }

      // Atualizar informações de calendário no torneio
      await client.query(
        `UPDATE tournaments 
         SET auto_calendar_id = $1, max_participants=$2
         WHERE id = $3`,
        [calendarData.autoCalendarId, calendarData.maxParticipants, tournamentId]
      );


      // Atualizar formatos de modalidades se fornecidos
      if (calendarData.modalityFormats && calendarData.modalityFormats.length > 0) {
        for (const modalityFormat of calendarData.modalityFormats) {
          await client.query(
            `UPDATE tournament_modalities 
             SET game_format_id = $1 
             WHERE tournament_id = $2 AND modality_type_id = $3`,
            [modalityFormat.gameFormatId, tournamentId, modalityFormat.modalityId]
          );
        }
      }

      await client.query("COMMIT");
      return { 
        tournamentId, 
        autoCalendarId: calendarData.autoCalendarId,
        maxParticipants: calendarData.maxParticipants 
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // NOVO MÉTODO: updateFinalPhase
  async updateFinalPhase(tournamentId, finalPhaseData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verificar se o torneio existe e está em draft
      const tournamentCheck = await client.query(
        "SELECT id FROM tournaments WHERE id = $1 AND status = $2",
        [tournamentId, "draft"]
      );
      
      if (tournamentCheck.rows.length === 0) {
        throw new Error("Torneio não encontrado ou não está no modo edição");
      }

      // Atualizar informações da fase final
      await client.query(
        `UPDATE tournaments 
         SET has_playoffs = $1, participants_count = $2, phase_type = $3, game_format_id = $4
         WHERE id = $5`,
        [
          finalPhaseData.hasPlayoffs,
          finalPhaseData.participantsCount,
          finalPhaseData.phaseType,
          finalPhaseData.gameFormatId,
          tournamentId
        ]
      );

      await client.query("COMMIT");
      return { 
        tournamentId,
        hasPlayoffs: finalPhaseData.hasPlayoffs,
        participantsCount: finalPhaseData.participantsCount
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // NOVO MÉTODO: finalizeTournament
  async finalizeTournament(tournamentId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verificar se o torneio existe e está em draft
      const tournamentCheck = await client.query(
        "SELECT id, status FROM tournaments WHERE id = $1",
        [tournamentId]
      );
      
      if (tournamentCheck.rows.length === 0) {
        throw new Error("Torneio não encontrado");
      }

      if (tournamentCheck.rows[0].status !== 'draft') {
        throw new Error("Torneio já foi finalizado");
      }

      // Atualizar status para 'active' e definir data de finalização
      const result = await client.query(
        `UPDATE tournaments 
         SET status = 'active', finalized_at = NOW() 
         WHERE id = $1 
         RETURNING id, name, status, finalized_at`,
        [tournamentId]
      );

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getTournamentSummary(tournamentId) {
    const query = `
    SELECT
    t.*,
    c.city,
    fu.federativeunity,
    s.name as sport_name,
    tf.name as tournament_format_name,
    ac.option as auto_calendar_option
    FROM tournaments t
    LEFT JOIN cities c ON t.city_id = c.id
    LEFT JOIN federativeunities fu ON c.federalunityid = fu.id
    LEFT JOIN sports s ON t.sport_id = s.id
    LEFT JOIN tournamentformat tf ON t.tournament_format_id = tf.id
    LEFT JOIN autocalendar ac ON t.auto_calendar_id = ac.id
    WHERE t.id = $1
    `;
    const result = await pool.query(query, [tournamentId]);

    if (result.rows.length === 0) {
      throw new Error("Torneio não encontrado");
    }

    const modalitiesQuery = `
    SELECT
    tm.*,
    mt.name as modality_type_name,
    gf.name as game_format_name
    FROM tournament_modalities tm
    LEFT JOIN modalitytype mt ON tm.modality_type_id = mt.id
    LEFT JOIN gameformat gf ON tm.game_format_id = gf.id
    WHERE tm.tournament_id = $1`;
    const modalitiesResult = await pool.query(modalitiesQuery, [tournamentId]);

    return {
      tournament: result.rows[0],
      modalities: modalitiesResult.rows,
    };
  }
}

module.exports = new TournamentService();