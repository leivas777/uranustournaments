// src/components/TournamentCreation/Steps/__tests__/GeneralInfoForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneralInfoForm from '../GeneralInfoForm';
import { TournamentCreationProvider } from '../../contexts/TournamentCreationContext';

// Mock dos hooks
jest.mock('../../../../hooks/useDataConfig/useFederativeUnities.js', () => ({
  useFederativeUnitiesList: () => ({
    data: [
      { id: 1, federativeunity: 'São Paulo' },
      { id: 2, federativeunity: 'Rio de Janeiro' }
    ],
    loading: false,
    error: null
  }),
  useCities: (stateId) => ({
    data: stateId ? [
      { id: 1, city: 'São Paulo' },
      { id: 2, city: 'Santos' }
    ] : [],
    loading: false,
    error: null
  })
}));

jest.mock('../../hooks/useTournamentAPI', () => ({
  useTournamentAPI: () => ({
    createDraft: jest.fn().mockResolvedValue({ id: 1 })
  })
}));

const renderWithProvider = (component) => {
  return render(
    <TournamentCreationProvider>
      {component}
    </TournamentCreationProvider>
  );
};

describe('GeneralInfoForm', () => {
  const mockProps = {
    onNext: jest.fn(),
    onCancel: jest.fn(),
    config: {
      title: 'torneio',
      sportsOptions: ['Tênis', 'Beach Tênis'],
      modalities: ['Simples', 'Duplas']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar todos os campos obrigatórios', () => {
    renderWithProvider(<GeneralInfoForm {...mockProps} />);

    expect(screen.getByLabelText(/estado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clube/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/formato/i)).toBeInTheDocument();
  });

  it('deve mostrar erros de validação para campos vazios', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GeneralInfoForm {...mockProps} />);

    const submitButton = screen.getByText(/prosseguir/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/estado é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/cidade é obrigatória/i)).toBeInTheDocument();
      expect(screen.getByText(/nome do clube é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/nome do torneio é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/formato é obrigatório/i)).toBeInTheDocument();
    });
  });

  it('deve preencher formulário e submeter com sucesso', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GeneralInfoForm {...mockProps} />);

    // Preencher campos
    await user.selectOptions(screen.getByLabelText(/estado/i), '1');
    await user.selectOptions(screen.getByLabelText(/cidade/i), '1');
    await user.type(screen.getByLabelText(/clube/i), 'Clube Teste');
    await user.type(screen.getByLabelText(/nome/i), 'Torneio Teste');
    await user.selectOptions(screen.getByLabelText(/formato/i), '1');

    // Submeter
    await user.click(screen.getByText(/prosseguir/i));

    await waitFor(() => {
      expect(mockProps.onNext).toHaveBeenCalled();
    });
  });

  it('deve limpar campos quando clicar em "Limpar Campos"', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GeneralInfoForm {...mockProps} />);

    // Preencher um campo
    const clubeInput = screen.getByLabelText(/clube/i);
    await user.type(clubeInput, 'Clube Teste');

    // Confirmar que foi preenchido
    expect(clubeInput).toHaveValue('Clube Teste');

    // Limpar campos
    await user.click(screen.getByText(/limpar campos/i));

    // Confirmar limpeza (assumindo que há um confirm)
    await waitFor(() => {
      expect(clubeInput).toHaveValue('');
    });
  });

  it('deve chamar onCancel quando clicar em "Cancelar"', async () => {
    const user = userEvent.setup();
    renderWithProvider(<GeneralInfoForm {...mockProps} />);

    await user.click(screen.getByText(/cancelar/i));

    expect(mockProps.onCancel).toHaveBeenCalled();
  });
});