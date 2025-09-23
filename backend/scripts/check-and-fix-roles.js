// backend/scripts/check-and-fix-roles.js
const  pool  = require('../db/db');

async function checkAndFixRoles() {
  console.log('🔍 Verificando estado das roles no banco...\n');

  try {
    // Verificar roles existentes
    const rolesQuery = 'SELECT id, name, display_name, level FROM roles ORDER BY level';
    const rolesResult = await pool.query(rolesQuery);
    
    console.log('📋 Roles encontradas:');
    console.table(rolesResult.rows);

    // Verificar permissões existentes
    const permissionsQuery = 'SELECT COUNT(*) as total FROM permissions';
    const permissionsResult = await pool.query(permissionsQuery);
    console.log(`\n📋 Total de permissões: ${permissionsResult.rows[0].total}`);

    // Verificar relacionamentos role-permission
    const rolePermissionsQuery = `
      SELECT r.name as role_name, COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name
      ORDER BY r.level
    `;
    const rolePermissionsResult = await pool.query(rolePermissionsQuery);
    
    console.log('\n📋 Permissões por role:');
    console.table(rolePermissionsResult.rows);

    // Verificar usuários existentes
    const usersQuery = 'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL';
    const usersResult = await pool.query(usersQuery);
    console.log(`\n👥 Total de usuários: ${usersResult.rows[0].total}`);

    // Verificar user_roles
    const userRolesQuery = `
      SELECT u.email, r.name as role_name, ur.client_id
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.is_active = true
    `;
    const userRolesResult = await pool.query(userRolesQuery);
    
    console.log('\n👥 Usuários com roles:');
    if (userRolesResult.rows.length > 0) {
      console.table(userRolesResult.rows);
    } else {
      console.log('Nenhum usuário com roles encontrado');
    }

    // Verificar se master_admin existe
    const masterAdminQuery = "SELECT id FROM roles WHERE name = 'master_admin'";
    const masterAdminResult = await pool.query(masterAdminQuery);
    
    if (masterAdminResult.rows.length === 0) {
      console.log('\n❌ Role master_admin não encontrada!');
      console.log('Execute as migrações de roles primeiro:');
      console.log('psql -U postgres -d uranustournaments -f migrations/008_expand_roles_permissions.sql');
    } else {
      console.log(`\n✅ Role master_admin encontrada com ID: ${masterAdminResult.rows[0].id}`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar roles:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  checkAndFixRoles().then(() => {
    process.exit(0);
  });
}

module.exports = { checkAndFixRoles };