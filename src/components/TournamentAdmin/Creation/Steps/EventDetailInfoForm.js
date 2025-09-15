import { useState, useEffect } from "react";
import { useTournamentCreation } from "../../../../contexts/TournamentCreationContext";
import { useTournamentAPI } from "../../../../hooks/useTournamentAPI";
import styles from "../TournamentCreation.module.css";
import {
  categories,
  groupLabels,
  possibleMainModalityKeys,
  modalityGroupKeys,
} from "../../../../utils/VariableSets/Arrays";

import CategorySelector from "./CategorySelector";

const EventDetailInfoForm = ({ onNext, onBack, onCancel, config }) => {
  const { 
    tournamentId,
    tournamentData, 
    isLoading, 
    error, 
    dispatch,
    clearError 
  } = useTournamentCreation();
  
  const { updateSportAndModalities } = useTournamentAPI();

  // Estados do formulário - inicializar com dados salvos se existirem
  const [formData, setFormData] = useState({
    sport: tournamentData.sportAndModalities?.sport || "",
    modality: tournamentData.sportAndModalities?.modality || "",
  });

  const [formErrors, setFormErrors] = useState({});

  const initialGroups = {
    female: { type: "", categories: [] },
    male: { type: "", categories: [] },
    femaleDouble: { type: "", categories: [] },
    maleDouble: { type: "", categories: [] },
    mixed: { type: "", categories: [] }
  };

  const [categoryGroups, setCategoryGroups] = useState(
    tournamentData.sportAndModalities?.categoryGroups || initialGroups
  );

  // Carregar dados salvos quando o componente montar
  useEffect(() => {
    if (tournamentData.sportAndModalities && Object.keys(tournamentData.sportAndModalities).length > 0) {
      setFormData({
        sport: tournamentData.sportAndModalities.sport || "",
        modality: tournamentData.sportAndModalities.modality || "",
      });
      setCategoryGroups(tournamentData.sportAndModalities.categoryGroups || initialGroups);
    }
  }, [tournamentData.sportAndModalities]);

  // Atualizar categoryGroups quando modalidade mudar
  useEffect(() => {
    if (formData.modality && tournamentData.sportAndModalities?.categoryGroups) {
      setCategoryGroups(tournamentData.sportAndModalities.categoryGroups);
    }
  }, [formData.modality, tournamentData.sportAndModalities]);

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

    // Reset categoryGroups quando modalidade mudar
    if (field === 'modality') {
      setCategoryGroups(initialGroups);
    }
  };

  const handleSportChange = (event) => {
    handleInputChange('sport', event.target.value);
  };

  const handleModalityChange = (event) => {
    handleInputChange('modality', event.target.value);
  };

  const handleCategoryGroupsChange = (updated) => {
    setCategoryGroups(updated);
    
    // Salvar no contexto imediatamente
    const updatedData = {
      ...formData,
      categoryGroups: updated
    };
    
    dispatch({ 
      type: 'UPDATE_SPORT_MODALITIES', 
      payload: updatedData 
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.sport) {
      errors.sport = 'Esporte é obrigatório';
    }
    
    if (!formData.modality) {
      errors.modality = 'Modalidade é obrigatória';
    }

    // Validar se pelo menos uma categoria foi selecionada
    const hasCategories = Object.values(categoryGroups).some(group => 
      group.categories && group.categories.length > 0
    );
    
    if (!hasCategories) {
      errors.categories = 'Selecione pelo menos uma categoria';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const sportAndModalitiesData = {
        ...formData,
        categoryGroups
      };

      // Salvar no contexto primeiro
      dispatch({ 
        type: 'UPDATE_SPORT_MODALITIES', 
        payload: sportAndModalitiesData 
      });

      // Se tiver tournamentId, salvar no backend
      if (tournamentId) {
        // Converter dados para o formato esperado pelo backend
        const backendData = {
          sportId: getSportId(formData.sport),
          modalities: convertCategoryGroupsToModalities(categoryGroups, formData.modality)
        };
        
        await updateSportAndModalities(tournamentId, backendData);
      }

      onNext();
    } catch (error) {
      console.error('Erro ao salvar esporte e modalidades:', error);
    }
  };

  // Função auxiliar para converter esporte para ID
  const getSportId = (sportName) => {
    const sportMap = {
      'tenis': 1,
      'beach-tenis': 2,
      'padel': 3,
      'pickleball': 4
    };
    return sportMap[sportName] || 1;
  };

  // Função auxiliar para converter categoryGroups para formato do backend
  const convertCategoryGroupsToModalities = (groups, modality) => {
    const modalities = [];
    
    Object.entries(groups).forEach(([groupKey, groupData]) => {
      if (groupData.categories && groupData.categories.length > 0) {
        modalities.push({
          modalityTypeId: getModalityTypeId(groupKey),
          maxParticipants: 32, // valor padrão, pode ser configurável
          categories: groupData.categories.map(cat => ({
            name: categories.find(c => c.name === cat)?.label || cat,
            minAge: null,
            maxAge: null,
            maxParticipants: 16 // valor padrão
          }))
        });
      }
    });
    
    return modalities;
  };

  // Função auxiliar para converter grupo para modalityTypeId
  const getModalityTypeId = (groupKey) => {
    const modalityMap = {
      'female': 1,
      'male': 2,
      'femaleDouble': 3,
      'maleDouble': 4,
      'mixed': 5
    };
    return modalityMap[groupKey] || 1;
  };

  return (
    <form className={styles.formMain} onSubmit={handleSubmit}>
      <div className={styles.formTitle}>
        <h5>Detalhes Técnicos</h5>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      <div className={styles.formData}>
        <div className={styles.formDetails}>
          <div className={styles.detailsBox}>
            <h6>Informações da Modalidade:</h6>
            
            <label>
              Esporte:
              <select 
                onChange={handleSportChange} 
                value={formData.sport}
                disabled={isLoading}
              >
                <option value="">Selecione um esporte</option>
                <option value="tenis">Tênis</option>
                <option value="beach-tenis">Beach Tênis</option>
                <option value="padel">Padel</option>
                <option value="pickleball">Pickleball</option>
              </select>
              {formErrors.sport && (
                <span className={styles.error}>{formErrors.sport}</span>
              )}
            </label>
            
            <label>
              Modalidade:
              <select 
                onChange={handleModalityChange} 
                value={formData.modality}
                disabled={isLoading || !formData.sport}
              >
                <option value="">Selecione uma modalidade</option>
                <option value="single">Simples</option>
                <option value="doubles">Duplas</option>
                <option value="all">Todos</option>
              </select>
              {formErrors.modality && (
                <span className={styles.error}>{formErrors.modality}</span>
              )}
            </label>
          </div>
          
          <div className={styles.detailsBox}>
            <h6>Categorias:</h6>
            {formData.modality ? (
              <CategorySelector
                modality={formData.modality}
                options={categories}
                value={categoryGroups}
                onChange={handleCategoryGroupsChange}
                disabled={isLoading}
              />
            ) : (
              <p className={styles.infoText}>
                Selecione um esporte e modalidade para configurar as categorias
              </p>
            )}
            {formErrors.categories && (
              <span className={styles.error}>{formErrors.categories}</span>
            )}
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
      </div>
    </form>
  );
};

export default EventDetailInfoForm;