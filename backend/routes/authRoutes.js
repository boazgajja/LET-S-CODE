const express = require('express');
const router = express.Router();
// Remove the db connection import since we're connecting in index.js
// const { connectDB, disconnectDB } = require('../dbconnections/db');
const User = require('../models/User');

const { 
    generateTokens, 
    verifyRefreshToken, 
    authenticateToken 
} = require('../utils/jwt');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        // Remove the connectDB call
        // await connectDB();
        const { username, email, password, firstName, lastName } = req.body;

        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        // // Check if user already exists
        // const existingUser = await User.findByEmailOrUsername(email);
        // if (existingUser) {
        //     return res.status(409).json({
        //         success: false,
        //         message: 'User with this email or username already exists'
        //     });
        // }

        // // Check if username is taken
        // const existingUsername = await User.findOne({ username });
        // if (existingUsername) {
        //     return res.status(409).json({
        //         success: false,
        //         message: 'Username is already taken'
        //     });
        // }

        // Create new user
        const userData = {
            username,
            email,
            password,
            profile: {
                firstName: firstName || '',
                lastName: lastName || ''
            }
        };

        const user = new User(userData);
        await user.save();

        // Generate tokens
        const tokens = generateTokens(user);

        // Save refresh token to user document
        user.refreshToken = tokens.refreshToken;
        await user.save();

        // Remove sensitive information from response
        const userResponse = user.getPublicProfile();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userResponse,
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn
                }
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(409).json({
                success: false,
                message: `${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body; // identifier can be email or username
        console.log('Login attempt with identifier:', email);
        // Remove the connectDB call since we're connecting in index.js
        // await connectDB();
        
        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email/username and password are required'
            });
        }

        // Find user by email or username and include password
        const user = await User.findByEmailOrUsername(email).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate tokens
        const tokens = generateTokens(user);

        // Save refresh token and update last login
        user.refreshToken = tokens.refreshToken;
        user.lastLogin = new Date();
        await user.save();
        // console.log('User logged in:', user);
        // Remove sensitive information from response
        const userResponse = user.getPublicProfile();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        console.log("refresh token called");
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        // Find user and check if refresh token matches
        const user = await User.findById(decoded.userId).select('+refreshToken');
        
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Check if user is still active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Update refresh token in database
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn
                }
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(403).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Clear refresh token from database
        const user = await User.findById(req.user.userId);
        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during logout'
        });
    }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticateToken, async (req, res) => {
    try {
        // Clear refresh token from database (this invalidates all sessions)
        const user = await User.findById(req.user.userId);
        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: 'Logged out from all devices successfully'
        });

    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during logout'
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userResponse = user.getPublicProfile();

        res.status(200).json({
            success: true,
            data: {
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Get user with password
        const user = await User.findById(req.user.userId).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        user.refreshToken = null; // Logout from all devices
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during password change'
        });
    }
});

module.exports = router;