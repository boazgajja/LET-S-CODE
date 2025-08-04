const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const Problem = require('../models/Problem');
const { authenticateToken } = require('../utils/jwt');
const { v4: uuidv4 } = require('uuid');

// Helper function to update team
const updateTeam = async (teamId, updateData) => {
  const allowedUpdates = ['name', 'description', 'isPrivate'];
  const filteredUpdates = {};
  
  Object.keys(updateData).forEach(key => {
    if (allowedUpdates.includes(key)) {
      filteredUpdates[key] = updateData[key];
    }
  });

  const updatedTeam = await Team.findByIdAndUpdate(
    teamId,
    filteredUpdates,
    { new: true, runValidators: true }
  ).populate('members.user', 'username profile.firstName profile.lastName profile.avatar')
   .populate('owner', 'username profile.firstName profile.lastName profile.avatar')
   .populate('problems.problem')
   .populate('problems.addedBy', 'username');

  return updatedTeam;
};

// Helper function to delete team
const deleteTeam = async (teamId) => {
  // Find the team
  const team = await Team.findById(teamId);
  if (!team) {
    throw new Error('Team not found');
  }

  // Remove this team from each user's `teams` array
  const memberIds = team.members.map(m => m.user);

  await User.updateMany(
    { _id: { $in: memberIds } },
    { $pull: { teams: { team: team._id } } }
  );

  // Finally, delete the team
  const deletedTeam = await Team.findByIdAndDelete(teamId);
  return deletedTeam;
};

// Create a new team
router.post('/teams', authenticateToken, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    const userId = req.user.userId;
    // console.log("create team called");

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Team name must be less than 100 characters'
      });
    }

    const team = new Team({
      name: name.trim(),
      description: description?.trim() || '',
      owner: userId,
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      members: [{ user: userId, role: 'owner', joinedAt: Date.now() }],
      inviteCode: uuidv4().substring(0, 8).toUpperCase()
    });
    
    // console.log(team);
    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(userId, {
      $push: { teams: { team: team._id, role: 'owner' } }
    });

    // Populate the team before sending
    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'username profile.firstName profile.lastName profile.avatar')
      .populate('owner', 'username profile.firstName profile.lastName profile.avatar')
      .populate('problems.problem')
      .populate('problems.addedBy', 'username');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: populatedTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A team with this name already exists'
      });
    }
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
    const { page = 1, limit = 10 } = req.query;
    
    const user = await User.findById(userId).populate({
      path: 'teams.team',
      populate: {
        path: 'members.user owner',
        select: 'username profile.firstName profile.lastName profile.avatar'
      }
    });
    
    // console.log(user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Apply pagination if needed
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTeams = user.teams.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedTeams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(user.teams.length / limit),
        totalTeams: user.teams.length,
        hasNext: endIndex < user.teams.length,
        hasPrev: startIndex > 0
      }
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
    // console.log("Get team by ID called");
    const { teamId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId)
      .populate('members.user', 'username profile.firstName profile.lastName profile.avatar isOnline')
      .populate('owner', 'username profile.firstName profile.lastName profile.avatar')
      .populate('problems.problem')
      .populate('problems.addedBy', 'username');
    
    // console.log(team);
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

// Update team by ID
router.put('/teams/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team owner or admin
    const userMember = team.members.find(member => member.user.toString() === userId);
    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this team'
      });
    }

    // Validation
    if (updateData.name && updateData.name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Team name cannot be empty'
      });
    }

    if (updateData.name && updateData.name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Team name must be less than 100 characters'
      });
    }

    // Update team
    const updatedTeam = await updateTeam(teamId, updateData);

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A team with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update team',
      error: error.message
    });
  }
});

// Delete team by ID
router.delete('/teams/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team owner
    const isOwner = team.members.some(member => 
      member.user.toString() === userId && member.role === 'owner'
    );
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner can delete the team'
      });
    }

    // Delete team
    const deletedTeam = await deleteTeam(teamId);

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
      data: deletedTeam
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team',
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

    // Validation
    if (!problemId || problemId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Problem ID is required'
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member of the team with proper permissions
    const userMember = team.members.find(member => member.user.toString() === userId);
    if (!userMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    // Only owner, admin, or members can add problems (you can restrict this further if needed)
    if (!['owner', 'admin', 'member'].includes(userMember.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add problems to this team'
      });
    }

    // Check if problem exists
    const problem = await Problem.findOne({ id: problemId.trim() });
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
      notes: notes?.trim() || '',
      addedAt: Date.now()
    });

    await team.save();

    // Populate the updated team data
    const updatedTeam = await Team.findById(teamId)
      .populate('members.user', 'username profile.firstName profile.lastName profile.avatar')
      .populate('problems.problem')
      .populate('problems.addedBy', 'username');

    res.status(200).json({
      success: true,
      message: 'Problem added to team successfully',
      data: updatedTeam
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

// Remove problem from team
router.delete('/teams/:teamId/problems/:problemId', authenticateToken, async (req, res) => {
  try {
    const { teamId, problemId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is owner, admin, or the one who added the problem
    const userMember = team.members.find(member => member.user.toString() === userId);
    if (!userMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    const problemIndex = team.problems.findIndex(p => p._id.toString() === problemId);
    if (problemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found in this team'
      });
    }

    const problemToRemove = team.problems[problemIndex];
    
    // Check permissions: owner, admin, or the person who added the problem
    const canRemove = userMember.role === 'owner' || 
                     userMember.role === 'admin' || 
                     problemToRemove.addedBy.toString() === userId;

    if (!canRemove) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove this problem'
      });
    }

    // Remove problem from team
    team.problems.splice(problemIndex, 1);
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Problem removed from team successfully'
    });
  } catch (error) {
    console.error('Remove problem from team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove problem from team',
      error: error.message
    });
  }
});

