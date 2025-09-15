// src/components/TournamentCreation/contexts/__tests__/TournamentCreationContext.test.js
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { TournamentCreationProvider, useTournamentCreation } from '../../../../contexts/TournamentCreationContext';

const wrapper = ({ children }) => (
  <TournamentCreationProvider>{children}</TournamentCreationProvider>
);

describe('TournamentCreationContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useTournamentCreation(), { wrapper });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.tournamentId).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve avançar para próximo step', () => {
    const { result } = renderHook(() => useTournamentCreation(), { wrapper });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(2);
  });

  it('deve voltar para step anterior', () => {
    const { result } = renderHook(() => useTournamentCreation(), { wrapper });

    act(() => {
      result.current.nextStep();
      result.current.nextStep();
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(2);
  });

  it('não deve permitir step menor que 1', () => {
    const { result } = renderHook(() => useTournamentCreation(), { wrapper });

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('deve resetar torneio', () => {
    const { result } = renderHook(() => useTournamentCreation(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'SET_TOURNAMENT_ID', payload: 123 });
      result.current.nextStep();
      result.current.resetTournament();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.tournamentId).toBeNull();
  });

  it('deve salvar dados básicos', () => {
    const { result } = renderHook(() => useTournamentCreation(), { wrapper });

    const basicInfo = {
      tournamentName: 'Teste',
      club: 'Clube Teste',
      cityId: 1
    };

    act(() => {
      result.current.dispatch({ type: 'UPDATE_BASIC_INFO', payload: basicInfo });
    });

    expect(result.current.tournamentData.basicInfo).toEqual(basicInfo);
  });

  it('deve carregar dados do localStorage', () => {
    const savedData = {
      tournamentId: 123,
      currentStep: 3,
      tournamentData: {
        basicInfo: { tournamentName: 'Teste Salvo' }
      }
    };

    localStorage.setItem('tournament_creation_draft', JSON.stringify(savedData));

    const { result } = renderHook(() => useTournamentCreation(), { wrapper });

    expect(result.current.tournamentId).toBe(123);
    expect(result.current.currentStep).toBe(3);
    expect(result.current.tournamentData.basicInfo.tournamentName).toBe('Teste Salvo');
  });
});