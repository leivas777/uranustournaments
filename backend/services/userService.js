// backend/services/userService.js (versão corrigida)
const  pool  = require('../db/db');
const jwtService = require('../services/jwtService');
const roleService = require('../services/roleService');

class UserService {
  async createUser(userData) {
    console.log('👤 UserService.createUser iniciado');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar se email já existe
      const existingUser = await this.getUserByEmail(userData.email, client);
      if (existingUser) {
        throw new Error('Usuário com este email já existe');
      }

      // Verificar se Firebase UID já existe (se fornecido)
      if (userData.firebase_uid) {
        const existingFirebaseUser = await this.getUserByFirebaseUID(userData.firebase_uid, client);
        if (existingFirebaseUser) {
          throw new Error('Usuário com este Firebase UID já existe');
        }
      }

      const query = `
        INSERT INTO users (firebase_uid, email, name, phone, avatar_url, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        userData.firebase_uid || null,
        userData.email,
        userData.name,
        userData.phone || null,
        userData.avatar_url || null,
        userData.email_verified || false
      ];

      const result = await client.query(query, values);
      const newUser = result.rows[0];

      // Verificar se é o primeiro usuário e atribuir role Master Admin
      const userCount = await this.getUserCount(client);
      if (userCount === 1) {
        console.log('👑 Primeiro usuário - tentando atribuir role Master Admin');
        
        // Buscar a role master_admin pelo nome (mais seguro que por ID)
        const masterRoleQuery = 'SELECT id FROM roles WHERE name = $1 AND is_active = true';
        const masterRoleResult = await client.query(masterRoleQuery, ['master_admin']);
        
        if (masterRoleResult.rows.length > 0) {
          const masterRoleId = masterRoleResult.rows[0].id;
          console.log(`👑 Role Master Admin encontrada com ID: ${masterRoleId}`);
          
          // Atribuir role usando o client da transação
          await this.assignRoleToUserInTransaction(
            newUser.id, 
            masterRoleId, 
            null, // clientId = null para Master Admin
            null, // assignedBy = null (auto-atribuição)
            null, // expiresAt = null (permanente)
            client
          );
          
          console.log('✅ Role Master Admin atribuída com sucesso');
        } else {
          console.log('⚠️ Role Master Admin não encontrada - usuário criado sem role');
        }
      }

      await client.query('COMMIT');
      
      console.log('✅ Usuário criado:', newUser.id);
      return newUser;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro no UserService.createUser:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Método auxiliar para atribuir role dentro de uma transação
  async assignRoleToUserInTransaction(userId, roleId, clientId, assignedBy, expiresAt, client) {
    try {
      // Verificar se já existe a atribuição
      const existingQuery = `
        SELECT * FROM user_roles 
        WHERE user_id = $1 AND role_id = $2 AND client_id = $3
      `;
      const existingResult = await client.query(existingQuery, [userId, roleId, clientId]);

      if (existingResult.rows.length > 0) {
        // Atualizar se existir
        const updateQuery = `
          UPDATE user_roles 
          SET is_active = true, expires_at = $4, updated_at = NOW()
          WHERE user_id = $1 AND role_id = $2 AND client_id = $3
          RETURNING *
        `;
        const result = await client.query(updateQuery, [userId, roleId, clientId, expiresAt]);
        return result.rows[0];
      } else {
        // Inserir nova atribuição
        const insertQuery = `
          INSERT INTO user_roles (user_id, role_id, client_id, assigned_by, expires_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const result = await client.query(insertQuery, [userId, roleId, clientId, assignedBy, expiresAt]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('❌ Erro ao atribuir role na transação:', error);
      throw error;
    }
  }

  async getUserByEmail(email, client = null) {
    const queryClient = client || pool;
    
    try {
      const query = `
        SELECT * FROM users 
        WHERE email = $1 AND deleted_at IS NULL
      `;
      
      const result = await queryClient.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro no UserService.getUserByEmail:', error);
      throw error;
    }
  }

  async getUserByFirebaseUID(firebaseUID, client = null) {
    const queryClient = client || pool;
    
    try {
      const query = `
        SELECT * FROM users 
        WHERE firebase_uid = $1 AND deleted_at IS NULL
      `;
      
      const result = await queryClient.query(query, [firebaseUID]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro no UserService.getUserByFirebaseUID:', error);
      throw error;
    }
  }

  async getUserById(userId, client = null) {
    const queryClient = client || pool;
    
    try {
      const query = `
        SELECT * FROM users 
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const result = await queryClient.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro no UserService.getUserById:', error);
      throw error;
    }
  }

  async getUserCount(client = null) {
    const queryClient = client || pool;
    
    try {
      const query = 'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL';
      const result = await queryClient.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Erro no UserService.getUserCount:', error);
      throw error;
    }
  }

  async updateLastLogin(userId) {
    try {
      const query = `
        UPDATE users 
        SET last_login = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING last_login
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro no UserService.updateLastLogin:', error);
      throw error;
    }
  }

  async getUserWithRoles(userId, clientId = null) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return null;
      }

      // Buscar roles do usuário
      const roles = await roleService.getUserRoles(userId, clientId);
      
      // Buscar permissões do usuário
      const permissions = await roleService.getUserPermissions(userId, clientId);

      return {
        ...user,
        roles,
        permissions: permissions.map(p => p.name)
      };
    } catch (error) {
      console.error('❌ Erro no UserService.getUserWithRoles:', error);
      throw error;
    }
  }

  async createOrUpdateFromFirebase(firebaseUser) {
    console.log('🔥 UserService.createOrUpdateFromFirebase iniciado');
    console.log('📋 Dados do Firebase:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      email_verified: firebaseUser.email_verified
    });
    
    try {
      // Tentar encontrar usuário existente por Firebase UID
      let user = await this.getUserByFirebaseUID(firebaseUser.uid);
      
      if (!user) {
        // Tentar encontrar por email
        user = await this.getUserByEmail(firebaseUser.email);
        
        if (user) {
          // Usuário existe mas não tem Firebase UID - vamos vincular
          console.log('🔗 Vinculando usuário existente ao Firebase UID');
          const query = `
            UPDATE users 
            SET firebase_uid = $1, email_verified = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING *
          `;
          
          const result = await pool.query(query, [
            firebaseUser.uid,
            firebaseUser.email_verified,
            user.id
          ]);
          
          user = result.rows[0];
          console.log('✅ Usuário vinculado ao Firebase UID');
        } else {
          // Criar novo usuário
          console.log('👤 Criando novo usuário a partir do Firebase');
          user = await this.createUser({
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.name || firebaseUser.email.split('@')[0],
            phone: firebaseUser.phone || null,
            avatar_url: firebaseUser.picture || null,
            email_verified: firebaseUser.email_verified || false
          });
          console.log('✅ Novo usuário criado a partir do Firebase');
        }
      } else {
        // Usuário já existe - atualizar informações se necessário
        console.log('🔄 Atualizando informações do usuário existente');
        const query = `
          UPDATE users 
          SET name = COALESCE($1, name), 
              avatar_url = COALESCE($2, avatar_url), 
              email_verified = $3, 
              updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `;
        
        const result = await pool.query(query, [
          firebaseUser.name,
          firebaseUser.picture,
          firebaseUser.email_verified,
          user.id
        ]);
        
        user = result.rows[0];
        console.log('✅ Informações do usuário atualizadas');
      }

      return user;
    } catch (error) {
      console.error('❌ Erro no UserService.createOrUpdateFromFirebase:', error);
      throw error;
    }
  }
}

module.exports = new UserService();