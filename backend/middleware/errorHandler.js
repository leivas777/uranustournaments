const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err.code === "23505") {
    return res.status(400).json({
      error: "Dados duplicados encontrados",
      details: err.detail,
    });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      error: "Referência inválida encontrada",
      details: err.detail,
    });
  }

  res.status(500).json({
    error: "Erro interno do servidor",
    message:
      process.env.NODE_ENV === "development" ? err.message : "Algo deu errado",
  });
};

module.exports = {errorHandler}
