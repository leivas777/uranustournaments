import { useState, useEffect } from "react";
import styles from "../TournamentCreation.module.css";

const CategoryGroup = ({
  groupKey,
  label,
  categories,
  data = {},
  onChange,
}) => {
  const {type = "", categories: selectedCategories = []} = data;
  const [newCategory, setNewCategory] = useState("");


  const handleCheckBoxChange = (name) => {
    let updated;
    if (selectedCategories.includes(name)) {
      updated = selectedCategories.filter((c) => c !== name);
    } else {
      updated = [...selectedCategories, name];
    }

    onChange({ type, categories: updated });
  };

  const handleAddCustom = () => {
    if (
      newCategory.trim() &&
      !selectedCategories.includes(newCategory.trim())
    ) {
      const updated = [...selectedCategories, newCategory.trim()];
      onChange({ type: "custom", categories: updated });
      setNewCategory("");
    }
  };

  const handleDeleteCustom = (cat) => {
    const updated = selectedCategories.filter((c) => c !== cat);
    onChange({type: "custom", categories: updated})
  };

  const handleCategoryTypeChange = (newType) => {
    if (newType === "standard") {
      onChange({ type: newType, categories: [] });
    } else {
      onChange({ type: newType, categories: selectedCategories });
    } 
  };

  return (
    <div className={styles.microBox}>
      <h6>{label}</h6>
      <div className={styles.boxes}>
        <label>
          <input
            type="radio"
            name={`${groupKey}-type`}
            value="standard"
            checked={type === "standard"}
            onChange={() => handleCategoryTypeChange("standard")}
          />
          Padrão
        </label>
        <label>
          <input
            type="radio"
            name={`${groupKey}-type`}
            value="custom"
            checked={type === "custom"}
            onChange={() => handleCategoryTypeChange("custom")}
          />
          Customizadas
        </label>
        <label>
          <input
            type="radio"
            name={`${groupKey}-type`}
            value="none"
            checked={type === "none"}
            onChange={() => handleCategoryTypeChange("none")}
          />
          Não Terá
        </label>
      </div>
      <div className={styles.detailBoxes}>
        {type === "standard" &&
          (categories||[]).map((cat) => (
            <label key={cat.name}>
              <input
                type="checkbox"
                value={cat.name}
                checked={selectedCategories.includes(cat.name)}
                onChange={() => handleCheckBoxChange(cat.name)}
              />
              {cat.label}
            </label>
          ))}

        {type === "custom" && (
          <div className={styles.customCategories}>
            <p>Insira as categorias personalizadas:</p>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nova Categoria"
            />
            <button type="button" onClick={handleAddCustom}>
              Adicionar
            </button>
            <ul>
              {selectedCategories.map((cat) => (
                <li key={cat}>
                  {cat}
                  <button type="button" onClick={() => handleDeleteCustom(cat)}>
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {type === "" && (
          <div className={styles.detailBoxesText}>
            <p>Escolha um tipo de categoria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryGroup;
