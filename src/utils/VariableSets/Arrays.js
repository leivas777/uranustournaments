const groupLabels = {
  male: "Simples Masculino",
  female: "Simples Feminino",
  femaleDouble: "Duplas Femininas",
  maleDouble: "Duplas Masculinas",
  mixed: "Duplas Mistas",
};

const categories = [
  { name: "classPro", label: "Open/Pro" },
  { name: "classA", label: "A" },
  { name: "classB", label: "B" },
  { name: "classC", label: "C" },
  { name: "classD", label: "D" },
  { name: "classE", label: "E" },
  { name: "classStarters", label: "Iniciantes" },
];

const possibleMainModalityKeys = ["single", "doubles", "all"];

const modalityGroupKeys = {
  single: ["male", "female"],
  doubles: ["femaleDouble", "maleDouble", "mixed"],
  all: ["male", "female", "femaleDouble", "maleDouble", "mixed"],
};

const getModalityTypeId = (groupKey) => {
  const modalityMap = {
    'female': 1,        // Feminino Simples
    'male': 2,          // Masculino Simples
    'femaleDouble': 3,  // Feminino Duplas
    'maleDouble': 4,    // Masculino Duplas
    'mixed': 5          // Misto Duplas
  };
  return modalityMap[groupKey] || 1;
};


export {
    groupLabels,
    categories,
    possibleMainModalityKeys,
    modalityGroupKeys,
    getModalityTypeId
}