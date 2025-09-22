// frontend/src/hooks/useClients.js
import { useState, useEffect } from "react";
import ApiService from "../services/api";

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const createClient = async (clientData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ApiService.createClient(clientData);

      setSuccess("Cliente criado com sucesso!");

      // Atualizar lista de clientes
      await fetchClients();

      return result;
    } catch (error) {
      console.error("❌ Erro ao criar cliente:", error);
      setError(error.message || "Erro ao criar cliente");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ApiService.getClients();

      if (result.success) {
        setClients(result.data || []);
      } else {
        throw new Error(result.error || "Erro ao buscar clientes");
      }
    } catch (error) {
      console.error("❌ Erro ao buscar clientes:", error);
      setError(error.message || "Erro ao buscar clientes");
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (id, clientData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ApiService.updateClient(id, clientData);

      setSuccess("Cliente atualizado com sucesso!");

      // Atualizar lista de clientes
      await fetchClients();

      return result;
    } catch (error) {
      console.error("❌ Erro ao atualizar cliente:", error);
      setError(error.message || "Erro ao atualizar cliente");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClient = async (id) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ApiService.deleteClient(id);

      setSuccess("Cliente deletado com sucesso!");

      // Atualizar lista de clientes
      await fetchClients();

      return result;
    } catch (error) {
      console.error("❌ Erro ao deletar cliente:", error);
      setError(error.message || "Erro ao deletar cliente");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Carregar clientes automaticamente
  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    createClient,
    updateClient,
    deleteClient,
    fetchClients,
    isLoading,
    error,
    success,
    clearMessages,
  };
};
