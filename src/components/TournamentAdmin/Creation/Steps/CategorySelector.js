import styles from "../TournamentCreation.module.css";

import CategoryGroup from "./CategoryGroup";

const CategorySelector = ({ modality,options, value, onChange }) => {
  const modalityGroups = {
    single: ["female", "male"],
    doubles: ["femaleDouble", "maleDouble", "mixed"],
    all: ["male", "female","femaleDouble", "maleDouble", "mixed"]
  }

  const groupLabels = {
    male: "Masculino",
    female: "Feminino",
    femaleDouble: "Duplas Femininas",
    maleDouble: "Duplas Masculinas",
    mixed: "Misto"
  }

  const groupKeys = modalityGroups[modality] || [];
  const currentValue = value || {};


  return (
    <div className={styles.microDetailsBox}>
        {groupKeys.map((groupKey) => (
            <CategoryGroup
            key={groupKey}
            groupKey={groupKey}
            label={groupLabels[groupKey] || groupKey}
            categories={options}
            data={currentValue[groupKey] || {type: "", categories: []}}
            onChange={(updatedData) => onChange({...currentValue, [groupKey]: updatedData})}
            />
        ))}
    </div>
  );
};

export default CategorySelector;
