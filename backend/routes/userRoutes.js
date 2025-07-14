const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../utils/jwt');

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userProfile = user.getPublicProfile();

        res.status(200).json({
            success: true,
            data: {
                user: userProfile
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const {
            profile: {
                firstName,
                lastName,
                bio,
                dateOfBirth,
                country,
                city,
                website,
                github,
                linkedin
            } = {},
            preferences: {
                theme,
                language,
                emailNotifications
            } = {}
        } = req.body;

        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update profile fields
        if (firstName !== undefined) user.profile.firstName = firstName;
        if (lastName !== undefined) user.profile.lastName = lastName;
        if (bio !== undefined) user.profile.bio = bio;
        if (dateOfBirth !== undefined) user.profile.dateOfBirth = dateOfBirth;
        if (country !== undefined) user.profile.country = country;
        if (city !== undefined) user.profile.city = city;
        if (website !== undefined) user.profile.website = website;
        if (github !== undefined) user.profile.github = github;
        if (linkedin !== undefined) user.profile.linkedin = linkedin;

        // Update preferences
        if (theme !== undefined) user.preferences.theme = theme;
        if (language !== undefined) user.preferences.language = language;
        if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;

        await user.save();

        const updatedProfile = user.getPublicProfile();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedProfile
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during profile update'
        });
    }
});

/**
 * @route   GET /api/users/profile/:username
 * @desc    Get user profile by username (public)
 * @access  Public
 */
router.get('/profile/:username', optionalAuth, async (req, res) => {
    try {
        const { username } = req.params;
        
        const user = await User.findOne({ 
            username: username,
            isActive: true 
        });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get public profile (remove sensitive information)
        const publicProfile = {
            username: user.username,
            profile: {
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
                bio: user.profile.bio,
                avatar: user.profile.avatar,
                country: user.profile.country,
                city: user.profile.city,
                website: user.profile.website,
                github: user.profile.github,
                linkedin: user.profile.linkedin
            },
            stats: user.stats,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        };

        res.status(200).json({
            success: true,
            data: {
                user: publicProfile
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/users/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.put('/avatar', authenticateToken, async (req, res) => {
    try {
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({
                success: false,
                message: 'Avatar URL is required'
            });
        }

        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.profile.avatar = avatar;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Avatar updated successfully',
            data: {
                avatar: user.profile.avatar
            }
        });

    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during avatar update'
        });
    }
});

