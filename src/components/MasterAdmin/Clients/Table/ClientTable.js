// frontend/src/components/MasterAdmin/Clients/Table/ClientTable.js
import React, { useState } from 'react';
import styles from './ClientTable.module.css';

const ClientTable = ({ 
  clients = [], 
  onEdit, 
  onDelete, 
  isLoading = false 
}) => {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar clientes baseado na busca
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document_number.includes(searchTerm)
  );

  // Ordenar clientes
  const sortedClients = [...filteredClients].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (sortDirection === 'asc') {
      return aValue.toString().localeCompare(bValue.toString());
    } else {
      return bValue.toString().localeCompare(aValue.toString());
    }
  });

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDocument = (document, type) => {
    if (!document) return '';
    
    const cleanDoc = document.replace(/\D/g, '');
    
    if (type === 'CNPJ' && cleanDoc.length === 14) {
      return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (type === 'CPF' && cleanDoc.length === 11) {
      return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    return document;
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const getSortIcon = (field) => {
    if (field !== sortField) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Carregando clientes...</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      {/* Barra de busca */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="🔍 Buscar por nome, email ou documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.resultsCount}>
          {filteredClients.length} de {clients.length} clientes
        </div>
      </div>

      {/* Tabela */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className={styles.sortable}>
                Nome {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('document_type')} className={styles.sortable}>
                Documento {getSortIcon('document_type')}
              </th>
              <th onClick={() => handleSort('email')} className={styles.sortable}>
                Email {getSortIcon('email')}
              </th>
              <th>Telefone</th>
              <th>Cidade</th>
              <th onClick={() => handleSort('created_at')} className={styles.sortable}>
                Criado em {getSortIcon('created_at')}
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedClients.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyState}>
                  {searchTerm ? 
                    '🔍 Nenhum cliente encontrado com os critérios de busca' : 
                    '📋 Nenhum cliente cadastrado ainda'
                  }
                </td>
              </tr>
            ) : (
              sortedClients.map((client) => (
                <tr key={client.id} className={styles.tableRow}>
                  <td className={styles.nameCell}>
                    <div className={styles.clientName}>{client.name}</div>
                    <div className={styles.clientId}>ID: {client.id}</div>
                  </td>
                  <td>
                    <div className={styles.documentType}>{client.document_type}</div>
                    <div className={styles.documentNumber}>
                      {formatDocument(client.document_number, client.document_type)}
                    </div>
                  </td>
                  <td className={styles.emailCell}>{client.email}</td>
                  <td>{formatPhone(client.phone)}</td>
                  <td>
                    {client.address?.city && client.address?.state ? 
                      `${client.address.city}, ${client.address.state}` : 
                      '-'
                    }
                  </td>
                  <td>
                    {new Date(client.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={() => onEdit(client)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Editar cliente"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(client)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Deletar cliente"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;