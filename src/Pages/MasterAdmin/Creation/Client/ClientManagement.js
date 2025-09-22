// frontend/src/pages/MasterAdmin/Clients/ClientManagement.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientCreation from "../../../../components/MasterAdmin/Clients/Creation/ClientCreation";
import ClientTable from "../../../../components/MasterAdmin/Clients/Table/ClientTable";
import { useClients } from "../../../../hooks/useClients";
import styles from "./ClientManagement.module.css";

const ClientManagement = () => {
  const navigate = useNavigate();
  const { 
    clients, 
    createClient, 
    updateClient, 
    deleteClient, 
    isLoading, 
    error, 
    success, 
    clearMessages 
  } = useClients();

  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
  const [editingClient, setEditingClient] = useState(null);

  const handleCreateClient = async (clientData) => {
    try {
      console.log("📋 Dados do cliente para envio:", clientData);

      if (!clientData.name || !clientData.email || !clientData.documentNumber) {
        throw new Error("Dados obrigatórios não preenchidos.");
      }

      if (!clientData.address || !clientData.address.zipCode) {
        throw new Error("Endereço é obrigatório.");
      }

      const result = await createClient(clientData);
      console.log("✅ Cliente criado:", result);

      // Voltar para a lista após criar
      setTimeout(() => {
        setCurrentView('list');
      }, 2000);
    } catch (error) {
      console.error("❌ Erro no handleCreateClient:", error);
    }
  };

  const handleEditClient = async (clientData) => {
    try {
      console.log("📋 Dados do cliente para atualização:", clientData);

      if (!editingClient?.id) {
        throw new Error("ID do cliente não encontrado.");
      }

      const result = await updateClient(editingClient.id, clientData);
      console.log("✅ Cliente atualizado:", result);

      // Voltar para a lista após editar
      setTimeout(() => {
        setCurrentView('list');
        setEditingClient(null);
      }, 2000);
    } catch (error) {
      console.error("❌ Erro no handleEditClient:", error);
    }
  };

  const handleDeleteClient = async (client) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja deletar o cliente "${client.name}"?\n\nEsta ação não pode ser desfeita.`
    );

    if (confirmDelete) {
      try {
        await deleteClient(client.id);
        console.log("✅ Cliente deletado:", client.id);
      } catch (error) {
        console.error("❌ Erro ao deletar cliente:", error);
      }
    }
  };

  const startEdit = (client) => {
    setEditingClient(client);
    setCurrentView('edit');
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setCurrentView('list');
  };

  const renderHeader = () => (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>
          {currentView === 'list' && '👥 Gerenciamento de Clientes'}
          {currentView === 'create' && '➕ Criar Novo Cliente'}
          {currentView === 'edit' && '✏️ Editar Cliente'}
        </h1>
        
        {currentView === 'list' && (
          <div className={styles.headerActions}>
            <div className={styles.stats}>
              <span className={styles.statItem}>
                📊 Total: <strong>{clients.length}</strong>
              </span>
            </div>
            <button
              onClick={() => setCurrentView('create')}
              className={styles.createBtn}
            >
              ➕ Novo Cliente
            </button>
          </div>
        )}

        {(currentView === 'create' || currentView === 'edit') && (
          <button
            onClick={() => setCurrentView('list')}
            className={styles.backBtn}
          >
            ← Voltar para Lista
          </button>
        )}
      </div>
    </div>
  );

  const renderMessages = () => (
    <>
      {error && (
        <div className={styles.errorMessage}>
          ❌ {error}
          <button onClick={clearMessages} className={styles.closeBtn}>✕</button>
        </div>
      )}
      
      {success && (
        <div className={styles.successMessage}>
          ✅ {success}
        </div>
      )}
    </>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <ClientCreation 
            onSubmit={handleCreateClient}
            isLoading={isLoading}
          />
        );

      case 'edit':
        return (
          <ClientCreation 
            onSubmit={handleEditClient}
            initialData={{
              name: editingClient?.name || '',
              documentNumber: editingClient?.document_number || '',
              documentType: editingClient?.document_type || 'CNPJ',
              email: editingClient?.email || '',
              phone: editingClient?.phone || '',
              address: editingClient?.address || {}
            }}
            isLoading={isLoading}
          />
        );

      case 'list':
      default:
        return (
          <ClientTable
            clients={clients}
            onEdit={startEdit}
            onDelete={handleDeleteClient}
            isLoading={isLoading}
          />
        );
    }
  };

  return (
    <div className={styles.container}>
      {renderHeader()}
      
      <div className={styles.content}>
        {renderMessages()}
        {renderContent()}
      </div>
    </div>
  );
};

export default ClientManagement;