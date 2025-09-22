const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("❌ API Error:", error);
      throw error;
    }
  }

  // Métodos básicos
  async get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  // Métodos específicos para CEP
  async getCep(cep) {
    return this.get(`/api/cep/${cep}`);
  }

  // Métodos específicos para Clientes
  async createClient(clientData) {
    return this.post("/api/clients", clientData);
  }

  async getClients() {
    return this.get("/api/clients");
  }

  async getClientById(id) {
    return this.get(`/api/clients/${id}`);
  }

  async updateClient(id, clientData) {;
    return this.put(`/api/clients/${id}`, clientData);
  }

  async deleteClient(id) {
    return this.delete(`/api/clients/${id}`);
  }

  // Outros métodos existentes
  async getTournaments() {
    return this.get("/api/tournaments");
  }

  async getFederativeUnities() {
    return this.get("/api/locations/federative-unities");
  }
}

export default new ApiService();