// Join team with invite code
router.post('/teams/join', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.userId;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    const team = await Team.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
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

    // Check if user already has a pending join request
    const hasPendingRequest = team.joinRequests.some(request => request.user.toString() === userId);
    if (hasPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending join request for this team'
      });
    }

    // If team is public, add user directly
    if (!team.isPrivate) {
      // Add user to team
      team.members.push({
        user: userId,
        role: 'member',
        joinedAt: Date.now()
      });

      await team.save();

      // Add team to user's teams
      await User.findByIdAndUpdate(userId, {
        $push: { teams: { team: team._id, role: 'member' } }
      });

      return res.status(200).json({
        success: true,
        message: 'Joined team successfully',
        data: team
      });
    } else {
      // For private teams, create a join request
      team.joinRequests.push({
        user: userId,
        requestedAt: Date.now()
      });

      await team.save();

      return res.status(200).json({
        success: true,
        message: 'Join request sent to team owner',
        data: { requestPending: true }
      });
    }
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join team',
      error: error.message
    });
  }
});

// Leave team
router.post('/teams/:teamId/leave', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member
    const memberIndex = team.members.findIndex(member => member.user.toString() === userId);
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    const userMember = team.members[memberIndex];

    // Owner cannot leave the team (must transfer ownership or delete team)
    if (userMember.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Team owner cannot leave the team. Transfer ownership or delete the team instead.'
      });
    }

    // Remove user from team
    team.members.splice(memberIndex, 1);
    await team.save();

    // Remove team from user's teams
    await User.findByIdAndUpdate(userId, {
      $pull: { teams: { team: teamId } }
    });

    res.status(200).json({
      success: true,
      message: 'Left team successfully'
    });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave team',
      error: error.message
    });
  }
});

// Get pending join requests for a team
router.get('/teams/:teamId/requests', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId)
      .populate('joinRequests.user', 'username profile.firstName profile.lastName profile.avatar');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team owner or admin
    const userMember = team.members.find(member => member.user.toString() === userId);
    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view join requests'
      });
    }

    res.status(200).json({
      success: true,
      data: team.joinRequests
    });
  } catch (error) {
    console.error('Get join requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get join requests',
      error: error.message
    });
  }
});

// Accept a join request
router.put('/teams/:teamId/requests/:userId/accept', authenticateToken, async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const requestingUserId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team owner or admin
    const userMember = team.members.find(member => member.user.toString() === requestingUserId);
    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to accept join requests'
      });
    }

    // Find the join request
    const requestIndex = team.joinRequests.findIndex(request => request.user.toString() === userId);
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    // Remove the request from joinRequests
    const request = team.joinRequests.splice(requestIndex, 1)[0];

    // Add user to team members
    team.members.push({
      user: userId,
      role: 'member',
      joinedAt: Date.now()
    });

    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(userId, {
      $push: { teams: { team: team._id, role: 'member' } }
    });

    res.status(200).json({
      success: true,
      message: 'Join request accepted',
      data: team
    });
  } catch (error) {
    console.error('Accept join request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept join request',
      error: error.message
    });
  }
});

// Reject a join request
router.put('/teams/:teamId/requests/:userId/reject', authenticateToken, async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const requestingUserId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team owner or admin
    const userMember = team.members.find(member => member.user.toString() === requestingUserId);
    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reject join requests'
      });
    }

    // Find and remove the join request
    const requestIndex = team.joinRequests.findIndex(request => request.user.toString() === userId);
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    team.joinRequests.splice(requestIndex, 1);
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Join request rejected'
    });
  } catch (error) {
    console.error('Reject join request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject join request',
      error: error.message
    });
  }
});

