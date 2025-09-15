// tests/setup.js
// Setup para testes do backend

// Mock de console para testes mais limpos
global.console = {
  ...console,
  // Silenciar logs durante testes (opcional)
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock de variáveis de ambiente se necessário
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// Configurações globais para testes
jest.setTimeout(10000); // 10 segundos timeout