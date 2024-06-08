const jwt = require('jsonwebtoken');
const jwtSecret = '69c0600e2b70a659ca1f4e98c7f775815b462bd6fd1297da001a6f11b6385817';

const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token.split(' ')[1], jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authenticateJWT
};
