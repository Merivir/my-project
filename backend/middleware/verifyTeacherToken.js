const jwt = require("jsonwebtoken");
const SECRET_KEY = "teacher_secret_key_2024";

module.exports = function verifyTeacherToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Մուտք ընդունված չէ, token չկա։" });
  }

  console.log("➡️ Middleware-ում ստացված token:", token);
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("✅ Վավերացված:", decoded); // Կտեսնես { id: 2, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ JWT Verify Error:", err.message);
    return res.status(401).json({ message: "Token անվավեր է։" });
  }

};
