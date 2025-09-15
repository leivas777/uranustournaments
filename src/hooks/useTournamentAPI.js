import { useTournamentCreation } from "../contexts/TournamentCreationContext";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

export const useTournamentAPI = () => {
  const { dispatch } = useTournamentCreation();

  const createDraft = async (basicInfo) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await fetch(`${API_BASE_URL}/api/tournaments/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: basicInfo.tournamentName,
          clubName: basicInfo.club,
          cityId: parseInt(basicInfo.cityId),
          tournamentFormatId: parseInt(basicInfo.formatId)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar torneio');
      }
      
      dispatch({ type: 'SET_TOURNAMENT_ID', payload: data.data.id });
      dispatch({ type: 'UPDATE_BASIC_INFO', payload: basicInfo });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return data.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateSportAndModalities = async (tournamentId, sportData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/sport`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sportData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar esporte e modalidades');
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return data.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateCalendarAndFormat = async (tournamentId, calendarData) => {

  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/calendar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao atualizar configurações de calendário');
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
    
    return data.data;
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: error.message });
    throw error;
  }
};

const updateFinalPhase = async (tournamentId, finalPhaseData) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/final-phase`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPhaseData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao atualizar configurações da fase final');
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
    
    return data.data;
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: error.message });
    throw error;
  }
};

const finalizeTournament = async (tournamentId) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/finalize`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao finalizar torneio');
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
    
    return data.data;
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: error.message });
    throw error;
  }
};

  return {
    createDraft,
    updateSportAndModalities,
    updateCalendarAndFormat,
    updateFinalPhase,
    finalizeTournament
  };
};
