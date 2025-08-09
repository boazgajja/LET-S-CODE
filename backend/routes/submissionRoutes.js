const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');
const PendingProblem = require('../models/PendingProblem'); // Add this line!
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../utils/jwt');

// POST /submissions
router.post('/', authenticateToken, async (req, res) => {
  const { userId, code, status, title, difficulty, problemId, pendingProblemId } = req.body;

  // At least one of problemId or pendingProblemId must be set
  if (!userId || (!problemId && !pendingProblemId) || !code || !status || !title || !difficulty) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Only one should be set
  if (problemId && pendingProblemId) {
    return res.status(400).json({ success: false, message: "Specify either problemId or pendingProblemId, not both" });
  }

  try {
    // Optional: verify the corresponding problem exists
    if (problemId) {
      const problem = await Problem.findById(problemId);
      if (!problem) {
        return res.status(404).json({ success: false, message: "Problem not found" });
      }
      // Ensure you have the latest problem title/difficulty if needed
    } else {
      const pendingProblem = await PendingProblem.findById(pendingProblemId);
      if (!pendingProblem) {
        return res.status(404).json({ success: false, message: "Pending problem not found" });
      }
    }

    // Create submission
    const submission = await Submission.create({
      submissionId: uuidv4(),
      user: userId,
      problem: problemId || null,
      pendingProblem: pendingProblemId || null,
      problemTitle: title,
      problemDifficulty: difficulty,
      code,
      status,
    });

    // Update user's submissions array
    await User.findByIdAndUpdate(userId, { $push: { submissions: submission._id } });

    // Update user stats (only for regular problems, if needed; adjust as per your logic)
    if (problemId && status === 'correct') {
      await User.updateOne(
        { _id: userId },
        {
          $inc: { 'stats.totalSubmissions': 1, 'stats.acceptedSubmissions': 1 },
          $addToSet: { 'stats.solvedProblems': problemId }
        }
      );
    }

    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    console.error("Submission save error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /submissions/user/:userId - with pagination
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: "You can only view your own submissions" });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Count total submissions for pagination
    const total = await Submission.countDocuments({ user: userId });

    // Fetch paginated submissions and populate BOTH problem and pendingProblem if they exist
    const submissions = await Submission.find({ user: userId })
      .populate('problem', 'title difficulty slug')
      .populate('pendingProblem', 'title difficulty slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Determine the REAL problem for each submission, prioritizing the populated one
    const processedSubmissions = submissions.map(sub => {
      const actualProblem = sub.problem || sub.pendingProblem; // The actual populated doc (if exists)
      const storedTitle = sub.problemTitle || (actualProblem ? actualProblem.title : undefined);
      const storedDiff = sub.problemDifficulty || (actualProblem ? actualProblem.difficulty : undefined);

      return {
        ...sub,
        // These fields are always available, even if problem is deleted
        problemTitle: storedTitle || 'Unknown Problem',
        problemDifficulty: storedDiff || 'Unknown',

        // These IDs are always available from the populated doc or direct field
        problemId: sub.problem?._id || sub.pendingProblem?._id || null,

        // Never return problem: null—instead, put the populated doc here
        problem: sub.problem || sub.pendingProblem || null,

        // Flag for UI logic
        isPending: !!sub.pendingProblem,

        // For backward compatibility, keep populatedProblem
        populatedProblem: sub.problem || sub.pendingProblem || null,
      };
    });

    const totalPages = Math.ceil(total / limit);

    // Send response: always include pagination, never undefined
    res.status(200).json({
      success: true,
      data: {
        submissions: processedSubmissions,
        pagination: {
          total,
          page,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });

  } catch (err) {
    console.error("Get user submissions error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /submissions/:submissionId
router.get('/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findOne({ submissionId })
      .populate('problem', 'title difficulty slug')
      .populate('pendingProblem', 'title difficulty slug')
      .lean();

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    if (req.user.userId !== submission.user.toString()) {
      return res.status(403).json({ success: false, message: "You can only view your own submissions" });
    }

    const problem = submission.problem || submission.pendingProblem;
    res.status(200).json({
      success: true,
      data: {
        ...submission,
        problemTitle: submission.problemTitle,
        problemDifficulty: submission.problemDifficulty,
        populatedProblem: problem,
        isPending: !!submission.pendingProblem,
        problemId: submission.problem?._id || submission.pendingProblem?._id || null,
      }
    });
  } catch (err) {
    console.error("Get submission error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
