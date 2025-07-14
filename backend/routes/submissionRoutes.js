const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../utils/jwt');

// POST /submissions
router.post('/', async (req, res) => {
  const { userId, problemId, code, status } = req.body;

  if (!userId || !problemId || !code || !status) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    // Create the submission
    const submission = await Submission.create({
      submissionId: uuidv4(),
      user: userId,
      problem: problemId,
      code,
      status
    });
    console.log("hi this is before add submission to the user");
    // Update the user's submissions array
    await User.findByIdAndUpdate(
      userId,
      { $push: { submissions: submission._id } }
    );
    console.log("hi this is after push");
    // Update user stats
    const user = await User.findById(userId);
    console.log(user);
    user.stats.totalSubmissions += 1;
    if (status === 'correct') {
      user.stats.acceptedSubmissions += 1;
      user.stats.problemsSolved += 1; // This might need more logic if you want to count unique problems
    }
    await user.save();

    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    console.error("Submission save error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /submissions/user/:userId
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify the authenticated user is requesting their own submissions
    if (req.user.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only view your own submissions" 
      });
    }

    const submissions = await Submission.find({ user: userId })
      .populate('problem', 'title difficulty slug')
      .sort({ createdAt: -1 })
      .lean();
    console.log("h9i");
    console.log(submissions);
    res.status(200).json({ success: true, data: submissions });
  } catch (err) {
    console.error("Get user submissions error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
