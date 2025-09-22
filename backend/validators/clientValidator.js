// backend/validators/clientValidator.js
const validateClientData = (clientData) => {
  const errors = {};

  // Validar nome
  if (!clientData.name || !clientData.name.trim()) {
    errors.name = 'Nome é obrigatório';
  } else if (clientData.name.trim().length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres';
  } else if (clientData.name.trim().length > 100) {
    errors.name = 'Nome deve ter no máximo 100 caracteres';
  }

  // Validar email
  if (!clientData.email || !clientData.email.trim()) {
    errors.email = 'Email é obrigatório';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email.trim())) {
      errors.email = 'Email inválido';
    }
  }

  // Validar documento
  if (!clientData.documentNumber || !clientData.documentNumber.trim()) {
    errors.documentNumber = 'Documento é obrigatório';
  } else {
    const cleanDoc = clientData.documentNumber.replace(/\D/g, '');
    const docType = clientData.documentType || 'CNPJ';
    
    if (docType === 'CNPJ') {
      if (cleanDoc.length !== 14) {
        errors.documentNumber = 'CNPJ deve ter 14 dígitos';
      } else if (!validateCNPJ(cleanDoc)) {
        errors.documentNumber = 'CNPJ inválido';
      }
    } else if (docType === 'CPF') {
      if (cleanDoc.length !== 11) {
        errors.documentNumber = 'CPF deve ter 11 dígitos';
      } else if (!validateCPF(cleanDoc)) {
        errors.documentNumber = 'CPF inválido';
      }
    }
  }

  // Validar telefone (opcional)
  if (clientData.phone && clientData.phone.trim()) {
    const cleanPhone = clientData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.phone = 'Telefone deve ter 10 ou 11 dígitos';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validação de CNPJ
const validateCNPJ = (cnpj) => {
  if (cnpj.length !== 14) return false;
  
  // Eliminar CNPJs conhecidos como inválidos
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj.charAt(12)) !== digit) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cnpj.charAt(13)) === digit;
};

// Validação de CPF
const validateCPF = (cpf) => {
  if (cpf.length !== 11) return false;
  
  // Eliminar CPFs conhecidos como inválidos
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cpf.charAt(9)) !== digit) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cpf.charAt(10)) === digit;
};

// Sanitizar dados do cliente
const sanitizeClientData = (clientData) => {
  return {
    name: clientData.name ? clientData.name.trim() : '',
    email: clientData.email ? clientData.email.trim().toLowerCase() : '',
    documentNumber: clientData.documentNumber ? clientData.documentNumber.replace(/\D/g, '') : '',
    documentType: clientData.documentType || 'CNPJ',
    phone: clientData.phone ? clientData.phone.replace(/\D/g, '') : null
  };
};

module.exports = {
  validateClientData,
  sanitizeClientData,
  validateCNPJ,
  validateCPF
};