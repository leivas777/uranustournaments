//CSS
import styles from "./TournamentCreation.module.css";

//React
import { useState, useEffect } from "react";

//Context Provider
import {
  TournamentCreationProvider,
  useTournamentCreation,
} from "../../../contexts/TournamentCreationContext";

//Components
import RecoveryModal from "./components/RecoveryModal";
import GeneralInfoForm from "./Steps/GeneralInfoForm";
import EventDetailInfoForm from "./Steps/EventDetailInfoForm";
import CourtsInfoForm from "./Steps/CourtsInfoForm";
import FixtureInfoForm from "./Steps/FixtureInfoForm";
import FinishTournamentCreation from "./Steps/FinishTournamentCreation";

const renderTournament = (tournamentType) => {
  const configs = {
    torneio: {
      title: "torneio",
      description:
        "Torneios com etapas de grupos e posteriormente fase de mata-mata.",
      sportsOptions: ["Tênis", "Beach Tênis", "Padel"],
      modalities: ["Simples", "Duplas"],
    },
    ranking: {
      title: "ranking",
      description:
        "Rankings são torneios contínuos ou por etapas e que apresentam o ranking dos atletas que os disputam.",
      sportsOptions: ["Tênis", "Beach Tênis", "Padel"],
      modalities: ["Simples", "Duplas"],
    },
    super: {
      title: "super",
      description:
        'Super é um formato de torneio onde um grupo de jogadores se enfrenta em um sistema de "todos contra todos", buscando somar o maior número de vitórias ou games.',
      sportsOptions: ["Beach Tênis"],
      modalities: ["Duplas"],
    },
  };
  return configs[tournamentType] || configs["torneio"];
};

// Componente interno que usa o contexto
const TournamentCreationContent = ({ tournamentType }) => {
  const {
    currentStep,
    tournamentId,
    tournamentData,
    nextStep,
    prevStep,
    resetTournament,
    dispatch,
  } = useTournamentCreation();

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [hasCheckedRecovery, setHasCheckedRecovery] = useState(false);
  const config = renderTournament(tournamentType);

  // Verificar se há torneio salvo na inicialização
  useEffect(() => {
    if (!hasCheckedRecovery) {
      if (tournamentId && currentStep > 1) {
        setShowRecoveryModal(true);
      }
      setHasCheckedRecovery(true);
    }
  }, [tournamentId, currentStep, hasCheckedRecovery]);

  const handleRecoverTournament = () => {
    setShowRecoveryModal(false);
    // Continuar de onde parou (o estado já está carregado)
  };

  const handleDiscardTournament = () => {
    resetTournament();
    dispatch({ type: "SET_STEP", payload: 1 });
    setShowRecoveryModal(false);
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Tem certeza que deseja cancelar? Todos os dados serão perdidos."
      )
    ) {
      resetTournament();
      // Aqui você pode redirecionar para a página anterior ou home
      // window.history.back() ou navigate('/') se usando React Router
    }
  };

  return (
    <>
      <RecoveryModal
        isOpen={showRecoveryModal}
        onRecover={handleRecoverTournament}
        onDiscard={handleDiscardTournament}
        tournamentData={tournamentData}
      />

      <div className={styles.tournamentCreationMain}>
        <div className={styles.header}>
          <h4>
            Crie seu <span>{config.title}</span>:
          </h4>
          <p>{config.description}</p>
        </div>

        <div className={styles.container}>
          <div className={styles.containerData}>
            <div className={styles.title}>
              <h4>
                Criar <span>{config.title}</span>
              </h4>
              <div className={styles.stepIndicator}>
                <span>Etapa {currentStep} de 5</span>
              </div>
            </div>

            {currentStep === 1 && (
              <GeneralInfoForm
                onNext={nextStep}
                onCancel={handleCancel}
                config={config}
              />
            )}
            {currentStep === 2 && (
              <EventDetailInfoForm
                onNext={nextStep}
                onBack={prevStep}
                onCancel={handleCancel}
                config={config}
              />
            )}
            {currentStep === 3 && (
              <CourtsInfoForm
                onNext={nextStep}
                onBack={prevStep}
                onCancel={handleCancel}
                config={config}
              />
            )}
            {currentStep === 4 && (
              <FixtureInfoForm
                onNext={nextStep}
                onBack={prevStep}
                onCancel={handleCancel}
                config={config}
              />
            )}
            {currentStep === 5 && (
              <FinishTournamentCreation
                onBack={prevStep}
                onCancel={handleCancel}
                config={config}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Componente principal que fornece o contexto
const TournamentCreation = ({ tournamentType }) => {
  return (
    <TournamentCreationProvider>
      <TournamentCreationContent tournamentType={tournamentType} />
    </TournamentCreationProvider>
  );
};

export default TournamentCreation;
