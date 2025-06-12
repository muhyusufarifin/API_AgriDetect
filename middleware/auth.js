const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from the Authorization header
  const authHeader = req.header('Authorization');

  // Check if no token is provided
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Extract the actual token string (remove "Bearer ")
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Invalid token format, authorization denied' });
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // 'user' is the key we used when creating the JWT payload
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};