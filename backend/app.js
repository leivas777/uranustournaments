// app.js (versão corrigida)
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

console.log('🚀 Iniciando aplicação...');

const { errorHandler } = require("./middleware/errorHandler");

// Routes existentes
console.log('📂 Carregando rotas...');
const tournamentRoutes = require("./routes/tournaments");
const locationRoutes = require("./routes/locations");
const configRoutes = require("./routes/config");

const authRoutes = require("./routes/authRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const tournamentPermissionRoutes = require("./routes/tournamentPermissionRoutes");
const clientRoutes = require("./routes/clientRoutes");
const cepRoutes = require('./routes/cepRoutes');

console.log('✅ Todas as rotas carregadas');

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log(`🔧 Configurando servidor na porta ${PORT}`);

// ==================== FIREBASE INITIALIZATION ====================
let firebaseInitialized = false;
let firebaseError = null;

const initializeFirebaseOnce = () => {
  if (!firebaseInitialized) {
    try {
      const { initializeFirebase, getFirebaseInfo } = require("./config/firebase");
      initializeFirebase();
      
      const info = getFirebaseInfo();
      console.log("✅ Firebase inicializado com sucesso");
      console.log(`   📋 Project ID: ${info.projectId}`);
      console.log(`   🏷️  App Name: ${info.name}`);
      
      firebaseInitialized = true;
    } catch (error) {
      console.error("❌ Erro ao inicializar Firebase:", error.message);
      firebaseError = error;
    }
  }
};

// Inicializar Firebase
initializeFirebaseOnce();

// ==================== SECURITY & MIDDLEWARE ====================

// Configurações de segurança do Helmet (MAIS PERMISSIVAS)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

console.log('🔧 Configurando middlewares básicos...');

// CORS configurado
const corsOptions = {
  origin: process.env.FRONTENDURL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true
};

app.use(cors(corsOptions));

// Middlewares básicos
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

console.log('✅ Middlewares básicos configurados');

// Trust proxy
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    success: false,
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting APENAS nas rotas de auth
app.use('/api/auth', limiter);

// Middleware para log de requisições
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  req.timestamp = new Date().toISOString();
  next();
});

// ==================== ROTAS DE TESTE ====================
console.log('🧪 Configurando rotas de teste...');

// Rota de teste básica
app.get('/test', (req, res) => {
  console.log('🧪 Rota de teste básica chamada');
  res.json({
    success: true,
    message: 'Servidor funcionando!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Rota de teste com parâmetro
app.get('/test/:param', (req, res) => {
  console.log('🧪 Rota de teste com parâmetro chamada:', req.params);
  res.json({
    success: true,
    message: 'Rota com parâmetro funcionando!',
    param: req.params.param,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get("/health", (req, res) => {
  console.log('❤️ Health check chamado');
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    firebase: firebaseInitialized ? "✅ Configurado" : "❌ Erro na configuração"
  });
});

// ==================== ROTAS PRINCIPAIS ====================
console.log('📋 Registrando rotas principais...');

// CEP (sem autenticação)
console.log('📍 Registrando rota CEP: /api/cep');
app.use('/api/cep', cepRoutes);

// Rotas existentes
console.log('🏆 Registrando rotas de tournaments...');
app.use("/api/tournaments", tournamentRoutes);

console.log('📍 Registrando rotas de locations...');
app.use("/api/locations", locationRoutes);

console.log('⚙️ Registrando rotas de config...');
app.use("/api/config", configRoutes);

// Rotas de autenticação (novas)
console.log('🔐 Registrando rotas de auth...');
app.use("/api/auth", authRoutes);

console.log('👥 Registrando rotas de admin...');
app.use("/api/admin", adminUserRoutes);

console.log('🔑 Registrando rotas de permissions...');
app.use("/api/permissions", tournamentPermissionRoutes);

console.log('🏢 Registrando rotas de clients...');
app.use("/api/clients", clientRoutes);

console.log('✅ Todas as rotas registradas');

// Rota de informações da API
app.get("/api", (req, res) => {
  console.log('📋 Rota /api chamada');
  res.json({
    success: true,
    message: "Uranus Tournaments API",
    version: "2.0.0",
    firebase: firebaseInitialized ? "✅ Configurado" : "❌ Erro na configuração",
    endpoints: {
      test: "/test",
      health: "/health",
      cep: "/api/cep",
      tournaments: "/api/tournaments",
      locations: "/api/locations",
      config: "/api/config",
      auth: "/api/auth",
      admin: "/api/admin",
      permissions: "/api/permissions",
      clients: "/api/clients"
    }
  });
});

// ==================== ERROR HANDLING ====================

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error(`[${req.timestamp || new Date().toISOString()}] Erro na aplicação:`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Erro de autenticação do Firebase
  if (error.code && error.code.startsWith('auth/')) {
    return res.status(401).json({
      success: false,
      error: 'Erro de autenticação',
      code: error.code,
      message: getFirebaseErrorMessage(error.code)
    });
  }

  // Erro de validação de dados
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: error.details || error.message
    });
  }

  // Erro de banco de dados
  if (error.code === '23505') {
    return res.status(400).json({
      success: false,
      error: 'Dados duplicados',
      code: 'DUPLICATE_DATA'
    });
  }

  if (error.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referência inválida',
      code: 'INVALID_REFERENCE'
    });
  }

  // Usar o errorHandler existente como fallback
  errorHandler(error, req, res, next);
});

// 404 handler (CORRIGIDO - sem '*')
app.use((req, res) => {
  console.log(`❌ 404 - Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/test',
      '/health',
      '/api',
      '/api/cep',
      '/api/tournaments',
      '/api/locations',
      '/api/config'
    ]
  });
});

// ==================== STARTUP ====================

const server = app.listen(PORT, () => {
  console.log('🎉 =================================');
  console.log(`🚀 Servidor RODANDO na porta ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🧪 Teste: http://localhost:${PORT}/test`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log(`📋 Info: http://localhost:${PORT}/api`);
  console.log('🎉 =================================');
  
  if (firebaseInitialized) {
    console.log('�� Firebase: ✅ Configurado e funcionando');
  } else {
    console.log('🔥 Firebase: ❌ Erro na configuração');
  }
});

// Log de erro se o servidor não conseguir iniciar
server.on('error', (error) => {
  console.error('❌ Erro ao iniciar servidor:', error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso!`);
    console.log('💡 Tente:');
    console.log('   - Parar outros servidores na porta 3001');
    console.log('   - Usar outra porta: PORT=3002 npm start');
    console.log('   - Verificar processos: lsof -ti:3001');
  }
});

// Helper function
function getFirebaseErrorMessage(errorCode) {
  const errorMessages = {
    'auth/id-token-expired': 'Token expirado. Faça login novamente.',
    'auth/id-token-revoked': 'Token revogado. Faça login novamente.',
    'auth/invalid-id-token': 'Token inválido.',
    'auth/user-disabled': 'Usuário desabilitado.',
    'auth/project-not-found': 'Projeto Firebase não encontrado.',
    'auth/insufficient-permission': 'Permissões insuficientes.'
  };
  
  return errorMessages[errorCode] || 'Erro de autenticação desconhecido.';
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido. Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente');
    process.exit(0);
  });
});

module.exports = app;