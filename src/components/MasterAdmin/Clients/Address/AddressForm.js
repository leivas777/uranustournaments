import { useState, useEffect } from "react";

const AddressForm = ({ address = {}, onChange, errors = {} }) => {
  const [addressData, setAddressData] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil",
    ...address,
  });

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");

  const fetchAddressByCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    setCepError('');
    
    try {
      const response = await fetch(`http://localhost:3001/api/cep/${cleanCep}`);
      console.log(response)
      const result = await response.json();
      

      if (result.success && result.data) {
        setAddressData(prev => ({
          ...prev,
          street: result.data.street || prev.street,
          neighborhood: result.data.neighborhood || prev.neighborhood,
          city: result.data.city || prev.city,
          state: result.data.state || prev.state,
        }));
        setCepError('');
      } else {
        setCepError(result.error || 'CEP não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepError('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsLoadingCep(false);
    }
  };

  const formatCep = (value) => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;

    if (field === "zipCode") {
      formattedValue = formatCep(value);

      if (formattedValue.replace(/\D/g, "").length === 8) {
        fetchAddressByCep(formattedValue);
      }
    }

    if (field === "state") {
      formattedValue = value.toUpperCase().slice(0, 2);
    }

    const newAddressData = {
      ...addressData,
      [field]: formattedValue,
    };

    setAddressData(newAddressData);
    onChange(newAddressData);
  };
  return (
    <div className="address-form">
      <h3 className="text-lg font-semibold-mb-4">📍 Endereço</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg: grid-cols-3 gap-4">
         <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CEP *
          </label>
          <div className="relative">
            <input
              type="text"
              value={addressData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.zipCode || cepError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {isLoadingCep && (
              <div className="absolute right-3 top-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          {(errors.zipCode || cepError) && (
            <p className="text-red-500 text-xs mt-1">{errors.zipCode || cepError}</p>
          )}
          {!errors.zipCode && !cepError && addressData.zipCode.length === 9 && !isLoadingCep && (
            <p className="text-green-500 text-xs mt-1">✅ CEP válido</p>
          )}
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rua/Avenida *
          </label>
          <input
            type="text"
            value={addressData.street}
            onChange={(e) => handleInputChange("street", e.target.value)}
            placeholder="Nome da rua ou avenida"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.street ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.street && (
            <p className="text-red-500 text-xs mt-1">{errors.street}</p>
          )}
        </div>

        {/* Número */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número *
          </label>
          <input
            type="text"
            value={addressData.number}
            onChange={(e) => handleInputChange("number", e.target.value)}
            placeholder="123"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.number ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.number && (
            <p className="text-red-500 text-xs mt-1">{errors.number}</p>
          )}
        </div>

        {/* Complemento */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Complemento
          </label>
          <input
            type="text"
            value={addressData.complement}
            onChange={(e) => handleInputChange("complement", e.target.value)}
            placeholder="Sala, Bloco, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Bairro */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bairro *
          </label>
          <input
            type="text"
            value={addressData.neighborhood}
            onChange={(e) => handleInputChange("neighborhood", e.target.value)}
            placeholder="Nome do bairro"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.neighborhood ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.neighborhood && (
            <p className="text-red-500 text-xs mt-1">{errors.neighborhood}</p>
          )}
        </div>

        {/* Cidade */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cidade *
          </label>
          <input
            type="text"
            value={addressData.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            placeholder="Nome da cidade"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.city ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.city && (
            <p className="text-red-500 text-xs mt-1">{errors.city}</p>
          )}
        </div>

        {/* Estado */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado *
          </label>
          <input
            type="text"
            value={addressData.state}
            onChange={(e) => handleInputChange("state", e.target.value)}
            placeholder="SP"
            maxLength={2}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.state ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.state && (
            <p className="text-red-500 text-xs mt-1">{errors.state}</p>
          )}
        </div>

        {/* País */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            País
          </label>
          <input
            type="text"
            value={addressData.country}
            onChange={(e) => handleInputChange("country", e.target.value)}
            placeholder="Brasil"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600 font-medium">
          Preview do endereço:
        </p>
        <p className="text-sm text-gray-800">
          {[addressData.street, addressData.number, addressData.complement]
            .filter(Boolean)
            .join(", ")}
          {addressData.neighborhood && `, ${addressData.neighborhood}`}
          <br />
          {[addressData.city, addressData.state, addressData.zipCode]
            .filter(Boolean)
            .join(" - ")}
          {addressData.country && `, ${addressData.country}`}
        </p>
      </div>
    </div>
  );
};

export default AddressForm;
