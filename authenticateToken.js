const jwt = require("jsonwebtoken");

// Middleware d'authentification
function authenticateToken(req, res, next) {
  // Récupérer le token JWT de l'en-tête Authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Si le token n'est pas présent, renvoyer une erreur 401 (non autorisé)
  if (!token) {
    return res.sendStatus(401);
  }

  // Vérifier et décoder le token JWT
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Token invalide
    }
    req.user = user; // Ajouter l'objet user décodé à l'objet req pour qu'il soit accessible dans les routes suivantes
    next(); // Passer au middleware suivant
  });
}

module.exports = authenticateToken;
