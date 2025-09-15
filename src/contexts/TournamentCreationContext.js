import React, { createContext, useContext, useEffect, useReducer, useState } from "react";

const TournamentCreationContext = createContext();
const STORAGE_KEY = "tournament_creation_draft";

const initialState = {
  tournamentId: null,
  currentStep: 1,
  isLoading: false,
  error: null,
  tournamentData: {
    basicInfo: {},
    sportAndModalities: {},
    calendarAndFormat: {},
    finalPhase: {},
  },
};
const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`tournament`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("Erro ao limpar o localStorage:", error);
  }
};

const saveToStorage = (state) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tournamentId: state.tournamentId,
        currentStep: state.currentStep,
        tournamentData: state.tournamentData,
      })
    );
  } catch (error) {
    console.warn("Erro ao salvar no localStorage:", error);
  }
};
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // CORREÇÃO: Validação mais rigorosa
      if (
        parsed &&
        parsed.tournamentId &&
        parsed.currentStep &&
        parsed.currentStep >= 1 &&
        parsed.currentStep <= 5 &&
        parsed.tournamentData
      ) {
        console.log("Dados válidos carregados do localStorage");
        return {
          ...initialState,
          ...parsed,
        };
      } else {
        console.log("Dados inválidos encontrados, limpando...");
        clearStorage();
        return initialState;
      }
    }
  } catch (error) {
    console.warn("Erro ao carregar do localStorage, limpando...", error);
    clearStorage();
  }

  console.log("Retornando estado inicial limpo");
  return initialState;
};

const tournamentReducer = (state, action) => {
  console.log('Reducer action:', action.type, 'Current state step:', state.currentStep);
  
  let newState;
  
  switch (action.type) {
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_ERROR':
      newState = { ...state, error: action.payload, isLoading: false };
      break;
    case 'CLEAR_ERROR':
      newState = { ...state, error: null };
      break;
    case 'SET_TOURNAMENT_ID':
      newState = { ...state, tournamentId: action.payload };
      break;
    case 'SET_STEP':
      // CORREÇÃO: Validar step antes de definir
      const validStep = Math.max(1, Math.min(5, action.payload));
      newState = { ...state, currentStep: validStep };
      console.log('Step definido para:', validStep);
      break;
    case 'NEXT_STEP':
      const nextStep = Math.min(5, state.currentStep + 1);
      newState = { ...state, currentStep: nextStep };
      console.log('Próximo step:', nextStep);
      break;
    case 'PREV_STEP':
      const prevStep = Math.max(1, state.currentStep - 1);
      newState = { ...state, currentStep: prevStep };
      console.log('Step anterior:', prevStep);
      break;
    case 'UPDATE_BASIC_INFO':
      newState = {
        ...state,
        tournamentData: {
          ...state.tournamentData,
          basicInfo: action.payload
        }
      };
      break;
    case 'UPDATE_SPORT_MODALITIES':
      newState = {
        ...state,
        tournamentData: {
          ...state.tournamentData,
          sportAndModalities: action.payload
        }
      };
      break;
    case 'UPDATE_CALENDAR_FORMAT':
      newState = {
        ...state,
        tournamentData: {
          ...state.tournamentData,
          calendarAndFormat: action.payload
        }
      };
      break;
    case 'UPDATE_FINAL_PHASE':
      newState = {
        ...state,
        tournamentData: {
          ...state.tournamentData,
          finalPhase: action.payload
        }
      };
      break;
    case 'RESET_TOURNAMENT':
      console.log('Executando RESET_TOURNAMENT');
      clearStorage();
      // CORREÇÃO: Criar novo objeto completamente limpo
      newState = {
        tournamentId: null,
        currentStep: 1,
        isLoading: false,
        error: null,
        tournamentData: {
          basicInfo: {},
          sportAndModalities: {},
          calendarAndFormat: {},
          finalPhase: {}
        }
      };
      console.log('Estado após reset:', newState);
      break;
    case 'LOAD_FROM_STORAGE':
      newState = action.payload;
      break;
    default:
      return state;
  }
  
  // Salvar no localStorage (exceto para RESET e LOAD)
  if (!['RESET_TOURNAMENT', 'LOAD_FROM_STORAGE'].includes(action.type) &&
      ['SET_TOURNAMENT_ID', 'SET_STEP', 'NEXT_STEP', 'PREV_STEP', 'UPDATE_BASIC_INFO', 
       'UPDATE_SPORT_MODALITIES', 'UPDATE_CALENDAR_FORMAT', 'UPDATE_FINAL_PHASE'].includes(action.type)) {
    saveToStorage(newState);
  }
  
  console.log('Novo estado step:', newState.currentStep);
  return newState;
};

export const TournamentCreationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tournamentReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // CORREÇÃO: Inicialização mais controlada
  useEffect(() => {
    if (!isInitialized) {
      console.log("Inicializando TournamentCreationProvider...");

      const savedState = loadFromStorage();

      if (savedState.tournamentId && savedState.currentStep > 1) {
        console.log("Carregando estado salvo:", savedState);
        dispatch({ type: "LOAD_FROM_STORAGE", payload: savedState });
      } else {
        console.log("Iniciando com estado limpo");
        // CORREÇÃO: Garantir estado inicial limpo
        dispatch({ type: "RESET_TOURNAMENT" });
      }

      setIsInitialized(true);
    }
  }, [isInitialized]);

  const value = {
    ...state,
    dispatch,
    nextStep: () => dispatch({ type: "NEXT_STEP" }),
    prevStep: () => dispatch({ type: "PREV_STEP" }),
    resetTournament: () => {
      console.log("Executando resetTournament...");
      clearStorage(); // Limpar primeiro
      dispatch({ type: "RESET_TOURNAMENT" });
    },
    clearError: () => dispatch({ type: "CLEAR_ERROR" }),
  };

  // CORREÇÃO: Não renderizar até estar inicializado
  if (!isInitialized) {
    return <div>Carregando...</div>;
  }

  return (
    <TournamentCreationContext.Provider value={value}>
      {children}
    </TournamentCreationContext.Provider>
  );
};

export const useTournamentCreation = () => {
  const context = useContext(TournamentCreationContext);
  if (!context) {
    throw new Error(
      "useTournamentCreation deve ser usado dentro de TournamentCreationProvider"
    );
  }
  return context;
};
