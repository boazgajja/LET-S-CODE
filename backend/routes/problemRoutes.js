const express = require('express');
const router = express.Router();
const Problem = require('./../models/Problem');
const PendingProblem = require('./../models/PendingProblem');
const { authenticateToken } = require('../utils/jwt');
const {
  getAllProblems,
  getProblemBySlug,
  getProblemsByDifficulty,
  getProblemsWithPagination
} = require('../dbconnections/fetch');
const { insertProblem } = require('../dbconnections/insert');
const { updateProblem } = require('../dbconnections/update');
const { deleteProblem } = require('../dbconnections/delete');

// -----------------------------
// Fetch problems
// -----------------------------

// Get all problems (with optional pagination)
router.get('/problems', async (req, res) => {
  try {
    const { page, limit } = req.query;
    if (page || limit) {
      const result = await getProblemsWithPagination(parseInt(page) || 1, parseInt(limit) || 10);
      return res.status(200).json({ success: true, data: result.problems, pagination: result.pagination });
    }
    const problems = await getAllProblems();
    return res.status(200).json({ success: true, count: problems.length, data: problems });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching problems', error: error.message });
  }
});

// Get pending problems added by the current user
router.get('/problems/pending', async (req, res) => {
  try {
    const pendingProblems = await PendingProblem.find()
      .sort({ createdAt: 1 }) // use the same sort for both routes
      .lean();

    return res.status(200).json({
      success: true,
      count: pendingProblems.length,
      data: pendingProblems
    });
  } catch (error) {
    console.error("Error in /pending:", error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching pending problems',
      error: error.message
    });
  }
});

//get pending problem by id 

router.get('/problems/pending/:id', async (req, res) => {
  try {
    const problem = await PendingProblem.findById(req.params.id).lean();

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Pending problem not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error("Error fetching pending problem by ID:", error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching pending problem by ID',
      error: error.message
    });
  }
});


// MOVED THIS ROUTE BEFORE THE PARAMETERIZED ROUTES
router.get('/problems/user-added', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID not found in request' });
    }
    
    // Use a try-catch block specifically for the database query
    try {
      const pendingProblems = await PendingProblem.find({ addedBy: userId });
      return res.status(200).json({ success: true, count: pendingProblems.length, data: pendingProblems });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error when fetching user-added problems', 
        error: dbError.message 
      });
    }
  } catch (error) {
    console.error("Error in /problems/user-added:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching user-added problems', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get problem by slug
router.get('/problems/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const problem = await getProblemBySlug(slug);
    if (!problem)
      return res.status(404).json({ success: false, message: 'Problem not found' });
    return res.status(200).json({ success: true, data: problem });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching problem by slug', error: error.message });
  }
});

// Get problems by difficulty
router.get('/problems/difficulty/:difficulty', async (req, res) => {
  try {
    const problems = await getProblemsByDifficulty(req.params.difficulty);
    return res.status(200).json({ success: true, count: problems.length, data: problems });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching problems by difficulty', error: error.message });
  }
});

// Get problem by MongoDB _id (the truly unique identifier)
// MOVED THIS ROUTE AFTER THE SPECIFIC ROUTES
router.get('/problems/:mongoId', async (req, res) => {
  try {
    const { mongoId } = req.params;
    const problem = await Problem.findById(mongoId);
    if (!problem)
      return res.status(404).json({ success: false, message: 'Problem not found' });
    return res.status(200).json({ success: true, data: problem });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching problem by _id', error: error.message });
  }
});

// -----------------------------
// Pending Problems
// -----------------------------

// Create a new pending problem
router.post('/problems', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const pendingProblemData = {
      ...req.body,
      addedBy: userId,
      solvedBy: []
    };
    const newPendingProblem = new PendingProblem(pendingProblemData);
    await newPendingProblem.save();
    return res.status(201).json({ 
      success: true, 
      message: 'Problem submitted successfully. It will be added to the main problem list after 20+ submissions.', 
      data: newPendingProblem 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating problem', error: error.message });
  }
});

// Get pending problems added by the current user
router.get('/problems/user-added', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID not found in request' });
    }
    
    // Use a try-catch block specifically for the database query
    try {
      const pendingProblems = await PendingProblem.find({ addedBy: userId });
      return res.status(200).json({ success: true, count: pendingProblems.length, data: pendingProblems });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error when fetching user-added problems', 
        error: dbError.message 
      });
    }
  } catch (error) {
    console.error("Error in /problems/user-added:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching user-added problems', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// Mark a pending problem as solved by the current user
router.post('/problems/pending/:id/solve', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const problemId = req.params.id;
    const pendingProblem = await PendingProblem.findById(problemId);
    if (!pendingProblem)
      return res.status(404).json({ success: false, message: 'Problem not found' });
    if (pendingProblem.solvedBy.includes(userId))
      return res.status(400).json({ success: false, message: 'You have already solved this problem' });
    pendingProblem.solvedBy.push(userId);
    await pendingProblem.save();

    if (pendingProblem.solvedBy.length >= 20) {
      const newProblem = await insertProblem({
        title: pendingProblem.title,
        difficulty: pendingProblem.difficulty,
        description: pendingProblem.description,
        inputFormat: pendingProblem.inputFormat,
        outputFormat: pendingProblem.outputFormat,
        examples: pendingProblem.examples,
        constraints: pendingProblem.constraints,
        tags: pendingProblem.tags,
        testCases: pendingProblem.testCases,
        solution: pendingProblem.solution,
        solvedBy: pendingProblem.solvedBy
      }, pendingProblem.addedBy);
      await PendingProblem.findByIdAndDelete(problemId);
      return res.status(200).json({ 
        success: true, 
        message: 'Problem solved and added to main problem list!',
        data: newProblem 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Problem solved! ${20 - pendingProblem.solvedBy.length} more solves needed to add to main list.`,
      data: pendingProblem
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error marking problem as solved', error: error.message });
  }
});

// -----------------------------
// User's Problems
// -----------------------------

router.get('/my-problems', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const problems = await Problem.find({ addedBy: userId });
    return res.status(200).json({ success: true, count: problems.length, data: problems });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching user problems', error: error.message });
  }
});

// -----------------------------


// Update & Delete Problems
// -----------------------------

// Update problem (by MongoDB _id)
router.put('/problems/:mongoId', async (req, res) => {
  try {
    const { mongoId } = req.params;
    const updatedProblem = await updateProblem(mongoId, req.body);
    if (!updatedProblem)
      return res.status(404).json({ success: false, message: 'Problem not found' });
    return res.status(200).json({ success: true, message: 'Problem updated successfully', data: updatedProblem });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating problem', error: error.message });
  }
});

// Delete problem (by MongoDB _id)
router.delete('/problems/:mongoId', async (req, res) => {
  try {
    const { mongoId } = req.params;
    const deletedProblem = await deleteProblem(mongoId);
    if (!deletedProblem)
      return res.status(404).json({ success: false, message: 'Problem not found' });
    return res.status(200).json({ success: true, message: 'Problem deleted successfully', data: deletedProblem });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting problem', error: error.message });
  }
});

module.exports = router;