// Update member role (owner and admin only)
router.put('/teams/:teamId/members/:memberId/role', authenticateToken, async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.userId;

    // Validate role
    const validRoles = ['member', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Valid roles are: member, admin'
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if requesting user is owner
    const requestingUser = team.members.find(member => member.user.toString() === userId);
    if (!requestingUser || requestingUser.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only team owner can change member roles'
      });
    }

    // Find the member to update
    const memberToUpdate = team.members.find(member => member._id.toString() === memberId);
    if (!memberToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this team'
      });
    }

    // Cannot change owner role
    if (memberToUpdate.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change owner role'
      });
    }

    // Update role
    memberToUpdate.role = role;
    await team.save();

    // Update user's teams array
    await User.updateOne(
      { _id: memberToUpdate.user, 'teams.team': teamId },
      { $set: { 'teams.$.role': role } }
    );

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role',
      error: error.message
    });
  }
});

// Remove member from team (owner and admin only)
router.delete('/teams/:teamId/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if requesting user is owner or admin
    const requestingUser = team.members.find(member => member.user.toString() === userId);
    if (!requestingUser || !['owner', 'admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members'
      });
    }

    // Find the member to remove
    const memberIndex = team.members.findIndex(member => member._id.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this team'
      });
    }

    const memberToRemove = team.members[memberIndex];

    // Cannot remove owner
    if (memberToRemove.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team owner'
      });
    }

    // Admin can only remove regular members, not other admins (unless requesting user is owner)
    if (memberToRemove.role === 'admin' && requestingUser.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only team owner can remove admin members'
      });
    }

    const removedUserId = memberToRemove.user;

    // Remove member from team
    team.members.splice(memberIndex, 1);
    await team.save();

    // Remove team from user's teams
    await User.findByIdAndUpdate(removedUserId, {
      $pull: { teams: { team: teamId } }
    });

    res.status(200).json({
      success: true,
      message: 'Member removed from team successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
      error: error.message
    });
  }
});

// Get team chat messages
router.get('/teams/:teamId/messages', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 50 } = req.query;

    const team = await Team.findById(teamId)
      .populate({
        path: 'messages.sender',
        select: 'username profile.firstName profile.lastName profile.avatar isOnline'
      });

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
        message: 'You do not have permission to view team messages'
      });
    }

    // Apply pagination to messages
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedMessages = team.messages
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedMessages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(team.messages.length / limit),
        totalMessages: team.messages.length,
        hasNext: endIndex < team.messages.length,
        hasPrev: startIndex > 0
      }
    });
  } catch (error) {
    console.error('Get team messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team messages',
      error: error.message
    });
  }
});

// Send message to team chat
router.post('/teams/:teamId/messages', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Validate message content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message content must be less than 1000 characters'
      });
    }

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
        message: 'You do not have permission to send messages to this team'
      });
    }

    // Add message to team
    const newMessage = {
      sender: userId,
      content: content.trim(),
      timestamp: Date.now()
    };
    
    team.messages.push(newMessage);
    
    // Keep only last 1000 messages to prevent database bloat
    if (team.messages.length > 1000) {
      team.messages = team.messages.slice(-1000);
    }
    
    await team.save();

    // The socket.io server will handle real-time delivery

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send team message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Delete message from team chat
router.delete('/teams/:teamId/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { teamId, messageId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member of the team
    const userMember = team.members.find(member => member.user.toString() === userId);
    if (!userMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    // Find the message
    const messageIndex = team.messages.findIndex(msg => msg._id.toString() === messageId);
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const message = team.messages[messageIndex];

    // Check if user can delete the message (owner, admin, or message sender)
    const canDelete = userMember.role === 'owner' || 
                     userMember.role === 'admin' || 
                     message.sender.toString() === userId;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this message'
      });
    }

    // Remove message
    team.messages.splice(messageIndex, 1);
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
});

// Search teams (public teams only)
router.get('/teams/search', authenticateToken, async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const teams = await Team.find({
      isPrivate: false,
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    })
    .populate('owner', 'username profile.firstName profile.lastName')
    .populate('members.user', 'username')
    .select('name description owner members createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

    const totalTeams = await Team.countDocuments({
      isPrivate: false,
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    });

    res.status(200).json({
      success: true,
      data: teams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTeams / limit),
        totalTeams,
        hasNext: page * limit < totalTeams,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search teams',
      error: error.message
    });
  }
});

// Generate new invite code
router.post('/teams/:teamId/invite-code/regenerate', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is owner or admin
    const userMember = team.members.find(member => member.user.toString() === userId);
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to regenerate invite code'
      });
    }

    // Generate new invite code
    team.inviteCode = uuidv4().substring(0, 8).toUpperCase();
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Invite code regenerated successfully',
      data: { inviteCode: team.inviteCode }
    });
  } catch (error) {
    console.error('Regenerate invite code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate invite code',
      error: error.message
    });
  }
});

module.exports = router;