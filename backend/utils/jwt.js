const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'boaz@0099';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h'; // Access token expires in 15 minutes
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d'; // Refresh token expires in 7 days

/**
 * Generate JWT access token
 * @param {Object} payload - User data to include in token
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRE,
        issuer: 'problem-management-api',
        audience: 'problem-management-client'
    });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - User data to include in token
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRE,
        issuer: 'problem-management-api',
        audience: 'problem-management-client'
    });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing access and refresh tokens
 */
const generateTokens = (user) => {
    const payload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user._id });

    return {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRE
    };
};

/**
 * Verify JWT access token - Updated to return null instead of throwing
 * @param {String} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        // console.log('Token verification failed:', error.message);
        return null; // Return null instead of throwing
    }
};

/**
 * Verify JWT refresh token
 * @param {String} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

/**
 * Middleware to authenticate JWT token - Updated with proper error handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
    try {
        // console.log('🔐 Authenticating token...', req.headers);
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // console.log('🔐 Auth Header:', authHeader);
        // console.log('🔐 Extracted Token:', token);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required',
                code: 'NO_TOKEN'
            });
        }

        // Use the updated verifyAccessToken that returns null on error
        const decoded = verifyAccessToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired access token',
                code: 'TOKEN_EXPIRED'
            });
        }

        console.log('✅ Decoded Token:', decoded);

        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            console.log('❌ User not found or inactive');
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive',
                code: 'USER_INACTIVE'
            });
        }

        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            userDoc: user
        };

        next();
    } catch (error) {
        console.error('❌ Authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Enhanced authentication middleware with detailed JWT error handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateTokenDetailed = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required',
                code: 'NO_TOKEN'
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const user = await User.findById(decoded.userId);
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive',
                    code: 'USER_INACTIVE'
                });
            }

            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role,
                userDoc: user
            };

            next();
        } catch (jwtError) {
            // Handle different JWT errors specifically
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Access token has expired',
                    code: 'TOKEN_EXPIRED',
                    expiredAt: jwtError.expiredAt
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid access token',
                    code: 'INVALID_TOKEN'
                });
            } else if (jwtError.name === 'NotBeforeError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token not active yet',
                    code: 'TOKEN_NOT_ACTIVE'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Token verification failed',
                    code: 'TOKEN_ERROR'
                });
            }
        }
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            code: 'SERVER_ERROR'
        });
    }
};

/**
 * Middleware to authorize user roles
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return next(); // No token, but continue
        }

        const decoded = verifyAccessToken(token);
        
        if (decoded) {
            const user = await User.findById(decoded.userId);
            if (user && user.isActive) {
                req.user = {
                    userId: decoded.userId,
                    username: decoded.username,
                    email: decoded.email,
                    role: decoded.role,
                    userDoc: user
                };
            }
        }

        next();
    } catch (error) {
        // Token is invalid, but continue without user
        next();
    }
};

/**
 * Extract user ID from token without full authentication
 * @param {String} token - JWT token
 * @returns {String} User ID
 */
const getUserIdFromToken = (token) => {
    try {
        const decoded = verifyAccessToken(token);
        return decoded ? decoded.userId : null;
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    authenticateToken,
    authenticateTokenDetailed,
    authorizeRoles,
    optionalAuth,
    getUserIdFromToken,
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    JWT_EXPIRE,
    JWT_REFRESH_EXPIRE
};