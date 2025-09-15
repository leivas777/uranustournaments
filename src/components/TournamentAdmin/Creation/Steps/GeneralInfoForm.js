import { useEffect, useState } from "react";
import { useTournamentCreation } from "../../../../contexts/TournamentCreationContext";
import { useTournamentAPI } from "../../../../hooks/useTournamentAPI";
import {
  useFederativeUnitiesList,
  useCities,
} from "../../../../hooks/useDataConfig/useFederativeUnities";
import styles from "../TournamentCreation.module.css";

const GeneralInfoForm = ({ onNext, onCancel, config }) => {
  const { tournamentData, isLoading, error, clearError } =
    useTournamentCreation();

  const { createDraft } = useTournamentAPI();

  // Inicializar com dados salvos se existirem
  const [formData, setFormData] = useState({
    stateId: tournamentData.basicInfo?.stateId || "",
    cityId: tournamentData.basicInfo?.cityId || "",
    club: tournamentData.basicInfo?.club || "",
    tournamentName: tournamentData.basicInfo?.tournamentName || "",
    formatId: tournamentData.basicInfo?.formatId || "",
  });

  const [formErrors, setFormErrors] = useState({});

  const {
    data: states,
    loading: statesLoading,
  } = useFederativeUnitiesList();

  const {
    data: cities,
    loading: citiesLoading,
  } = useCities(formData.stateId);

  // Carregar dados salvos quando o componente montar
  useEffect(() => {
    if (
      tournamentData.basicInfo &&
      Object.keys(tournamentData.basicInfo).length > 0
    ) {
      setFormData(tournamentData.basicInfo);
    }
  }, [tournamentData.basicInfo]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (error) {
      clearError();
    }
  };

  const handleClearForm = () => {
    if (window.confirm("Tem certeza que deseja limpar todos os campos?")) {
      setFormData({
        stateId: "",
        cityId: "",
        club: "",
        tournamentName: "",
        formatId: "",
      });
      setFormErrors({});
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.stateId) errors.stateId = "Estado é obrigatório";
    if (!formData.cityId) errors.cityId = "Cidade é obrigatória";
    if (!formData.club.trim()) errors.club = "Nome do clube é obrigatório";
    if (!formData.tournamentName.trim())
      errors.tournamentName = "Nome do torneio é obrigatório";
    if (!formData.formatId) errors.formatId = "Formato é obrigatório";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Adicionar nomes para exibição no modal de recuperação
      const selectedState = states.find((s) => s.id == formData.stateId);
      const selectedCity = cities.find((c) => c.id == formData.cityId);

      const enrichedFormData = {
        ...formData,
        stateName: selectedState?.federativeunity,
        cityName: selectedCity?.city,
      };

      await createDraft(enrichedFormData);
      onNext();
    } catch (error) {
      console.error("Erro ao criar torneio:", error);
    }
  };

  return (
    <form className={styles.formMain} onSubmit={handleSubmit}>
      <div className={styles.formTitle}>
        <h5>Dados Gerais</h5>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formData}>
        <div className={styles.formDetails}>
          <div className={styles.detailsBox}>
            <h6>Localização:</h6>

            <label>
              Estado:
              <select
                value={formData.stateId}
                onChange={(e) => handleInputChange("stateId", e.target.value)}
                disabled={statesLoading}
              >
                <option value="">Selecione um estado</option>
                {states?.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.federativeunity}
                  </option>
                ))}
              </select>
              {formErrors.stateId && (
                <span className={styles.error}>{formErrors.stateId}</span>
              )}
            </label>

            <label>
              Cidade:
              <select
                value={formData.cityId}
                onChange={(e) => handleInputChange("cityId", e.target.value)}
                disabled={!formData.stateId || citiesLoading}
              >
                <option value="">Selecione uma cidade</option>
                {cities?.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.city}
                  </option>
                ))}
              </select>
              {formErrors.cityId && (
                <span className={styles.error}>{formErrors.cityId}</span>
              )}
            </label>

            <label>
              Clube:
              <input
                type="text"
                value={formData.club}
                placeholder="Informe o nome do clube"
                onChange={(e) => handleInputChange("club", e.target.value)}
              />
              {formErrors.club && (
                <span className={styles.error}>{formErrors.club}</span>
              )}
            </label>
          </div>

          <div className={styles.detailsBox}>
            <h6>Informação Geral:</h6>

            <label>
              Nome:
              <input
                type="text"
                value={formData.tournamentName}
                placeholder={`Insira o nome do ${config.title}`}
                onChange={(e) =>
                  handleInputChange("tournamentName", e.target.value)
                }
              />
              {formErrors.tournamentName && (
                <span className={styles.error}>
                  {formErrors.tournamentName}
                </span>
              )}
            </label>

            <label>
              Formato:
              <select
                value={formData.formatId}
                onChange={(e) => handleInputChange("formatId", e.target.value)}
              >
                <option value="">Selecione o formato</option>
                <option value="1">Contínuo</option>
                <option value="2">Etapas</option>
              </select>
              {formErrors.formatId && (
                <span className={styles.error}>{formErrors.formatId}</span>
              )}
            </label>
          </div>
        </div>

        <div className={styles.buttonsContainer}>
          <button type="submit" className="saveBtn" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Prosseguir"}
          </button>

          <button
            type="button"
            className="clearBtn"
            onClick={handleClearForm}
            disabled={isLoading}
          >
            Limpar Campos
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
      </div>
    </form>
  );
};

export default GeneralInfoForm;
