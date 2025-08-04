const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ProblemList = require('../models/problemlists'); // Add this import
const { authenticateToken, optionalAuth } = require('../utils/jwt');
const mongoose = require('mongoose');

// Universal async handler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------- ROUTES ----------------------------

// Get current user's profile (private)
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { user: user.getPublicProfile() } });
}));

// Update current user's profile (private)
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
    const {
        profile: {
            firstName, lastName, bio, dateOfBirth, country, city, website, github, linkedin
        } = {},
        preferences: {
            theme, language, emailNotifications
        } = {}
    } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.profile) user.profile = {};
    if (!user.preferences) user.preferences = {};

    // Update only fields provided
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (bio !== undefined) user.profile.bio = bio;
    if (dateOfBirth !== undefined) user.profile.dateOfBirth = dateOfBirth;
    if (country !== undefined) user.profile.country = country;
    if (city !== undefined) user.profile.city = city;
    if (website !== undefined) user.profile.website = website;
    if (github !== undefined) user.profile.github = github;
    if (linkedin !== undefined) user.profile.linkedin = linkedin;
    if (theme !== undefined) user.preferences.theme = theme;
    if (language !== undefined) user.preferences.language = language;
    if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;

    try {
        await user.save();
        res.json({ success: true, message: 'Profile updated successfully', data: { user: user.getPublicProfile() } });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }
        throw error;
    }
}));

// Get user profile by username (public)
router.get('/profile/:username', optionalAuth, asyncHandler(async (req, res) => {
    const { username } = req.params;
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    const publicProfile = {
        username: user.username,
        profile: user.profile,
        stats: user.stats,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
    };
    res.json({ success: true, data: { user: publicProfile } });
}));

// Update user avatar (private)
router.put('/avatar', authenticateToken, asyncHandler(async (req, res) => {
    const { avatar } = req.body;
    if (!avatar) {
        return res.status(400).json({ success: false, message: 'Avatar URL is required' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!user.profile) user.profile = {};
    user.profile.avatar = avatar;
    await user.save();
    res.json({ success: true, message: 'Avatar updated', data: { avatar: user.profile.avatar } });
}));

// Get current user's working problems (private)
router.get('/working-problems', authenticateToken, asyncHandler(async (req, res) => {
    console.log("Fetching working problems for user:", req.user.userId);
    
    try {
        const user = await User.findById(req.user.userId).populate('workingProblems');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        console.log("Working problems found:", user.workingProblems);
        res.json({ 
            success: true, 
            data: user.workingProblems || [] 
        });
    } catch (error) {
        console.error("Error fetching working problems:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching working problems',
            error: error.message 
        });
    }
}));

// Add to working problems (private)
router.post('/working-problems', authenticateToken, asyncHandler(async (req, res) => {
    const { problemId } = req.body;

    if (!problemId) {
        return res.status(400).json({ success: false, message: 'Problem ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
        return res.status(400).json({ success: false, message: 'Invalid Problem ID' });
    }

    try {
        // Verify that the problem exists in ProblemList
        const problemExists = await ProblemList.findById(problemId);
        if (!problemExists) {
            return res.status(404).json({ success: false, message: 'Problem not found' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Initialize workingProblems array if it doesn't exist
        if (!user.workingProblems) {
            user.workingProblems = [];
        }

        // Check if problem is already in working problems
        const problemAlreadyExists = user.workingProblems.some(
            p => p.toString() === problemId.toString()
        );

        if (!problemAlreadyExists) {
            user.workingProblems.push(problemId);
            await user.save();
            console.log("Working problem added successfully for user:", req.user.userId);
        }

        // Populate the working problems before sending response
        await user.populate('workingProblems');
        
        res.json({ 
            success: true, 
            message: problemAlreadyExists ? 'Problem already in working list' : 'Problem added to working list', 
            data: user.workingProblems 
        });
    } catch (error) {
        console.error("Error adding working problem:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error adding problem to working list',
            error: error.message 
        });
    }
}));

// Remove from working problems (private)
router.delete('/working-problems/:problemId', authenticateToken, asyncHandler(async (req, res) => {
    const { problemId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
        return res.status(400).json({ success: false, message: 'Invalid Problem ID' });
    }

    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.workingProblems) {
            user.workingProblems = [];
        }

        const initialLength = user.workingProblems.length;
        user.workingProblems = user.workingProblems.filter(
            prob => prob.toString() !== problemId.toString()
        );

        const wasRemoved = user.workingProblems.length < initialLength;
        
        if (wasRemoved) {
            await user.save();
            console.log("Working problem removed successfully for user:", req.user.userId);
        }

        // Populate the working problems before sending response
        await user.populate('workingProblems');

        res.json({ 
            success: true, 
            message: wasRemoved ? 'Problem removed from working list' : 'Problem was not in working list', 
            data: user.workingProblems 
        });
    } catch (error) {
        console.error("Error removing working problem:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error removing problem from working list',
            error: error.message 
        });
    }
}));

module.exports = router;