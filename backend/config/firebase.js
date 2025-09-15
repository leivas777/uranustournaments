const admin = require("firebase-admin");
const path = require("path");

let firebaseApp;

const initializeFirebase = () => {
  if (firebaseApp) {
    try {
      if (process.env.NODE_ENV !== "production") {
        const serviceAccount = require("./firebase-service-account.json");
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, "\n"),
          }),
        });
      }
      console.log("Firebase Admin inicializado com sucesso.");
    } catch (error) {
      console.log("Erro ao inicializar Firebase Admin", error);
      throw error;
    }
  }
  return firebaseApp
};

const getFirebaseAuth = () => {
    if(!firebaseApp){
        initializeFirebase()
    }
    return admin.auth()
}

module.exports = {initializeFirebase, getFirebaseAuth}
