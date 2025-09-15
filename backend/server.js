const express = require('express')
const cors = require('cors')
const pool = require('./db/db')

require('dotenv').config();
const app = express()
const PORT = process.env.PORT || 3001
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
app.use(express.json())

app.get('/federativeUnities', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, federativeunity FROM federativeunities'); // checar nome exato da tabela
    res.json(result.rows);
  } catch (err) {
    console.error('Erro na query:', err.message); // log detalhado
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/cities/:stateId', async(req, res) => {
    
    try{
        const {stateId} = req.params
        const result = await pool.query('SELECT id, city FROM cities WHERE federalunityid = $1',
            [stateId]
        )
        res.json(result.rows)
    }catch(err){
        res.status(500).json({error: 'Internal server error.'})
    }
})

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`))