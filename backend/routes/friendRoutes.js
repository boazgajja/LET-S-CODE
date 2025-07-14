const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../utils/jwt');
const { v4: uuidv4 } = require('uuid');

// Generate friend code for user
router.post('/friends/code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate a new friend code if one doesn't exist
    if (!user.friendCode) {
      user.friendCode = uuidv4().substring(0, 8);
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        friendCode: user.friendCode
      }
    });
  } catch (error) {
    console.error('Generate friend code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate friend code',
      error: error.message
    });
  }
});

// Add friend by code
router.post('/friends/add', authenticateToken, async (req, res) => {
  try {
    const { friendCode } = req.body;
    const userId = req.user.userId;

    if (!friendCode) {
      return res.status(400).json({
        success: false,
        message: 'Friend code is required'
      });
    }

    // Find user by friend code
    const friend = await User.findOne({ friendCode });
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'Invalid friend code'
      });
    }

    // Check if trying to add self
    if (friend._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add yourself as a friend'
      });
    }

    // Check if already friends
    const user = await User.findById(userId);
    const alreadyFriends = user.friends.some(f => 
      f.user.toString() === friend._id.toString() && f.status === 'accepted'
    );

    if (alreadyFriends) {
      return res.status(400).json({
        success: false,
        message: 'You are already friends with this user'
      });
    }

    // Check if friend request already sent
    const pendingRequest = user.friends.some(f => 
      f.user.toString() === friend._id.toString() && f.status === 'pending'
    );

    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }

    // Add friend to user's friends list with pending status
    user.friends.push({
      user: friend._id,
      status: 'pending'
    });

    await user.save();

    // Add user to friend's friends list with pending status
    friend.friends.push({
      user: userId,
      status: 'pending'
    });

    await friend.save();

    res.status(200).json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add friend',
      error: error.message
    });
  }
});

// Accept friend request
router.put('/friends/:friendId/accept', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    // Update status in user's friends list
    const user = await User.findById(userId);
    const friendRequest = user.friends.find(f => f.user.toString() === friendId && f.status === 'pending');

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    friendRequest.status = 'accepted';
    await user.save();

    // Update status in friend's friends list
    const friend = await User.findById(friendId);
    const userRequest = friend.friends.find(f => f.user.toString() === userId);
    if (userRequest) {
      userRequest.status = 'accepted';
      await friend.save();
    }

    res.status(200).json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept friend request',
      error: error.message
    });
  }
});

// Get all friends
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId)
      .populate('friends.user', 'username profile.firstName profile.lastName profile.avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.friends
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friends',
      error: error.message
    });
  }
});

module.exports = router;