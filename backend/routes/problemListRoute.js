const express = require('express');
const router = express.Router();

// Import service functions
const { getproblemlist } = require('../dbconnections/fetch');
const { insertProblemToList } = require('../dbconnections/insert');
const { updateProblemInList } = require('../dbconnections/update');
const { deleteProblemFromList } = require('../dbconnections/delete');

// Get all problems from problem list (for home page)
router.get('/problemlist', async (req, res) => {
    try {
        // console.log('Fetching problem list...be');
        const problems = await getproblemlist();
        console.log('Fetched problems:', problems.length);
        // console.log(problems);
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
});

// Add problem to problem list
router.post('/problemlist', async (req, res) => {
    try {
        const newProblem = await insertProblemToList(req.body);
        res.status(201).json({
            success: true,
            message: 'Problem added to list successfully',
            data: newProblem
        });
    } catch (error) {
        console.error('Error adding problem to list:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding problem to list',
            error: error.message
        });
    }
});

// Update problem in problem list
router.put('/problemlist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProblem = await updateProblemInList(id, req.body);
        
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
});

// Delete problem from problem list
router.delete('/problemlist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProblem = await deleteProblemFromList(id);
        
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
});

module.exports = router;