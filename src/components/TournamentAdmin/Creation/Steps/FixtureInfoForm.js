import { useCallback, useState, useEffect } from "react";
import { useTournamentCreation } from "../../../../contexts/TournamentCreationContext";
import { useTournamentAPI } from "../../../../hooks/useTournamentAPI";
import styles from "../TournamentCreation.module.css";
import {
  categories,
  groupLabels,
  possibleMainModalityKeys,
  modalityGroupKeys,
} from "../../../../utils/VariableSets/Arrays";

const FixtureInfoForm = ({ onNext, onBack, onCancel, config }) => {
  const {
    tournamentId,
    tournamentData,
    isLoading,
    error,
    dispatch,
    clearError,
  } = useTournamentCreation();

  const { updateFinalPhase } = useTournamentAPI();

  // Estados do formulário - inicializar com dados salvos se existirem
  const [formData, setFormData] = useState({
    finalPhaseConfig: tournamentData.finalPhase?.finalPhaseConfig || {},
  });

  const [formErrors, setFormErrors] = useState({});

  // Carregar dados salvos quando o componente montar
  useEffect(() => {
    if (
      tournamentData.finalPhase &&
      Object.keys(tournamentData.finalPhase).length > 0
    ) {
      setFormData(tournamentData.finalPhase);
    }
  }, [tournamentData.finalPhase]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Limpar erro geral
    if (error) {
      clearError();
    }
  };

  const handleCategoryDetailsChange = useCallback(
    (e) => {
      const { name, value, type } = e.target;
      const [field, groupKey, catName] = name.split("-");

      // Encontrar a modalidade principal selecionada
      const foundMainModalityKey = possibleMainModalityKeys.find(
        (key) => tournamentData.sportAndModalities?.modality === key
      );

      if (!foundMainModalityKey) return;

      const updatedFinalPhaseConfig = { ...formData.finalPhaseConfig };

      // Criar estrutura se não existir
      if (!updatedFinalPhaseConfig[groupKey]) {
        updatedFinalPhaseConfig[groupKey] = {};
      }

      if (!updatedFinalPhaseConfig[groupKey][catName]) {
        updatedFinalPhaseConfig[groupKey][catName] = {
          knockoutFase: "",
          knockoutParticipants: 0,
        };
      }

      // Atualizar o campo específico
      const parsedValue = type === "number" ? parseInt(value, 10) || 0 : value;
      updatedFinalPhaseConfig[groupKey][catName][field] = parsedValue;

      // Se mudou para "no", resetar participantes
      if (field === "knockoutFase" && value === "no") {
        updatedFinalPhaseConfig[groupKey][catName].knockoutParticipants = 0;
      }

      const updatedFormData = {
        ...formData,
        finalPhaseConfig: updatedFinalPhaseConfig,
      };

      setFormData(updatedFormData);

      // Salvar no contexto imediatamente
      dispatch({
        type: "UPDATE_FINAL_PHASE",
        payload: updatedFormData,
      });
    },
    [formData, tournamentData.sportAndModalities, dispatch]
  );

  const validateForm = () => {
    const errors = {};

    const categoryGroups =
      tournamentData.sportAndModalities?.categoryGroups || {};
    const calendarAndFormat = tournamentData.calendarAndFormat || {};

    const foundMainModalityKey = possibleMainModalityKeys.find(
      (key) => tournamentData.sportAndModalities?.modality === key
    );

    if (!foundMainModalityKey) {
      errors.general = "Complete as etapas anteriores primeiro";
      setFormErrors(errors);
      return false;
    }

    const groupKeysToValidate = modalityGroupKeys[foundMainModalityKey] || [];
    let hasKnockoutPhase = false;

    for (const groupKey of groupKeysToValidate) {
      const groupData = categoryGroups[groupKey];
      if (
        groupData &&
        groupData.categories &&
        groupData.categories.length > 0
      ) {
        for (const category of groupData.categories) {
          const catName =
            typeof category === "string" ? category : category.name;
          const finalPhaseConfig =
            formData.finalPhaseConfig?.[groupKey]?.[catName];

          if (!finalPhaseConfig?.knockoutFase) {
            errors.knockoutFase =
              "Defina se haverá mata-mata para todas as categorias";
            break;
          }

          if (finalPhaseConfig.knockoutFase === "knockout") {
            hasKnockoutPhase = true;

            if (
              !finalPhaseConfig.knockoutParticipants ||
              finalPhaseConfig.knockoutParticipants < 2
            ) {
              errors.knockoutParticipants =
                "Defina o número de classificados para o mata-mata (mínimo 2)";
              break;
            }

            // Verificar se não excede o máximo de participantes da categoria
            const maxParticipants =
              calendarAndFormat.categoryDetails?.[groupKey]?.[catName]
                ?.maxParticipants;
            if (
              maxParticipants &&
              finalPhaseConfig.knockoutParticipants > parseInt(maxParticipants)
            ) {
              errors.knockoutParticipants =
                "Número de classificados não pode exceder o máximo de participantes da categoria";
              break;
            }
          }
        }
        if (Object.keys(errors).length > 0) break;
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
        type: "UPDATE_FINAL_PHASE",
        payload: formData,
      });

      // Se tiver tournamentId, salvar no backend
      if (tournamentId) {
        const backendData = {
          hasPlayoffs: hasAnyKnockoutPhase(),
          participantsCount: getTotalKnockoutParticipants(),
          phaseType: "knockout",
          gameFormatId: getGameFormatId(),
        };

        await updateFinalPhase(tournamentId, backendData);
      }

      onNext();
    } catch (error) {
      console.error("Erro ao salvar configurações da fase final:", error);
    }
  };

  // Funções auxiliares para converter dados para o backend
  const hasAnyKnockoutPhase = () => {
    return Object.values(formData.finalPhaseConfig || {}).some((group) =>
      Object.values(group).some(
        (category) => category.knockoutFase === "knockout"
      )
    );
  };

  const getTotalKnockoutParticipants = () => {
    let total = 0;
    Object.values(formData.finalPhaseConfig || {}).forEach((group) => {
      Object.values(group).forEach((category) => {
        if (
          category.knockoutFase === "knockout" &&
          category.knockoutParticipants
        ) {
          total += category.knockoutParticipants;
        }
      });
    });
    return total;
  };

  const getGameFormatId = () => {
    // Usar o formato definido na etapa anterior
    const gameFormat = tournamentData.calendarAndFormat?.gameFormat;
    const formatMap = {
      standard: 1,
      "superTie-break": 2,
      grandSlam: 3,
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

  const categoryGroups =
    tournamentData.sportAndModalities?.categoryGroups || {};
  const calendarAndFormat = tournamentData.calendarAndFormat || {};

  return (
    <form className={styles.formMain} onSubmit={handleSubmit}>
      <div className={styles.formTitle}>
        <h5>Informações Complementares</h5>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formData}>
        <div className={styles.formDetails}>
          <div className={styles.detailsBox}>
            <h6>Fase Final:</h6>

            {!foundMainModalityKey && (
              <p className={styles.infoText}>
                Complete as etapas anteriores para configurar a fase final
              </p>
            )}

            {formErrors.general && (
              <span className={styles.error}>{formErrors.general}</span>
            )}

            {groupKeysToRender.map((key) => {
              const groupData = categoryGroups[key];
              if (
                !groupData ||
                !Array.isArray(groupData.categories) ||
                groupData.categories.length === 0
              ) {
                return null;
              }

              return (
                <div className={styles.microDetailsBox} key={key}>
                  <h5>{groupLabels[key] || key}</h5>
                  <div className={styles.categoriesDetail}>
                    {groupData.categories.map((catDetails, index) => {
                      const isString = typeof catDetails === "string";
                      const catName = isString ? catDetails : catDetails.name;
                      const foundCategory = categories.find(
                        (c) => c.name === catName
                      );

                      const finalPhaseConfig =
                        formData.finalPhaseConfig?.[key]?.[catName] || {};
                      const maxParticipants =
                        calendarAndFormat.categoryDetails?.[key]?.[catName]
                          ?.maxParticipants;

                      return (
                        <div
                          className={styles.categoriesDetails}
                          key={`${key}-${catName}-${index}`}
                        >
                          <div className={styles.categoriesTitle}>
                            <h6>
                              Categoria -{" "}
                              {foundCategory ? foundCategory.label : catName}
                            </h6>
                            {maxParticipants && (
                              <small className={styles.categoryInfo}>
                                Máximo de participantes: {maxParticipants}
                              </small>
                            )}
                          </div>

                          <div className={styles.categoriesInformation}>
                            <div className={styles.categoriesKoFase}>
                              <label>
                                <input
                                  type="radio"
                                  name={`knockoutFase-${key}-${catName}`}
                                  value="knockout"
                                  checked={
                                    finalPhaseConfig.knockoutFase === "knockout"
                                  }
                                  onChange={handleCategoryDetailsChange}
                                  disabled={isLoading}
                                />
                                Mata-Mata
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  name={`knockoutFase-${key}-${catName}`}
                                  value="no"
                                  checked={
                                    finalPhaseConfig.knockoutFase === "no"
                                  }
                                  onChange={handleCategoryDetailsChange}
                                  disabled={isLoading}
                                />
                                Não
                              </label>
                            </div>

                            {finalPhaseConfig.knockoutFase === "knockout" && (
                              <div className={styles.knockoutOptions}>
                                <h6>Configuração do Mata-Mata:</h6>
                                <label>
                                  Número de Classificados:
                                  <input
                                    type="number"
                                    name={`knockoutParticipants-${key}-${catName}`}
                                    step="2"
                                    min={2}
                                    max={maxParticipants || 128}
                                    value={
                                      finalPhaseConfig.knockoutParticipants ||
                                      ""
                                    }
                                    onChange={handleCategoryDetailsChange}
                                    disabled={isLoading}
                                    placeholder="Ex: 8"
                                  />
                                </label>
                                <small className={styles.helperText}>
                                  Deve ser um número par (2, 4, 8, 16, 32...)
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {formErrors.knockoutFase && (
              <span className={styles.error}>{formErrors.knockoutFase}</span>
            )}
            {formErrors.knockoutParticipants && (
              <span className={styles.error}>
                {formErrors.knockoutParticipants}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.buttonsContainer}>
        <button type="submit" className="saveBtn" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Prosseguir"}
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

export default FixtureInfoForm;
