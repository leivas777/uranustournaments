const express = require('express')
const router = express.Router()
const AuthController = require('../controllers/authController')
const { authenticateFirebase } = require('../middleware/firebaseAuth')
const { auditAction } = require('../middleware/audit')
const authController = require('../controllers/authController')

//Rotas Públicas
router.post('/adminLogin', auditAction('user_login', 'admin_user'), authController.loginOrRegister)

//Rotas protegidas
router.use(authenticateFirebase)

router.get('/profile', authController.getProfile)
router.post('/logout', auditAction('user_logout', 'admin_user'), AuthController.logout)

module.exports = router
