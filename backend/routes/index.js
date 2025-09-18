const express = require('express')
const router = express.Router()

const authRoutes = require('./authRoutes')
const adminUserRoutes = require('./adminUserRoutes')
const tournamentPermissionRoutes = require('./tournamentPermissionRoutes')
const clientRoutes = require('./clientRoutes')
const tournamentRoutes = require('./tournaments')

//Configurar rotas
router.use('/auth', authRoutes)
router.use('/admin', adminUserRoutes)
router.use('/permissions', tournamentPermissionRoutes)
router.use('/api', clientRoutes)
router.use('/tournament', tournamentRoutes)

//Rota de Health check
router.get('/health', (req, res) => {
    res.json({
        success: true, 
        message: 'API funcionando',
        timestamp: new Date().toISOString()
    })
})

module.exports = router