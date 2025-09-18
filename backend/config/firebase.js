// config/firebase.js
const admin = require("firebase-admin");

let firebaseApp;

const initializeFirebase = () => {
  // Verificar se já existe uma app inicializada
  try {
    firebaseApp = admin.app(); // Tentar obter a app existente
    console.log("✅ Firebase Admin já estava inicializado - reutilizando instância existente");
    return firebaseApp;
  } catch (error) {
    // Se não existe, vamos criar uma nova
    console.log("🔄 Inicializando nova instância do Firebase Admin...");
  }

  try {
    // OPÇÃO 1: Tentar com service account file primeiro
    try {
      const serviceAccount = require("./firebase-service-account.json");
      
      // Validar se o arquivo tem as propriedades necessárias
      if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        console.log("✅ Firebase Admin inicializado com service account file");
        return firebaseApp;
      } else {
        throw new Error("Service account file está incompleto");
      }
    } catch (fileError) {
      console.log("❌ Erro com service account file:", fileError.message);
    }

    // OPÇÃO 2: Tentar com variáveis de ambiente (Admin SDK)
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\n/g, "\n"),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log("✅ Firebase Admin inicializado com variáveis de ambiente");
      return firebaseApp;
    }

    // OPÇÃO 3: Usar Application Default Credentials (para desenvolvimento)
    if (process.env.FIREBASE_PROJECT_ID) {
      try {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log("✅ Firebase Admin inicializado com Application Default Credentials");
        return firebaseApp;
      } catch (adcError) {
        console.log("❌ Application Default Credentials não disponíveis:", adcError.message);
      }
    }

    throw new Error("Nenhuma configuração válida encontrada para Firebase Admin");

  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error.message);
    throw error;
  }
};

const getFirebaseAuth = () => {
  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
  }
  return firebaseApp.auth();
};

// Função para verificar se o Firebase está configurado corretamente
const isFirebaseConfigured = () => {
  try {
    // Verificar se já existe uma app
    try {
      admin.app();
      return true;
    } catch (error) {
      // Se não existe, tentar inicializar
      initializeFirebase();
      return true;
    }
  } catch (error) {
    return false;
  }
};

// Função para testar a conexão
const testFirebaseConnection = async () => {
  try {
    const auth = getFirebaseAuth();
    // Tentar uma operação simples para verificar se está funcionando
    await auth.listUsers(1);
    return { success: true, message: "Conexão com Firebase funcionando" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Função para obter informações da app Firebase
const getFirebaseInfo = () => {
  try {
    const app = admin.app();
    return {
      name: app.name,
      projectId: app.options.projectId,
      isInitialized: true
    };
  } catch (error) {
    return {
      isInitialized: false,
      error: error.message
    };
  }
};

module.exports = { 
  initializeFirebase, 
  getFirebaseAuth, 
  isFirebaseConfigured,
  testFirebaseConnection,
  getFirebaseInfo
};