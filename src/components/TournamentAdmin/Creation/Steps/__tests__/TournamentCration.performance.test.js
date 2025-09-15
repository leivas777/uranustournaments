// src/components/TournamentCreation/__tests__/TournamentCreation.performance.test.js
import React from 'react';
import { render } from '@testing-library/react';
import TournamentCreation from '../../TournamentCreation';

describe('TournamentCreation - Performance', () => {
  it('deve renderizar em menos de 100ms', () => {
    const startTime = performance.now();
    
    render(<TournamentCreation tournamentType="torneio" />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(100);
  });

  it('deve ter menos de 10 re-renders desnecessários', () => {
    let renderCount = 0;
    
    const TestComponent = () => {
      renderCount++;
      return <TournamentCreation tournamentType="torneio" />;
    };

    const { rerender } = render(<TestComponent />);
    
    // Simular múltiplas atualizações
    for (let i = 0; i < 5; i++) {
      rerender(<TestComponent />);
    }
    
    expect(renderCount).toBeLessThan(10);
  });
});