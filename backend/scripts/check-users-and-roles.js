// backend/scripts/check-users-and-roles.js
const  pool  = require('../db/db');
const roleService = require('../services/roleService');

async function checkUsersAndRoles() {
  console.log('🔍 Verificando usuários e roles...\n');

  try {
    // 1. Verificar todos os usuários
    const usersQuery = `
      SELECT id, email, name, firebase_uid, is_active, created_at 
      FROM users 
      WHERE deleted_at IS NULL 
      ORDER BY created_at
    `;
    const usersResult = await pool.query(usersQuery);
    
    console.log('👥 Usuários no sistema:');
    console.table(usersResult.rows);

    // 2. Verificar roles atribuídas
    const userRolesQuery = `
      SELECT 
        u.id as user_id,
        u.email,
        r.name as role_name,
        r.display_name,
        ur.client_id,
        ur.is_active,
        ur.created_at as role_assigned_at
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.deleted_at IS NULL
      ORDER BY u.created_at, r.level
    `;
    const userRolesResult = await pool.query(userRolesQuery);
    
    console.log('\n👥 Usuários e suas roles:');
    console.table(userRolesResult.rows);

    // 3. Verificar se existe algum Master Admin
    const masterAdminQuery = `
      SELECT 
        u.id,
        u.email,
        u.name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'master_admin' 
      AND ur.is_active = true
      AND u.deleted_at IS NULL
    `;
    const masterAdminResult = await pool.query(masterAdminQuery);
    
    console.log('\n👑 Master Admins no sistema:');
    if (masterAdminResult.rows.length > 0) {
      console.table(masterAdminResult.rows);
    } else {
      console.log('❌ Nenhum Master Admin encontrado!');
    }

    // 4. Verificar roles disponíveis
    const rolesQuery = 'SELECT id, name, display_name, level FROM roles ORDER BY level';
    const rolesResult = await pool.query(rolesQuery);
    
    console.log('\n📋 Roles disponíveis:');
    console.table(rolesResult.rows);

    return {
      users: usersResult.rows,
      userRoles: userRolesResult.rows,
      masterAdmins: masterAdminResult.rows,
      roles: rolesResult.rows
    };

  } catch (error) {
    console.error('❌ Erro ao verificar usuários e roles:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  checkUsersAndRoles().then(() => {
    process.exit(0);
  });
}

module.exports = { checkUsersAndRoles };