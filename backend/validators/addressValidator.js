const validateAddress = (address) => {
  const errors = {};

  //Verificar se endereço existe
  if (!address || typeof address !== "object") {
    return {
      isValid: false,
      errors: { general: "Endereço é obrigatório" },
    };
  }

  //Validar cep
  if (!address.zipCode) {
    errors.zipCode = "CEP é obrigatório";
  } else {
    const cleanZipCode = address.zipCode.replace(/\D/g, "");
    if (cleanZipCode.length !== 8) {
      errors.zipCode = "CEP deve ter 8 dígitos";
    }
  }

  //Validar rua
  if (!address.street || !address.street.trim()) {
    errors.street = "Rua é obrigatório";
  } else if (address.street.trim().length < 3) {
    errors.street = "Rua deve ter pelo menos 3 caracteres.";
  }

  //Validar número
  if (!address.number || !address.number.trim()) {
    errors.number = "Número é obrigatório";
  }

  //Validar bairro
  if (!address.neighborhood || !address.neighborhood.trim()) {
    errors.neighborhood = "Bairro é obrigatório";
  } else if (address.neighborhood.trim().length < 2) {
    errors.neighborhood = "Bairro deve ter pelo menos 2 caracteres";
  }

  //Validar cidade
  if (!address.city || !address.city.trim()) {
    errors.city = "Cidade é obrigatória";
  } else if (address.city.trim().length < 2) {
    errors.city = "Cidade deve ter pelo menos 2 caracteres";
  }

  // Validar estado
  if (!address.state || !address.state.trim()) {
    errors.state = "Estado é obrigatório";
  } else if (address.state.trim().length !== 2) {
    errors.state = "Estado deve ter 2 caracteres (ex: SP, RJ)";
  }

  return{
    isValid: Object.keys(errors).length === 0,
    errors
  }
};

const sanitizeAddress = (address) => {
    if(!address || typeof address !== 'object'){
        return {}
    }

    const cleanString = (str) => {
        if(!str || typeof str !== 'string') return ''
        return str.trim().replace(/\s+/g, ' ')
    }

    const cleanZipCode = (zipCode) => {
        if(!zipCode) return ''
        const clean = zipCode.replace(/\D/g, '')

        if(clean.length === 8){
            return `${clean.slice(0, 5)}-${clean.slice(5)}`
        }
        return clean
    }

    const cleanState = (state)=>{
        if(!state) return ""
        return state.trim().toUpperCase()
    }

    const capitalizeWords = (str)=>{
        if(!str) return ''
        return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join("")
    }

    return{
        street: capitalizeWords(cleanString(address.street)),
        number: cleanString(address.number),
        complement: cleanString(address.complement) || null,
        neighborhood: capitalizeWords(cleanString(address.neighborhood)),
        city: capitalizeWords(cleanString(address.city)),
        state: cleanState(address.state),
        zipCode: cleanZipCode(address.zipCode),
        country: capitalizeWords(cleanString(address.country))||'Brasil'
    }
}

const validateBrazilianZipCode = (zipCode) => {
    if(!zipCode) return false;

    const cleanZipCode = zipCode.replace(/\D/g, '')

    if(cleanZipCode.length !== 8) return false;

    if(cleanZipCode === '00000000')return false;

    return true;
}

const validateBrazilianState = (state) => {
    if(!state) return false;

    const validStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  return validStates.includes(state.toUpperCase())
}

const validateBrazilianAddress = (address) => {
    const basicValidation = validateAddress(address)

    if(!basicValidation.isValid){
        return basicValidation
    }

    const errors = {...basicValidation.errors}

    if(!validateBrazilianZipCode(address.zipCode)){
        errors.zipCode = 'CEP inválido para o Brasil'
    }

    if(!validateBrazilianState(address.state)){
        errors.state = 'Estado inválido. Use a sigla(ex: RS, SC)'
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}

module.exports = {
    validateAddress,
    sanitizeAddress,
    validateBrazilianZipCode, 
    validateBrazilianState,
    validateBrazilianAddress
}
