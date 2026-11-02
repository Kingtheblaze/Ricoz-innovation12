const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate Access Token (short-lived)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      fullName: user.fullName,
    },
    process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_change_in_production_xyz123!',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
  );
};

/**
 * Generate Refresh Token (long-lived)
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      organizationId: user.organizationId,
    },
    process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_change_in_production_uvw456!',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * Authentication Middleware: Validates Bearer Access Token
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_change_in_production_xyz123!'
    );

    const user = await User.findById(decoded.id).populate('organizationId');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is not found or is deactivated.',
      });
    }

    req.user = user;
    req.organization = user.organizationId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      error: error.message,
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * @param  {...string} roles Allowed roles ('Admin', 'HR', 'Viewer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role [${req.user ? req.user.role : 'Unauthenticated'}] is not permitted to access this resource. Required: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  protect,
  authorize,
};
