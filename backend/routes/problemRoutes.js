const express = require('express');
const router = express.Router();

// Import service functions
const {
    getAllProblems,
    getProblemById,
    getProblemBySlug,
    getProblemsByDifficulty,
    getProblemsWithPagination
} = require('../dbconnections/fetch');

const { insertProblem } = require('../dbconnections/insert');
const { updateProblem } = require('../dbconnections/update');
const { deleteProblem } = require('../dbconnections/delete');

// Get all problems with optional pagination
router.get('/problems', async (req, res) => {
    try {
        const { page, limit } = req.query;
        
        let result;
        if (page || limit) {
            // Use pagination if page or limit is provided
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            result = await getProblemsWithPagination(pageNum, limitNum);
            
            res.status(200).json({
                success: true,
                data: result.problems,
                pagination: result.pagination
            });
        } else {
            // Get all problems without pagination
            const problems = await getAllProblems();
            res.status(200).json({
                success: true,
                count: problems.length,
                data: problems
            });
        }
    } catch (error) {
        console.error('Error fetching problems:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching problems',
            error: error.message
        });
    }
});

// Get problem by ID (when user clicks on a question)
router.get('/problems/pid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log("hi this is getProblemById before calling service");
        const problem = await getProblemById(id);
        
        console.log("hi this is getProblemById after calling service");
        console.log(problem);
        console.log('Problem fetched by ID:', problem);
        
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: problem
        });
    } catch (error) {
        console.error('Error fetching problem by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching problem by ID',
            error: error.message
        });
    }
});

// Get problem by slug
router.get('/problems/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const problem = await getProblemBySlug(slug);
        
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: problem
        });
    } catch (error) {
        console.error('Error fetching problem by slug:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching problem by slug',
            error: error.message
        });
    }
});

// Get problems by difficulty
router.get('/problems/difficulty/:difficulty', async (req, res) => {
    try {
        const { difficulty } = req.params;
        const problems = await getProblemsByDifficulty(difficulty);
        
        res.status(200).json({
            success: true,
            count: problems.length,
            data: problems
        });
    } catch (error) {
        console.error('Error fetching problems by difficulty:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching problems by difficulty',
            error: error.message
        });
    }
});

// Create new problem
router.post('/problems', async (req, res) => {
    try {
        const newProblem = await insertProblem(req.body);
        res.status(201).json({
            success: true,
            message: 'Problem created successfully',
            data: newProblem
        });
    } catch (error) {
        console.error('Error creating problem:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating problem',
            error: error.message
        });
    }
});

// Update problem by ID
router.put('/problems/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProblem = await updateProblem(id, req.body);
        
        if (!updatedProblem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Problem updated successfully',
            data: updatedProblem
        });
    } catch (error) {
        console.error('Error updating problem:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating problem',
            error: error.message
        });
    }
});

// Delete problem by ID
router.delete('/problems/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProblem = await deleteProblem(id);
        
        if (!deletedProblem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Problem deleted successfully',
            data: deletedProblem
        });
    } catch (error) {
        console.error('Error deleting problem:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting problem',
            error: error.message
        });
    }
});

module.exports = router;