import styles from "./ClientCreation.module.css";
import { useState } from "react";
import AddressForm from "../Address/AddressForm";

const ClientCreation = ({ onSubmit, initialData = {}, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    documentNumber: "",
    documentType: "CNPJ",
    email: "",
    phone: "",
    address: {},
    ...initialData,
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validações básicas
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = "Documento é obrigatório";
    }

    // Validações do endereço
    const addressErrors = {};
    if (!formData.address.zipCode) addressErrors.zipCode = "CEP é obrigatório";
    if (!formData.address.street) addressErrors.street = "Rua é obrigatória";
    if (!formData.address.number) addressErrors.number = "Número é obrigatório";
    if (!formData.address.neighborhood)
      addressErrors.neighborhood = "Bairro é obrigatório";
    if (!formData.address.city) addressErrors.city = "Cidade é obrigatória";
    if (!formData.address.state) addressErrors.state = "Estado é obrigatório";

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
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleAddressChange = (address) => {
    setFormData((prev) => ({
      ...prev,
      address,
    }));

    // Limpar erros do endereço
    if (errors.address) {
      setErrors((prev) => ({
        ...prev,
        address: undefined,
      }));
    }
  };

  const formatDocument = (value, type) => {
    const cleanValue = value.replace(/\D/g, "");

    if (type === "CNPJ") {
      return cleanValue.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    } else {
      return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
  };

  const formatPhone = (value) => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  return (
    <div className={styles.formContainer}>
      <h3 className={styles.formTitle}>Criar Cliente</h3>
      <form onSubmit={handleSubmit} className={styles.formWrapper}>
        {/* Dados Básicos */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>🏢 Dados da Empresa</h3>

          <div className={styles.formGrid}>
            {/* Nome */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>Nome da Empresa *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nome da empresa ou organização"
                className={styles.formInput}
              />
              {errors.name && <p className={styles.error}>{errors.name}</p>}
            </div>

            {/* Tipo de Documento */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>Tipo de Documento *</label>
              <select
                value={formData.documentType}
                onChange={(e) =>
                  handleInputChange("documentType", e.target.value)
                }
                className={styles.formSelect}
              >
                <option value="CNPJ">CNPJ</option>
                <option value="CPF">CPF</option>
              </select>
            </div>

            {/* Número do Documento */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {formData.documentType} *
              </label>
              <input
                type="text"
                value={formData.documentNumber}
                onChange={(e) =>
                  handleInputChange(
                    "documentNumber",
                    formatDocument(e.target.value, formData.documentType)
                  )
                }
                placeholder={
                  formData.documentType === "CNPJ"
                    ? "00.000.000/0000-00"
                    : "000.000.000-00"
                }
                maxLength={formData.documentType === "CNPJ" ? 18 : 14}
                className={styles.formInput}
              />
              {errors.documentNumber && (
                <p className={styles.error}>{errors.documentNumber}</p>
              )}
            </div>

            {/* Email */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="email@empresa.com"
                className={styles.formInput}
              />
              {errors.email && <p className={styles.error}>{errors.email}</p>}
            </div>

            {/* Telefone */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>Telefone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  handleInputChange("phone", formatPhone(e.target.value))
                }
                placeholder="(11) 99999-9999"
                maxLength={15}
                className={styles.formInput}
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <AddressForm
          address={formData.address}
          onChange={handleAddressChange}
          errors={errors.address || {}}
        />

        {/* Botões */}
        <div className={styles.formActions}>
          <button type="submit" disabled={isLoading} className={styles.btn}>
            {isLoading ? (
              <>
                <div className={styles.loadingSpinner}></div>
                Salvando...
              </>
            ) : (
              "Salvar Cliente"
            )}
          </button>
          <button type="button" className={styles.btn}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientCreation;
