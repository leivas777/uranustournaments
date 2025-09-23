// backend/tempTests/test-auth-complete.js
const firebaseConfig = require('../config/firebase');
const userService = require('../services/userService');
const roleService = require('../services/roleService');
const jwtService = require('../services/jwtService');

async function testAuthComplete() {
  console.log('🧪 Teste completo de autenticação...\n');

  try {
    // 1. Buscar usuário de teste
    const testUser = await userService.getUserByEmail('teste.auth3@uranus.com');
    
    if (!testUser) {
      console.log('❌ Usuário de teste não encontrado');
      return;
    }

    console.log('👤 Usuário de teste encontrado:', {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name
    });

    // 2. Verificar roles e permissões
    const userWithRoles = await userService.getUserWithRoles(testUser.id);
    
    console.log('\n👑 Roles do usuário:');
    console.table(userWithRoles.roles.map(r => ({
      name: r.name,
      display_name: r.display_name,
      level: r.level
    })));

    console.log(`\n🔑 Total de permissões: ${userWithRoles.permissions.length}`);
    console.log('Primeiras 10 permissões:', userWithRoles.permissions.slice(0, 10));

    // 3. Verificar se é Master Admin
    const isMaster = await roleService.isMasterAdmin(testUser.id);
    console.log(`\n👑 É Master Admin: ${isMaster ? 'SIM' : 'NÃO'}`);

    // 4. Testar algumas permissões específicas
    const permissionsToTest = [
      'system.admin',
      'clients.create',
      'users.manage',
      'tournaments.manage'
    ];

    console.log('\n🔍 Testando permissões específicas:');
    for (const permission of permissionsToTest) {
      const hasPermission = await roleService.hasPermission(testUser.id, permission);
      console.log(`  ${permission}: ${hasPermission ? '✅' : '❌'}`);
    }

    // 5. Gerar token JWT para teste
    const token = jwtService.generateToken({
      userId: testUser.id,
      email: testUser.email
    });

    console.log('\n🔑 Token JWT gerado:');
    console.log(token.substring(0, 50) + '...');

    // 6. Verificar token
    const decoded = jwtService.verifyToken(token);
    console.log('\n✅ Token verificado:', {
      userId: decoded.userId,
      email: decoded.email,
      iat: new Date(decoded.iat * 1000).toLocaleString(),
      exp: new Date(decoded.exp * 1000).toLocaleString()
    });

  } catch (error) {
    console.error('❌ Erro no teste completo:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testAuthComplete().then(() => {
    process.exit(0);
  });
}

module.exports = { testAuthComplete };