const express = require('express');
const router = express.Router();
const ProblemList = require('../models/problemlists'); // Updated import
const Problem = require('../models/Problem'); // Add Problem import

// Import service functions (if you still want to use them)
// const { getproblemlist } = require('../dbconnections/fetch');
// const { insertProblemToList } = require('../dbconnections/insert');
// const { updateProblemInList } = require('../dbconnections/update');
// const { deleteProblemFromList } = require('../dbconnections/delete');

// Universal async handler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Get all problems from problem list (for home page) - UPDATED
router.get('/problemlist', asyncHandler(async (req, res) => {
    try {
        console.log('Fetching problem list...');
        
        // Fetch with populated problem references
        const problems = await ProblemList.find({})
            .populate('problemRef') // Populate the problem reference
            .sort({ id: 1 }); // Sort by problem number
        
        console.log('Fetched problems:', problems.length);
        
        res.status(200).json({
            success: true,
            count: problems.length,
            data: problems
        });
    } catch (error) {
        console.error('Error fetching problem list:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching problem list',
            error: error.message
        });
    }
}));

// Get single problem from list by ID
router.get('/problemlist/:id', asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find by the problem number (id field), not MongoDB _id
        const problem = await ProblemList.findOne({ id: parseInt(id) })
            .populate('problemRef');
        
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found in list'
            });
        }
        
        res.status(200).json({
            success: true,
            data: problem
        });
    } catch (error) {
        console.error('Error fetching problem:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching problem',
            error: error.message
        });
    }
}));

// Add problem to problem list - UPDATED
router.post('/problemlist', asyncHandler(async (req, res) => {
    try {
        const { problemId } = req.body; // Expecting the main Problem's ObjectId
        
        // Verify the main problem exists
        const mainProblem = await Problem.findById(problemId);
        if (!mainProblem) {
            return res.status(404).json({
                success: false,
                message: 'Main problem not found'
            });
        }
        
        // Check if already exists in problem list
        const existingListEntry = await ProblemList.findOne({ id: mainProblem.id });
        if (existingListEntry) {
            return res.status(409).json({
                success: false,
                message: 'Problem already exists in problem list'
            });
        }
        
        // Create new problem list entry
        const newProblemListEntry = new ProblemList({
            id: mainProblem.id, // Use the problem number
            problemRef: mainProblem._id, // Reference to the main problem
            title: mainProblem.title,
            difficulty: mainProblem.difficulty,
            acceptance: req.body.acceptance || '50%', // Default or provided
            tags: mainProblem.tags,
            isMarked: false
        });
        
        const savedEntry = await newProblemListEntry.save();
        await savedEntry.populate('problemRef');
        
        res.status(201).json({
            success: true,
            message: 'Problem added to list successfully',
            data: savedEntry
        });
    } catch (error) {
        console.error('Error adding problem to list:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding problem to list',
            error: error.message
        });
    }
}));

// Update problem in problem list - UPDATED
router.put('/problemlist/:id', asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Find by problem number (id field)
        const updatedProblem = await ProblemList.findOneAndUpdate(
            { id: parseInt(id) },
            updateData,
            { new: true, runValidators: true }
        ).populate('problemRef');
        
        if (!updatedProblem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found in list'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Problem updated in list successfully',
            data: updatedProblem
        });
    } catch (error) {
        console.error('Error updating problem in list:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating problem in list',
            error: error.message
        });
    }
}));

// Delete problem from problem list - UPDATED
router.delete('/problemlist/:id', asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find and delete by problem number (id field)
        const deletedProblem = await ProblemList.findOneAndDelete({ id: parseInt(id) });
        
        if (!deletedProblem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found in list'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Problem deleted from list successfully',
            data: deletedProblem
        });
    } catch (error) {
        console.error('Error deleting problem from list:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting problem from list',
            error: error.message
        });
    }
}));

// Bulk sync problems from Problem collection to ProblemList
router.post('/problemlist/sync', asyncHandler(async (req, res) => {
    try {
        console.log('Starting bulk sync...');
        
        // Get all problems from main Problem collection
        const problems = await Problem.find({}).sort({ id: 1 });
        
        if (problems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No problems found to sync'
            });
        }
        
        let syncedCount = 0;
        let skippedCount = 0;
        
        for (const problem of problems) {
            // Check if already exists
            const exists = await ProblemList.findOne({ id: problem.id });
            
            if (!exists) {
                await ProblemList.create({
                    id: problem.id,
                    problemRef: problem._id,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    acceptance: req.body.defaultAcceptance || '50%',
                    tags: problem.tags,
                    isMarked: false
                });
                syncedCount++;
            } else {
                skippedCount++;
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Sync completed: ${syncedCount} added, ${skippedCount} skipped`,
            data: {
                totalProblems: problems.length,
                synced: syncedCount,
                skipped: skippedCount
            }
        });
    } catch (error) {
        console.error('Error syncing problems:', error);
        res.status(500).json({
            success: false,
            message: 'Error syncing problems',
            error: error.message
        });
    }
}));

module.exports = router;