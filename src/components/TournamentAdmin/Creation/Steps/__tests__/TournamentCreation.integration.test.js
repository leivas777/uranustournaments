// src/components/TournamentCreation/__tests__/TournamentCreation.integration.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentCreation from '../../TournamentCreation';

// Mock das APIs
global.fetch = jest.fn();

// Mock dos hooks
jest.mock('../../../hooks/useDataConfig/useFederativeUnities.js', () => ({
  useFederativeUnitiesList: () => ({
    data: [{ id: 1, federativeunity: 'São Paulo' }],
    loading: false,
    error: null
  }),
  useCities: () => ({
    data: [{ id: 1, city: 'São Paulo' }],
    loading: false,
    error: null
  })
}));

describe('TournamentCreation - Integração', () => {
  beforeEach(() => {
    localStorage.clear();
    fetch.mockClear();
  });

  it('deve completar fluxo completo de criação de torneio', async () => {
    const user = userEvent.setup();

    // Mock das respostas da API
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 1 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

    render(<TournamentCreation tournamentType="torneio" />);

    // Etapa 1: Informações Gerais
    expect(screen.getByText(/etapa 1 de 5/i)).toBeInTheDocument();
    
    await user.selectOptions(screen.getByLabelText(/estado/i), '1');
    await user.selectOptions(screen.getByLabelText(/cidade/i), '1');
    await user.type(screen.getByLabelText(/clube/i), 'Clube Teste');
    await user.type(screen.getByLabelText(/nome/i), 'Torneio Teste');
    await user.selectOptions(screen.getByLabelText(/formato/i), '1');
    
    await user.click(screen.getByText(/prosseguir/i));

    // Etapa 2: Detalhes Técnicos
    await waitFor(() => {
      expect(screen.getByText(/etapa 2 de 5/i)).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/esporte/i), 'tenis');
    await user.selectOptions(screen.getByLabelText(/modalidade/i), 'single');
    
    // Selecionar categorias (assumindo que CategorySelector está mockado)
    await user.click(screen.getByText(/prosseguir/i));

    // Etapa 3: Detalhes dos Jogos
    await waitFor(() => {
      expect(screen.getByText(/etapa 3 de 5/i)).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText(/sim/i)); // Calendário automático
    await user.click(screen.getByLabelText(/3 sets/i)); // Formato do jogo
    
    await user.click(screen.getByText(/prosseguir/i));

    // Etapa 4: Informações Complementares
    await waitFor(() => {
      expect(screen.getByText(/etapa 4 de 5/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/prosseguir/i));

    // Etapa 5: Revisão Final
    await waitFor(() => {
      expect(screen.getByText(/etapa 5 de 5/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/revisão final/i)).toBeInTheDocument();
    
    await user.click(screen.getByText(/finalizar torneio/i));

    // Verificar se todas as chamadas da API foram feitas
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('deve permitir navegação entre etapas', async () => {
    const user = userEvent.setup();
    
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 1 } })
    });

    render(<TournamentCreation tournamentType="torneio" />);

    // Preencher primeira etapa
    await user.selectOptions(screen.getByLabelText(/estado/i), '1');
    await user.selectOptions(screen.getByLabelText(/cidade/i), '1');
    await user.type(screen.getByLabelText(/clube/i), 'Clube Teste');
    await user.type(screen.getByLabelText(/nome/i), 'Torneio Teste');
    await user.selectOptions(screen.getByLabelText(/formato/i), '1');
    
    await user.click(screen.getByText(/prosseguir/i));

    // Verificar que avançou para etapa 2
    await waitFor(() => {
      expect(screen.getByText(/etapa 2 de 5/i)).toBeInTheDocument();
    });

    // Voltar para etapa 1
    await user.click(screen.getByText(/voltar/i));

    await waitFor(() => {
      expect(screen.getByText(/etapa 1 de 5/i)).toBeInTheDocument();
    });

    // Verificar se os dados foram mantidos
    expect(screen.getByDisplayValue('Clube Teste')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Torneio Teste')).toBeInTheDocument();
  });
});