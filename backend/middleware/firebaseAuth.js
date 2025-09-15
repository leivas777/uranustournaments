const admin = requires('firebase-admin')
const AdminUserService = require('../services/adminUserServices')

const serviceAccount = require('../config/firebase-service-account.json')
admin.initializeApp({
    credential:admin.credential.cert(serviceAccount)
})

const authenticateFirebase = async(req, res, next) => {
    try{
        const authHeader = req.headers.authorization

        if(!authHeader || !authHeader.startsWith('Bearer')){
            return res.status(401).json({error: "Token de autorização necessário"})
        }

        const token = authHeader.split('Bearer')[1]

        const decodedToken = await admin.auth().verifyIdToken(token)

        const adminUser = await AdminUserService.getByFirebaseUid(decodedToken.uid)

        if(!adminUser || !adminUser.is_active){
            return res.status(403).json({error:'Usuário não autorizado'})
        }

        req.user = {
            firebaseUid: decodedToken.uid,
            adminUserId: adminUser.id,
            clientId: adminUser.client_id,
            role: adminUser.role,
            permissions:adminUser.permissions,
            email: adminUser.email,
            name: adminUser.name
        }

        next()
    }catch(error){
        console.log('Erro na autenticação', error)
        res.status(401).json({ error: "Token inválido."})
    }
}

module.exports = {authenticateFirebase}