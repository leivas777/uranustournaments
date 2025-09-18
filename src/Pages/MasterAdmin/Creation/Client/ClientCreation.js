import styles from "./ClientCreation.module.css";
import { useState } from "react";
import AddressForm from '../../../../components/MasterAdmin/Clients/Address/AddressForm';

const ClientCreation = ({ onSubmit, initialData ={}, isLoading=false}) => {
  const [formData, setFormData] = useState({
    name: '',
    documentNumber: '',
    documentType: 'CNPJ',
    email: '',
    phone: '',
    address: {},
    ...initialData
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validações básicas
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = 'Documento é obrigatório';
    }

    // Validações do endereço
    const addressErrors = {};
    if (!formData.address.zipCode) addressErrors.zipCode = 'CEP é obrigatório';
    if (!formData.address.street) addressErrors.street = 'Rua é obrigatória';
    if (!formData.address.number) addressErrors.number = 'Número é obrigatório';
    if (!formData.address.neighborhood) addressErrors.neighborhood = 'Bairro é obrigatório';
    if (!formData.address.city) addressErrors.city = 'Cidade é obrigatória';
    if (!formData.address.state) addressErrors.state = 'Estado é obrigatório';

    if (Object.keys(addressErrors).length > 0) {
      newErrors.address = addressErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleAddressChange = (address) => {
    setFormData(prev => ({
      ...prev,
      address
    }));

    // Limpar erros do endereço
    if (errors.address) {
      setErrors(prev => ({
        ...prev,
        address: undefined
      }));
    }
  };

  const formatDocument = (value, type) => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (type === 'CNPJ') {
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else {
      return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
  };

  const formatPhone = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados Básicos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">🏢 Dados da Empresa</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Empresa *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nome da empresa ou organização"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Tipo de Documento */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento *
            </label>
            <select
              value={formData.documentType}
              onChange={(e) => handleInputChange('documentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CNPJ">CNPJ</option>
              <option value="CPF">CPF</option>
            </select>
          </div>

          {/* Número do Documento */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.documentType} *
            </label>
            <input
              type="text"
              value={formData.documentNumber}
              onChange={(e) => handleInputChange('documentNumber', formatDocument(e.target.value, formData.documentType))}
              placeholder={formData.documentType === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
              maxLength={formData.documentType === 'CNPJ' ? 18 : 14}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.documentNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.documentNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.documentNumber}</p>
            )}
          </div>

          {/* Email */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@empresa.com"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              maxLength={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <AddressForm
          address={formData.address}
          onChange={handleAddressChange}
          errors={errors.address || {}}
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            'Salvar Cliente'
          )}
        </button>
      </div>
    </form>
  );
};

export default ClientCreation;
