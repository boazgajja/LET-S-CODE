const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../utils/jwt');

// POST /submissions
router.post('/', async (req, res) => {
  const { userId, problemId, code, status } = req.body;

  if (!userId || !problemId || !code || !status) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields" 
    });
  }

  try {
    // Verify the problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ 
        success: false, 
        message: "Problem not found" 
      });
    }

    // Create the submission with problem details stored
    const submission = await Submission.create({
      submissionId: uuidv4(),
      user: userId,
      problem: problemId,
      // Store problem details in case problem gets deleted later
      problemTitle: problem.title,
      problemDifficulty: problem.difficulty,
      code,
      status
    });

    // console.log("Submission created:", submission._id);

    // Update the user's submissions array
    await User.findByIdAndUpdate(
      userId,
      { $push: { submissions: submission._id } }
    );

    // Update user stats
    const user = await User.findById(userId);
    if (user) {
      user.stats = user.stats || {};
      user.stats.totalSubmissions = (user.stats.totalSubmissions || 0) + 1;
      
      if (status === 'correct') {
        user.stats.acceptedSubmissions = (user.stats.acceptedSubmissions || 0) + 1;
        user.stats.solvedProblems = user.stats.solvedProblems || [];
        
        if (!user.stats.solvedProblems.includes(problemId)) {
          user.stats.solvedProblems.push(problemId);
          user.stats.problemsSolved = (user.stats.problemsSolved || 0) + 1;
        }
      }
      await user.save();
    }

    res.status(201).json({ 
      success: true, 
      data: submission 
    });
  } catch (err) {
    console.error("Submission save error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// GET /submissions/user/:userId - with pagination
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Verify the authenticated user is requesting their own submissions
    if (req.user.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only view your own submissions" 
      });
    }

    // Get total count for pagination
    const total = await Submission.countDocuments({ user: userId });
    
    // Get submissions with pagination
    const submissions = await Submission.find({ user: userId })
      .populate({
        path: 'problem',
        select: 'title difficulty slug',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Process submissions to handle deleted problems
    const processedSubmissions = submissions.map(submission => {
      if (!submission.problem) {
        // If problem is deleted, use stored problem details or problem ID
        return {
          ...submission,
          problem: {
            _id: submission.problem || 'deleted-problem',
            title: submission.problemTitle || `Problem ID: ${submission.problem}`,
            difficulty: submission.problemDifficulty || 'Unknown',
            isDeleted: true
          }
        };
      }
      return submission;
    });

    const totalPages = Math.ceil(total / limit);
    
    res.status(200).json({ 
      success: true, 
      data: {
        submissions: processedSubmissions,
        pagination: {
          total,
          page,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (err) {
    console.error("Get user submissions error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// GET /submissions/:submissionId - Get a specific submission
router.get('/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const submission = await Submission.findOne({ submissionId })
      .populate({
        path: 'problem',
        select: 'title difficulty slug',
        options: { strictPopulate: false }
      })
      .lean();
    
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: "Submission not found" 
      });
    }
    
    // Verify the authenticated user is requesting their own submission
    if (req.user.userId !== submission.user.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only view your own submissions" 
      });
    }

    // Handle deleted problem
    if (!submission.problem) {
      submission.problem = {
        _id: submission.problem || 'deleted-problem',
        title: submission.problemTitle || `Problem ID: ${submission.problem}`,
        difficulty: submission.problemDifficulty || 'Unknown',
        isDeleted: true
      };
    }
    
    res.status(200).json({ 
      success: true, 
      data: submission 
    });
  } catch (err) {
    console.error("Get submission error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

module.exports = router;
