import { useState, useEffect } from "react";
import styles from "./AddressForm.module.css";

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
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    setCepError("");

    try {
      const response = await fetch(`http://localhost:3001/api/cep/${cleanCep}`);
      console.log(response);
      const result = await response.json();

      if (result.success && result.data) {
        setAddressData((prev) => ({
          ...prev,
          street: result.data.street || prev.street,
          neighborhood: result.data.neighborhood || prev.neighborhood,
          city: result.data.city || prev.city,
          state: result.data.state || prev.state,
        }));
        setCepError("");
      } else {
        setCepError(result.error || "CEP não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setCepError("Erro ao buscar CEP. Tente novamente.");
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
    <div className={styles.formContainer}>
      <div className={styles.formSection}>
        <h3 className={styles.addressTitle}>📍 Endereço</h3>
        <div className={styles.addressGrid}>
          <div
            className={`${styles.addressField} ${styles.colSpan1} ${
              styles.cepField
            } ${isLoadingCep ? "loading" : ""}`}
          >
            <label className={styles.formLabel}>
              CEP*
            </label>
            <div className={styles.cepInputWrapper}>
              <input
                type="text"
                value={addressData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className={`${styles.formInput} ${
                  errors.zipCode || cepError
                    ? styles.error
                    : addressData.zipCode.length === 9 && !errors.zipCode
                    ? styles.cepValid
                    : ""
                }`}
              />
              {isLoadingCep && (
                <div className={styles.cepLoading}>
                  <div className={styles.cepSpinner}></div>
                </div>
              )}
            </div>
            {(errors.zipCode || cepError) && (
              <span className={styles.statusMessage && styles.statusError}>
                {errors.zipCode || cepError}
              </span>
            )}
            {!errors.zipCode &&
              !cepError &&
              addressData.zipCode.length === 9 &&
              !isLoadingCep && (
                <span className={styles.statusMessage && styles.statusSuccess}>
                  CEP válido
                </span>
              )}
          </div>
          <div className={`${styles.addressField} ${styles.colSpan1}`}>
            <label className={styles.formLabel}>
              Rua/Avenida*
            </label>
            <input
              type="text"
              value={addressData.street}
              onChange={(e) => handleInputChange("street", e.target.value)}
              placeholder="Nome da rua ou avenida"
              className={`${styles.formInput} ${
                errors.street ? styles.error : ""
              } `}
            />
            {errors.street && (
              <span className={styles.statusMessage && styles.statusError}>
                {errors.street}
              </span>
            )}
          </div>

          {/* Número */}
          <div className={styles.addressField && styles.colSpan1}>
            <label className={styles.formLabel}>
              Número*
            </label>
            <input
              type="text"
              value={addressData.number}
              onChange={(e) => handleInputChange("number", e.target.value)}
              placeholder="123"
              className={`${styles.formInput} ${
                errors.number ? styles.error : "border-gray-300"
              }`}
            />
            {errors.number && (
              <span className={styles.statusMessage && styles.statusError}>
                {errors.number}
              </span>
            )}
          </div>

          {/* Complemento */}
          <div className={styles.addressField && styles.colSpan1}>
            <label className={styles.formLabel}>Complemento</label>
            <input
              type="text"
              value={addressData.complement}
              onChange={(e) => handleInputChange("complement", e.target.value)}
              placeholder="Sala, Bloco, etc."
              className={styles.formInput}
            />
          </div>

          {/* Bairro */}
          <div className={styles.addressField && styles.colSpan1}>
            <label className={styles.formLabel}>
              Bairro*
            </label>
            <input
              type="text"
              value={addressData.neighborhood}
              onChange={(e) =>
                handleInputChange("neighborhood", e.target.value)
              }
              placeholder="Nome do bairro"
              className={`${styles.formInput} ${
                errors.neighborhood ? styles.error : "border-gray-300"
              }`}
            />
            {errors.neighborhood && (
              <span className={styles.statusMessage && styles.statusError}>
                {errors.neighborhood}
              </span>
            )}
          </div>

          {/* Cidade */}
          <div className={styles.colSpanTwo}>
            <label className={styles.formLabel}>
              Cidade*
            </label>
            <input
              type="text"
              value={addressData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="Nome da cidade"
              className={`${styles.formInput} ${
                errors.city ? styles.error : "border-gray-300"
              }`}
            />
            {errors.city && (
              <span className={styles.statusMessage && styles.statusError}>
                {errors.city}
              </span>
            )}
          </div>

          {/* Estado */}
          <div className={styles.colSpanTwo}>
            <label className={styles.formLabel}>
              Estado*
            </label>
            <input
              type="text"
              value={addressData.state}
              onChange={(e) => handleInputChange("state", e.target.value)}
              placeholder="SP"
              maxLength={2}
              className={`${styles.formInput} ${
                errors.state ? styles.error : "border-gray-300"
              }`}
            />
            {errors.state && (
              <span className={styles.statusMessage && styles.statusError}>{errors.state}</span>
            )}
          </div>

          {/* País */}
          <div className={styles.colSpan1}>
            <label className={styles.formLabel}>
              País*
            </label>
            <input
              type="text"
              value={addressData.country}
              onChange={(e) => handleInputChange("country", e.target.value)}
              placeholder="Brasil"
              className={styles.formInput}
            />
          </div>
        </div>
        <div className={styles.addressPreview}>
          <p className={styles.addressPreviewTitle}>
            Preview do endereço:
          </p>
          <p className={styles.addressPreviewContent}>
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
    </div>
  );
};

export default AddressForm;
