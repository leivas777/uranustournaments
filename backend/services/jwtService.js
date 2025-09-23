const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET || "uranus-tournaments-dev-secret-key";
    this.expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  }

  generateToken(payload) {
    try {
      return jwt.sign(payload, this.secret, {
        expiresIn: this.expiresIn,
        issuer: "uranus-tournaments",
      });
    } catch (error) {
      console.error("❌ Erro ao gerar token JWT:", error);
      throw new Error("Erro ao gerar token de autenticação");
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Token expirado");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Token inválido");
      } else {
        throw new Error("Erro ao verificar token");
      }
    }
  }

  async hasPassword(password) {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error("❌ Erro ao hash da senha:", error);
      throw new Error("Erro ao processar senha");
    }
  }

  async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error("❌ Erro ao comparar senha:", error);
      throw new Error("Erro ao verificar senha");
    }
  }

  extractTokenFromHeader(authHeader){
    if(!authHeader){
        return null
    }

    if(authHeader.startsWith('Bearer')){
        return authHeader.substring(7)
    }

    return authHeader
  }  
}

module.exports = new JWTService()
