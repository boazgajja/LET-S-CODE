const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const Problem = require('../models/Problem');
const { authenticateToken } = require('../utils/jwt');
const { v4: uuidv4 } = require('uuid');

// Create a new team
router.post('/teams', authenticateToken, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    const userId = req.user.userId;
    console.log("create team called");

    const team = new Team({
      name,
      description,
      owner: userId,
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      members: [{ user: userId, role: 'owner' }]
    });
    console.log(team);
    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(userId, {
      $push: { teams: { team: team._id, role: 'owner' } }
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team',
      error: error.message
    });
  }
});

// Get all teams for current user
router.get('/teams', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('teams.team');
    console.log(user);
        if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teams',
      error: error.message
    });
  }
});

// Get team by ID
router.get('/teams/:teamId', authenticateToken, async (req, res) => {
  try {
    console.log("hi");
    const { teamId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId)
      .populate('members.user', 'username profile.firstName profile.lastName profile.avatar')
      .populate('problems.problem')
      .populate('problems.addedBy', 'username');
    console.log(team);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member of the team
    const isMember = team.members.some(member => member.user._id.toString() === userId);
    if (!isMember && team.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this team'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team',
      error: error.message
    });
  }
});

// Add problem to team
router.post('/teams/:teamId/problems', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { problemId, notes } = req.body;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member of the team
    const isMember = team.members.some(member => member.user.toString() === userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add problems to this team'
      });
    }

    // Check if problem exists
    const problem = await Problem.findOne({ id: problemId });
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Check if problem is already added to the team
    const problemExists = team.problems.some(p => p.problem.toString() === problem._id.toString());
    if (problemExists) {
      return res.status(400).json({
        success: false,
        message: 'Problem already added to this team'
      });
    }

    // Add problem to team
    team.problems.push({
      problem: problem._id,
      addedBy: userId,
      notes: notes || ''
    });

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Problem added to team successfully',
      data: team
    });
  } catch (error) {
    console.error('Add problem to team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add problem to team',
      error: error.message
    });
  }
});

// Join team with invite code
router.post('/teams/join', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.userId;

    const team = await Team.findOne({ inviteCode });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    // Check if user is already a member
    const isMember = team.members.some(member => member.user.toString() === userId);
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team'
      });
    }

    // Add user to team
    team.members.push({
      user: userId,
      role: 'member'
    });

    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(userId, {
      $push: { teams: { team: team._id, role: 'member' } }
    });

    res.status(200).json({
      success: true,
      message: 'Joined team successfully',
      data: team
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join team',
      error: error.message
    });
  }
});

module.exports = router;