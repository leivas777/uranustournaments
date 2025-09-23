// backend/scripts/assign-master-admin.js
const pool = require('../db/db');
const roleService = require('../services/roleService');

async function assignMasterAdmin(userEmail) {
  console.log(`👑 Atribuindo role Master Admin para: ${userEmail}\n`);

  try {
    // 1. Buscar usuário por email
    const userQuery = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL';
    const userResult = await pool.query(userQuery, [userEmail]);
    
    if (userResult.rows.length === 0) {
      throw new Error(`Usuário com email ${userEmail} não encontrado`);
    }
    
    const user = userResult.rows[0];
    console.log('👤 Usuário encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name
    });

    // 2. Buscar role Master Admin
    const roleQuery = "SELECT * FROM roles WHERE name = 'master_admin' AND is_active = true";
    const roleResult = await pool.query(roleQuery);
    
    if (roleResult.rows.length === 0) {
      throw new Error('Role master_admin não encontrada');
    }
    
    const masterRole = roleResult.rows[0];
    console.log('👑 Role Master Admin encontrada:', {
      id: masterRole.id,
      name: masterRole.name,
      display_name: masterRole.display_name
    });

    // 3. Verificar se já tem a role
    const existingRoleQuery = `
      SELECT * FROM user_roles 
      WHERE user_id = $1 AND role_id = $2 AND is_active = true
    `;
    const existingRoleResult = await pool.query(existingRoleQuery, [user.id, masterRole.id]);
    
    if (existingRoleResult.rows.length > 0) {
      console.log('⚠️ Usuário já possui a role Master Admin');
      return existingRoleResult.rows[0];
    }

    // 4. Atribuir role Master Admin
    const assignResult = await roleService.assignRoleToUser(
      user.id,
      masterRole.id,
      null, // clientId = null para Master Admin
      null, // assignedBy = null (auto-atribuição)
      null  // expiresAt = null (permanente)
    );

    console.log('✅ Role Master Admin atribuída com sucesso!');
    
    // 5. Verificar permissões
    const permissions = await roleService.getUserPermissions(user.id);
    console.log(`\n🔑 Usuário agora tem ${permissions.length} permissões`);
    console.log('Primeiras 5 permissões:', permissions.slice(0, 5).map(p => p.name));

    return assignResult;

  } catch (error) {
    console.error('❌ Erro ao atribuir Master Admin:', error);
    throw error;
  }
}

// Função para atribuir Master Admin ao primeiro usuário sem roles
async function assignMasterAdminToFirstUser() {
  console.log('👑 Procurando primeiro usuário para tornar Master Admin...\n');

  try {
    // Buscar usuários sem roles
    const usersWithoutRolesQuery = `
      SELECT u.* 
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
      WHERE u.deleted_at IS NULL 
      AND ur.id IS NULL
      ORDER BY u.created_at
      LIMIT 1
    `;
    
    const result = await pool.query(usersWithoutRolesQuery);
    
    if (result.rows.length === 0) {
      console.log('⚠️ Nenhum usuário sem roles encontrado');
      return null;
    }

    const firstUser = result.rows[0];
    console.log('👤 Primeiro usuário sem roles encontrado:', firstUser.email);
    
    return await assignMasterAdmin(firstUser.email);

  } catch (error) {
    console.error('❌ Erro ao atribuir Master Admin ao primeiro usuário:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  const userEmail = process.argv[2];
  
  if (userEmail) {
    assignMasterAdmin(userEmail).then(() => {
      process.exit(0);
    });
  } else {
    assignMasterAdminToFirstUser().then(() => {
      process.exit(0);
    });
  }
}

module.exports = { assignMasterAdmin, assignMasterAdminToFirstUser };