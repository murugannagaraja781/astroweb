// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Try both header styles
  const xAuth = req.header("x-auth-token");
  const authHeader = req.header("authorization") || req.header("Authorization");
  let token = xAuth;

  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_SECRET_KEY);
    // Keep shape consistent: decoded.user or decoded
    req.user = decoded.user || decoded;
    return next();
  } catch (err) {
    console.error("Auth verify error:", err);
    return res.status(401).json({ msg: "Token is not valid" });
  }
};
