const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");

//Routes
const tournamentRoutes = require("./routes/tournaments");
const locationRoutes = require("./routes/locations");
const configRoutes = require("./routes/config");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: process.env.FRONTENDURL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

//Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

//Routes
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/config", configRoutes);

//Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

//Error Handling
app.use(errorHandler);

//404 handler
app.use((req, res) => {
  res.status(404).json({succes: false, error: 'Endpoint não encontrado', path: req.path, method:req.method });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
