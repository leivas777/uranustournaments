// backend/test-auth-integration.js
const firebaseConfig = require('../config/firebase');
const authMiddleware = require('../middleware/auth')
const userService = require('../services/userService');

async function testAuthIntegration() {
  console.log('🧪 Testando integração de autenticação...\n');

  try {
    // 1. Verificar configuração Firebase
    console.log('1. Verificando configuração Firebase...');
    const isConfigured = firebaseConfig.isFirebaseConfigured();
    console.log('Firebase configurado:', isConfigured);
    
    if (isConfigured) {
      const info = firebaseConfig.getFirebaseInfo();
      console.log('Informações Firebase:', info);
      
      const connection = await firebaseConfig.testFirebaseConnection();
      console.log('Teste de conexão:', connection);
    }

    // 2. Criar usuário de teste local
    console.log('\n2. Criando usuário de teste local...');
    const testUser = await userService.createUser({
      email: 'teste.auth3@uranus.com',
      name: 'Usuário Teste Auth',
      phone: '11999999999'
    });
    console.log('✅ Usuário criado:', testUser.email);

    // 3. Buscar usuário com roles
    console.log('\n3. Verificando roles do usuário...');
    const userWithRoles = await userService.getUserWithRoles(testUser.id);
    console.log('Roles:', userWithRoles.roles.map(r => r.name));
    console.log('Permissões (primeiras 5):', userWithRoles.permissions.slice(0, 5));

  } catch (error) {
    console.error('❌ Erro no teste de integração:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testAuthIntegration();
}

module.exports = { testAuthIntegration };