// test-firebase-final.js
require('dotenv').config();

async function testFirebaseSetup() {
  console.log('🧪 Testando configuração final do Firebase...\n');
  
  try {
    // Importar após carregar dotenv
    const { getFirebaseAuth, testFirebaseConnection, getFirebaseInfo } = require('../config/firebase');

    // Teste 1: Informações da app
    console.log('1️⃣ Verificando informações da app...');
    const info = getFirebaseInfo();
    console.log(`✅ Firebase App: ${info.name}`);
    console.log(`✅ Project ID: ${info.projectId}`);
    console.log(`✅ Status: ${info.isInitialized ? 'Inicializado' : 'Não inicializado'}\n`);

    // Teste 2: Obter Auth
    console.log('2️⃣ Testando Firebase Auth...');
    const auth = getFirebaseAuth();
    console.log('✅ Firebase Auth obtido com sucesso\n');

    // Teste 3: Conexão real
    console.log('3️⃣ Testando conexão real...');
    const connectionTest = await testFirebaseConnection();
    
    if (connectionTest.success) {
      console.log('✅ Conexão com Firebase funcionando perfeitamente!');
    } else {
      console.log('⚠️  Firebase inicializado, mas com limitações:', connectionTest.message);
    }

    // Teste 4: Token customizado
    console.log('\n4️⃣ Testando criação de token customizado...');
    try {
      const customToken = await auth.createCustomToken('test-uid-123');
      console.log('✅ Token customizado criado com sucesso!');
    } catch (tokenError) {
      console.log('⚠️  Erro ao criar token:', tokenError.message);
    }

    console.log('\n🎉 Todos os testes concluídos!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testFirebaseSetup();