// backend/test-roles.js
const RoleService = require('../services/roleServices')

async function testRoles() {
  console.log('🧪 Testando sistema de roles...\n');

  try {
    // Listar todas as roles
    console.log('📋 Todas as roles:');
    const roles = await RoleService.getAllRoles();
    console.table(roles);

    // Buscar role específica
    console.log('\n🔍 Role Master Admin:');
    const masterRole = await RoleService.getRoleById(1);
    console.log(masterRole);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testRoles();