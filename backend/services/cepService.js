// services/cepService.js
const axios = require('axios');

class CepService {
  async getAddressByCep(cep) {
    console.log('🌐 CepService - Buscando CEP:', cep);
    try {
      // Limpar CEP (remover caracteres não numéricos)
      const cleanCep = cep.replace(/\D/g, '');
      
      // Validar formato do CEP
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos');
      }

      
      const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        timeout: 5000, // 5 segundos de timeout
        headers: {
          'User-Agent': 'Uranus-Tournaments-API/1.0'
        }
      });
        console.log('📥 Resposta do ViaCEP:', response.data);
      const data = response.data;

      // Verificar se CEP foi encontrado
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      const result = {
        success: true,
        data: {
          zipCode: cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2'),
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          ibgeCode: data.ibge || '',
          giaCode: data.gia || '',
          dddCode: data.ddd || '',
          siafi: data.siafi || ''
        }
      };

      console.log('✅ Resultado formatado:', result)
      return result      

    } catch (error) {
      console.error('❌ Erro no CepService:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout ao buscar CEP. Tente novamente.');
      }
      
      if (error.response && error.response.status === 404) {
        throw new Error('CEP não encontrado');
      }
      
      throw new Error(error.message || 'Erro ao buscar informações do CEP');
    }
  }

  // Método para validar CEP
  validateCep(cep) {
    const cleanCep = cep.replace(/\D/g, '');
    return {
      isValid: cleanCep.length === 8 && /^\d{8}$/.test(cleanCep),
      cleanCep,
      formattedCep: cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2')
    };
  }

  
}

module.exports = new CepService();