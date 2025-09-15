import { useMemo, useState } from "react";
import { useTournamentCreation } from "../../../../contexts/TournamentCreationContext";
import { useTournamentAPI } from "../../../../hooks/useTournamentAPI";
import styles from "../TournamentCreation.module.css";

import {
  categories,
  groupLabels,
  possibleMainModalityKeys,
  modalityGroupKeys,
} from "../../../../utils/VariableSets/Arrays";


const FinishTournamentCreation = ({ onBack, onCancel, config }) => {
  const { 
    tournamentId,
    tournamentData, 
    isLoading, 
    error, 
    dispatch,
    resetTournament 
  } = useTournamentCreation();
  
  const { finalizeTournament } = useTournamentAPI();
  const [isFinishing, setIsFinishing] = useState(false);

  // Extrair dados das etapas anteriores
  const basicInfo = tournamentData.basicInfo || {};
  const sportAndModalities = tournamentData.sportAndModalities || {};
  const calendarAndFormat = tournamentData.calendarAndFormat || {};
  const finalPhase = tournamentData.finalPhase || {};

  const foundMainModalityKey = possibleMainModalityKeys.find(
    (key) => sportAndModalities.modality === key
  );

  const groupKeysToRender = foundMainModalityKey
    ? modalityGroupKeys[foundMainModalityKey] || []
    : [];

  const categoryGroups = sportAndModalities.categoryGroups || {};

  // Função para calcular jogos round-robin
  const calculateRoundRobinGames = (participants) => {
    if (!participants || participants < 2) {
      return 0;
    }
    const n = Number(participants);
    return (n * (n - 1)) / 2;
  };

  // Função para calcular jogos de mata-mata
  const calculateKnockoutGames = (participants) => {
    if (!participants || participants < 2) {
      return 0;
    }
    return participants - 1; // Em mata-mata, sempre são n-1 jogos
  };

  // Cálculo de jogos
  const gameCounts = useMemo(() => {
    const counts = {
      totalClassificationGames: 0,
      totalKnockoutGames: 0,
      totalTournamentGames: 0,
      byModality: {}
    };

    if (!foundMainModalityKey) return counts;

    groupKeysToRender.forEach((key) => {
      const groupData = categoryGroups[key];
      if (!groupData || !Array.isArray(groupData.categories)) return;

      counts.byModality[key] = { 
        totalClassificationGames: 0, 
        totalKnockoutGames: 0,
        totalGames: 0,
        byCategory: {} 
      };

      groupData.categories.forEach((catDetails) => {
        const catName = typeof catDetails === "string" ? catDetails : catDetails.name;
        const maxParticipants = calendarAndFormat.categoryDetails?.[key]?.[catName]?.maxParticipants || 0;
        const finalPhaseConfig = finalPhase.finalPhaseConfig?.[key]?.[catName] || {};
        
        // Jogos de classificação (round-robin)
        const classificationGames = calculateRoundRobinGames(maxParticipants);
        
        // Jogos de mata-mata
        let knockoutGames = 0;
        if (finalPhaseConfig.knockoutFase === 'knockout' && finalPhaseConfig.knockoutParticipants) {
          knockoutGames = calculateKnockoutGames(finalPhaseConfig.knockoutParticipants);
        }

        const totalCategoryGames = classificationGames + knockoutGames;

        counts.byModality[key].byCategory[catName] = {
          classification: classificationGames,
          knockout: knockoutGames,
          total: totalCategoryGames,
          participants: maxParticipants,
          knockoutParticipants: finalPhaseConfig.knockoutParticipants || 0
        };

        counts.byModality[key].totalClassificationGames += classificationGames;
        counts.byModality[key].totalKnockoutGames += knockoutGames;
        counts.byModality[key].totalGames += totalCategoryGames;
        
        counts.totalClassificationGames += classificationGames;
        counts.totalKnockoutGames += knockoutGames;
        counts.totalTournamentGames += totalCategoryGames;
      });
    });

    return counts;
  }, [tournamentData, foundMainModalityKey, groupKeysToRender, categoryGroups, calendarAndFormat, finalPhase]);

  // Função para finalizar o torneio
  const handleFinalizeTournament = async () => {
  if (!window.confirm('Tem certeza que deseja finalizar o torneio? Após finalizado, não será possível fazer alterações.')) {
    return;
  }

  try {
    setIsFinishing(true);
    
    if (tournamentId) {
      await finalizeTournament(tournamentId);
    }

    // CORREÇÃO: Reset completo e forçado
    resetTournament();
    
    // Aguardar um pouco para garantir que o reset foi processado
    setTimeout(() => {
      dispatch({ type: 'SET_STEP', payload: 1 });
    }, 100);
    
    alert('Torneio criado com sucesso!');
    
    // CORREÇÃO: Recarregar a página para garantir reset completo
    // window.location.reload();
    
  } catch (error) {
    console.error('Erro ao finalizar torneio:', error);
  } finally {
    setIsFinishing(false);
  }
};

  // Função para obter nome do esporte
  const getSportName = (sportKey) => {
    const sportMap = {
      'tenis': 'Tênis',
      'beach-tenis': 'Beach Tênis',
      'padel': 'Padel',
      'pickleball': 'Pickleball'
    };
    return sportMap[sportKey] || sportKey;
  };

  // Função para obter nome da modalidade
  const getModalityName = (modalityKey) => {
    const modalityMap = {
      'single': 'Simples',
      'doubles': 'Duplas',
      'all': 'Simples e Duplas'
    };
    return modalityMap[modalityKey] || modalityKey;
  };

  // Função para obter nome do formato de jogo
  const getGameFormatName = (formatKey) => {
    const formatMap = {
      'standard': '3 Sets',
      'superTie-break': '3 Sets com Super Tie-Break',
      'grandSlam': '5 Sets'
    };
    return formatMap[formatKey] || formatKey;
  };

  return (
    <div className={styles.formMain}>
      <div className={styles.formTitle}>
        <h5>Revisão Final</h5>
        <p>Confira todas as informações antes de finalizar o torneio</p>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      <div className={styles.formData}>
        <div className={styles.formDetails}>
          
          {/* Informações Gerais */}
          <div className={styles.detailsBox}>
            <h6>📍 Informações Gerais:</h6>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <label>
                  Local:
                  <input
                    type="text"
                    value={`${basicInfo.cityName || 'N/A'}, ${basicInfo.stateName || 'N/A'}`}
                    readOnly
                  />
                </label>
              </div>
              <div className={styles.summaryItem}>
                <label>
                  Clube:
                  <input type="text" value={basicInfo.club || 'N/A'} readOnly />
                </label>
              </div>
              <div className={styles.summaryItem}>
                <label>
                  Nome do Torneio:
                  <input type="text" value={basicInfo.tournamentName || 'N/A'} readOnly />
                </label>
              </div>
              <div className={styles.summaryItem}>
                <label>
                  Formato:
                  <input type="text" value={basicInfo.formatId === '1' ? 'Contínuo' : 'Etapas'} readOnly />
                </label>
              </div>
            </div>
          </div>

          {/* Dados do Evento */}
          <div className={styles.detailsBox}>
            <h6>🏆 Dados do Evento:</h6>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <label>
                  Esporte:
                  <input type="text" value={getSportName(sportAndModalities.sport)} readOnly />
                </label>
              </div>
              <div className={styles.summaryItem}>
                <label>
                  Modalidade:
                  <input type="text" value={getModalityName(sportAndModalities.modality)} readOnly />
                </label>
              </div>
            </div>

            {/* Categorias por Modalidade */}
            <div className={styles.categoriesSection}>
              <h6>Categorias Configuradas:</h6>
              {groupKeysToRender.map((key) => {
                const groupData = categoryGroups[key];
                if (!groupData || !Array.isArray(groupData.categories) || groupData.categories.length === 0) {
                  return null;
                }

                return (
                  <div className={styles.modalityGroup} key={key}>
                    <h5>{groupLabels[key] || key}</h5>
                    <div className={styles.categoriesList}>
                      {groupData.categories.map((catDetails, index) => {
                        const catName = typeof catDetails === "string" ? catDetails : catDetails.name;
                        const foundCategory = categories.find((c) => c.name === catName);
                        const maxParticipants = calendarAndFormat.categoryDetails?.[key]?.[catName]?.maxParticipants || 0;
                        const finalPhaseConfig = finalPhase.finalPhaseConfig?.[key]?.[catName] || {};

                        return (
                          <div className={styles.categoryItem} key={`${key}-${catName}-${index}`}>
                            <span className={styles.categoryName}>
                              {foundCategory ? foundCategory.label : catName}
                            </span>
                            <span className={styles.categoryDetails}>
                              {maxParticipants} participantes
                              {finalPhaseConfig.knockoutFase === 'knockout' && 
                                ` • Mata-mata: ${finalPhaseConfig.knockoutParticipants} classificados`
                              }
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dados dos Jogos */}
          <div className={styles.detailsBox}>
            <h6>🎮 Configurações dos Jogos:</h6>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <label>
                  Calendário Automático:
                  <input 
                    type="text" 
                    value={calendarAndFormat.autoCalendar === "yes" ? "Sim" : "Não"} 
                    readOnly 
                  />
                </label>
              </div>
              <div className={styles.summaryItem}>
                <label>
                  Formato dos Jogos:
                  <input 
                    type="text" 
                    value={getGameFormatName(calendarAndFormat.gameFormat)} 
                    readOnly 
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Estatísticas de Jogos */}
          <div className={styles.detailsBox}>
            <h6>📊 Estatísticas do Torneio:</h6>
            <div className={styles.gameStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total de Jogos:</span>
                <span className={styles.statValue}>{gameCounts.totalTournamentGames}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Jogos de Classificação:</span>
                <span className={styles.statValue}>{gameCounts.totalClassificationGames}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Jogos de Mata-mata:</span>
                <span className={styles.statValue}>{gameCounts.totalKnockoutGames}</span>
              </div>
            </div>

            {/* Detalhes por Modalidade */}
            <div className={styles.modalityStats}>
              <h6>Detalhes por Modalidade:</h6>
              {Object.entries(gameCounts.byModality).map(([modalityKey, modalityData]) => (
                <div key={modalityKey} className={styles.modalityStatItem}>
                  <h5>{groupLabels[modalityKey]}</h5>
                  <div className={styles.modalityStatDetails}>
                    <span>Total: {modalityData.totalGames} jogos</span>
                    <span>Classificação: {modalityData.totalClassificationGames}</span>
                    <span>Mata-mata: {modalityData.totalKnockoutGames}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.buttonsContainer}>
        <button
          type="button"
          className="finalizeBtn"
          onClick={handleFinalizeTournament}
          disabled={isLoading || isFinishing}
        >
          {isFinishing ? 'Finalizando...' : '🏆 Finalizar Torneio'}
        </button>
        
        <button 
          type="button" 
          className="backBtn"
          onClick={onBack}
          disabled={isLoading || isFinishing}
        >
          ← Voltar
        </button>
        
        <button 
          type="button" 
          className="cancelBtn"
          onClick={onCancel}
          disabled={isLoading || isFinishing}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default FinishTournamentCreation;