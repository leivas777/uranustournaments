import { useCallback, useEffect, useState } from "react";
import { useTournamentCreation } from "../../../../contexts/TournamentCreationContext";
import { useTournamentAPI } from "../../../../hooks/useTournamentAPI";
import styles from "../TournamentCreation.module.css";
import {
  categories,
  groupLabels,
  possibleMainModalityKeys,
  modalityGroupKeys,
  getModalityTypeId
} from "../../../../utils/VariableSets/Arrays";

const CourtsInfoForm = ({ onNext, onBack, onCancel, config }) => {
  const { 
    tournamentId,
    tournamentData, 
    isLoading, 
    error, 
    dispatch,
    clearError 
  } = useTournamentCreation();
  
  const { updateCalendarAndFormat } = useTournamentAPI();

  // Estados do formulário - inicializar com dados salvos se existirem
  const [formData, setFormData] = useState({
    autoCalendar: tournamentData.calendarAndFormat?.autoCalendar || "",
    gameFormat: tournamentData.calendarAndFormat?.gameFormat || "",
    categoryDetails: tournamentData.calendarAndFormat?.categoryDetails || {}
  });

  const [formErrors, setFormErrors] = useState({});

  // Carregar dados salvos quando o componente montar
  useEffect(() => {
    if (tournamentData.calendarAndFormat && Object.keys(tournamentData.calendarAndFormat).length > 0) {
      setFormData(tournamentData.calendarAndFormat);
    }
  }, [tournamentData.calendarAndFormat]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Limpar erro geral
    if (error) {
      clearError();
    }

    // Salvar no contexto imediatamente
    const updatedData = { ...formData, [field]: value };
    dispatch({ 
      type: 'UPDATE_CALENDAR_FORMAT', 
      payload: updatedData 
    });
  };

  const handleAutoCalendar = (event) => {
    handleInputChange('autoCalendar', event.target.value);
  };

  const handleGameFormat = (event) => {
    handleInputChange('gameFormat', event.target.value);
  };

  const handleCategoryDetailChange = useCallback((e) => {
    const { name, value } = e.target;
    const [field, groupKey, catName] = name.split("-");

    // Encontrar a modalidade principal selecionada
    const foundMainModalityKey = possibleMainModalityKeys.find(
      (key) => tournamentData.sportAndModalities?.modality === key
    );

    if (!foundMainModalityKey) return;

    // Obter categoryGroups do contexto
    const categoryGroups = tournamentData.sportAndModalities?.categoryGroups || {};
    
    const updatedCategoryDetails = { ...formData.categoryDetails };
    
    // Criar estrutura se não existir
    if (!updatedCategoryDetails[groupKey]) {
      updatedCategoryDetails[groupKey] = {};
    }
    
    if (!updatedCategoryDetails[groupKey][catName]) {
      updatedCategoryDetails[groupKey][catName] = {};
    }

    // Atualizar o campo específico
    updatedCategoryDetails[groupKey][catName][field] = value;

    const updatedFormData = {
      ...formData,
      categoryDetails: updatedCategoryDetails
    };

    setFormData(updatedFormData);
    
    // Salvar no contexto
    dispatch({ 
      type: 'UPDATE_CALENDAR_FORMAT', 
      payload: updatedFormData 
    });
  }, [formData, tournamentData.sportAndModalities, dispatch]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.autoCalendar) {
      errors.autoCalendar = 'Selecione uma opção para calendário automático';
    }
    
    if (!formData.gameFormat) {
      errors.gameFormat = 'Selecione um formato de jogo';
    }

    // Validar se todas as categorias têm máximo de participantes definido
    const categoryGroups = tournamentData.sportAndModalities?.categoryGroups || {};
    const foundMainModalityKey = possibleMainModalityKeys.find(
      (key) => tournamentData.sportAndModalities?.modality === key
    );

    if (foundMainModalityKey) {
      const groupKeysToValidate = modalityGroupKeys[foundMainModalityKey] || [];
      
      for (const groupKey of groupKeysToValidate) {
        const groupData = categoryGroups[groupKey];
        if (groupData && groupData.categories && groupData.categories.length > 0) {
          for (const category of groupData.categories) {
            const catName = typeof category === "string" ? category : category.name;
            const maxParticipants = formData.categoryDetails?.[groupKey]?.[catName]?.maxParticipants;
            
            if (!maxParticipants || maxParticipants <= 0) {
              errors.categoryDetails = 'Defina o número máximo de participantes para todas as categorias';
              break;
            }
          }
          if (errors.categoryDetails) break;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Salvar no contexto primeiro
      dispatch({ 
        type: 'UPDATE_CALENDAR_FORMAT', 
        payload: formData 
      });

      // Se tiver tournamentId, salvar no backend
      if (tournamentId) {
        const backendData = {
          autoCalendarId: getAutoCalendarId(formData.autoCalendar),
          maxParticipants: getMaxParticipantsFromCategories(),
          modalityFormats: getModalityFormats()
        };
        
        await updateCalendarAndFormat(tournamentId, backendData);
      }

      onNext();
    } catch (error) {
      console.error('Erro ao salvar configurações de calendário:', error);
    }
  };

  // Funções auxiliares para converter dados para o backend
  const getAutoCalendarId = (autoCalendar) => {
    return autoCalendar === 'yes' ? 1 : 2;
  };

  const getMaxParticipantsFromCategories = () => {
    // Calcular o máximo baseado nas categorias configuradas
    let maxTotal = 0;
    Object.values(formData.categoryDetails || {}).forEach(group => {
      Object.values(group).forEach(category => {
        if (category.maxParticipants) {
          maxTotal += parseInt(category.maxParticipants);
        }
      });
    });
    return maxTotal || 100; // valor padrão
  };

const getModalityFormats = () => {
  const gameFormatId = getGameFormatId(formData.gameFormat);
  const categoryGroups = tournamentData.sportAndModalities?.categoryGroups || {};
  
  const modalityFormats = [];
  Object.entries(categoryGroups).forEach(([groupKey, groupData]) => {
    if (groupData.categories && groupData.categories.length > 0) {
      modalityFormats.push({
        modalityId: getModalityTypeId(groupKey), // CORREÇÃO: Usar ID numérico
        gameFormatId
      });
    }
  });
  
  return modalityFormats;
};

  const getGameFormatId = (gameFormat) => {
    const formatMap = {
      'standard': 1,
      'superTie-break': 2,
      'grandSlam': 3
    };
    return formatMap[gameFormat] || 1;
  };

  // Obter dados para renderização
  const foundMainModalityKey = possibleMainModalityKeys.find(
    (key) => tournamentData.sportAndModalities?.modality === key
  );

  const groupKeysToRender = foundMainModalityKey
    ? modalityGroupKeys[foundMainModalityKey] || []
    : [];

  const categoryGroups = tournamentData.sportAndModalities?.categoryGroups || {};

  

  return (
    <form className={styles.formMain} onSubmit={handleSubmit}>
      <div className={styles.formTitle}>
        <h5>Detalhes dos Jogos</h5>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      <div className={styles.formData}>
        <div className={styles.formDetails}>
          <div className={styles.detailsBox}>
            <h6>Informações dos Jogos:</h6>
            
            <div className={styles.choices}>
              <div className={styles.autoCalendar}>
                <p>Calendário Automático</p>
                <div className={styles.autoCalendarOptions}>
                  <label>
                    <input
                      type="radio"
                      name="autoSchedule"
                      value="yes"
                      checked={formData.autoCalendar === "yes"}
                      onChange={handleAutoCalendar}
                      disabled={isLoading}
                    />
                    Sim
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="autoSchedule"
                      value="no"
                      checked={formData.autoCalendar === "no"}
                      onChange={handleAutoCalendar}
                      disabled={isLoading}
                    />
                    Não
                  </label>
                </div>
                {formErrors.autoCalendar && (
                  <span className={styles.error}>{formErrors.autoCalendar}</span>
                )}
              </div>
              
              <div className={styles.autoCalendar}>
                <p>Formato dos Jogos:</p>
                <div className={styles.fixtures}>
                  <label>
                    <input
                      type="radio"
                      name="gameFormat"
                      value="standard"
                      checked={formData.gameFormat === "standard"}
                      onChange={handleGameFormat}
                      disabled={isLoading}
                    />
                    3 Sets
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="gameFormat"
                      value="superTie-break"
                      checked={formData.gameFormat === "superTie-break"}
                      onChange={handleGameFormat}
                      disabled={isLoading}
                    />
                    3 Sets com Super Tie-Break
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="gameFormat"
                      value="grandSlam"
                      checked={formData.gameFormat === "grandSlam"}
                      onChange={handleGameFormat}
                      disabled={isLoading}
                    />
                    5 Sets
                  </label>
                </div>
                {formErrors.gameFormat && (
                  <span className={styles.error}>{formErrors.gameFormat}</span>
                )}
              </div>
            </div>

            <div className={styles.categoriesDetailInfo}>
              <h6>Informações Detalhadas das Categorias:</h6>

              {!foundMainModalityKey && (
                <p className={styles.infoText}>
                  Complete a etapa anterior para configurar as categorias
                </p>
              )}

              {groupKeysToRender.map((key) => {
                const groupData = categoryGroups[key];
                if (!groupData || !Array.isArray(groupData.categories) || groupData.categories.length === 0) {
                  return null;
                }

                return (
                  <div className={styles.categories} key={key}>
                    <h5>{groupLabels[key] || key}</h5>
                    <div className={styles.categoriesDetail}>
                      {groupData.categories.map((catDetails, index) => {
                        const isString = typeof catDetails === "string";
                        const catName = isString ? catDetails : catDetails.name;
                        const foundCategory = categories.find(
                          (c) => c.name === catName
                        );

                        const maxParticipantsValue = formData.categoryDetails?.[key]?.[catName]?.maxParticipants || "";

                        return (
                          <div
                            className={styles.categoriesDetails}
                            key={`${key}-${catName}-${index}`}
                          >
                            <div className={styles.categoriesTitle}>
                              <h6>
                                Categoria - {foundCategory ? foundCategory.label : catName}
                              </h6>
                            </div>
                            <div className={styles.categoriesInformation}>
                              <div className={styles.categoriesMaxPart}>
                                <label>
                                  Máximo de Participantes
                                  <input
                                    type="number"
                                    name={`maxParticipants-${key}-${catName}`}
                                    value={maxParticipantsValue}
                                    onChange={handleCategoryDetailChange}
                                    min="2"
                                    max="128"
                                    disabled={isLoading}
                                    placeholder="Ex: 16"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {formErrors.categoryDetails && (
                <span className={styles.error}>{formErrors.categoryDetails}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.buttonsContainer}>
        <button
          type="submit"
          className="saveBtn"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : 'Prosseguir'}
        </button>
        
        <button 
          type="button" 
          className="backBtn"
          onClick={onBack}
          disabled={isLoading}
        >
          ← Voltar
        </button>
        
        <button 
          type="button" 
          className="cancelBtn"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default CourtsInfoForm;

