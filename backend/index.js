    const express = require('express');
    const cors = require('cors'); // Add this if you need CORS
    const app = express();
    const port = 3001;

    // Import your service functions
    const {
    getAllProblems,
    getProblemById,
    getProblemBySlug,
    getProblemsByDifficulty,
    getProblemsWithPagination,
    getproblemlist
    } = require('./dbconnections/fetch'); // Adjust path as needed

    // Import other operations (you'll need to create these)
    const { insertProblem, insertProblemToList } = require('./dbconnections/insert');
    const { updateProblem, updateProblemInList } = require('./dbconnections/update');
    const { deleteProblem, deleteProblemFromList } = require('./dbconnections/delete');

    // Middleware
    app.use(express.json()); // Parse JSON bodies
    app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
    app.use(cors()); // Enable CORS if needed

    // Basic route
    app.get('/', (req, res) => {
        res.send('Hello World! Problem Management API is running.');
    });

    // ==================== PROBLEM LIST ROUTES ====================

    // // Get all problems from problem list (for home page)
    app.get('/api/problemlist', async (req, res) => {
        try {
            const problems = await getproblemlist();
            console.log(problems);
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

    // // Add problem to problem list
    app.post('/api/problemlist', async (req, res) => {
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

    // // ==================== MAIN PROBLEMS ROUTES ====================

    // // Get all problems with optional pagination
    // app.get('/api/problems', async (req, res) => {
    //     try {
    //         const { page, limit } = req.query;
            
    //         let result;
    //         if (page || limit) {
    //             // Use pagination if page or limit is provided
    //             const pageNum = parseInt(page) || 1;
    //             const limitNum = parseInt(limit) || 10;
    //             result = await getProblemsWithPagination(pageNum, limitNum);
                
    //             res.status(200).json({
    //                 success: true,
    //                 data: result.problems,
    //                 pagination: result.pagination
    //             });
    //         } else {
    //             // Get all problems without pagination
    //             const problems = await getAllProblems();
    //             res.status(200).json({
    //                 success: true,
    //                 count: problems.length,
    //                 data: problems
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Error fetching problems:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'Error fetching problems',
    //             error: error.message
    //         });
    //     }
    // });

    // // Get problem by ID (when user clicks on a question)
        app.get('/api/problems/pid/:id', async (req, res) => {
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

    // // Get problem by slug
    // app.get('/api/problems/slug/:slug', async (req, res) => {
    //     try {
    //         const { slug } = req.params;
    //         const problem = await getProblemBySlug(slug);
            
    //         if (!problem) {
    //             return res.status(404).json({
    //                 success: false,
    //                 message: 'Problem not found'
    //             });
    //         }
            
    //         res.status(200).json({
    //             success: true,
    //             data: problem
    //         });
    //     } catch (error) {
    //         console.error('Error fetching problem by slug:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'Error fetching problem by slug',
    //             error: error.message
    //         });
    //     }
    // });

    // // Get problems by difficulty
    // app.get('/api/problems/difficulty/:difficulty', async (req, res) => {
    //     try {
    //         const { difficulty } = req.params;
    //         const problems = await getProblemsByDifficulty(difficulty);
            
    //         res.status(200).json({
    //             success: true,
    //             count: problems.length,
    //             data: problems
    //         });
    //     } catch (error) {
    //         console.error('Error fetching problems by difficulty:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'Error fetching problems by difficulty',
    //             error: error.message
    //         });
    //     }
    // });

    // // Create new problem
    // app.post('/api/problems', async (req, res) => {
    //     try {
    //         const newProblem = await insertProblem(req.body);
    //         res.status(201).json({
    //             success: true,
    //             message: 'Problem created successfully',
    //             data: newProblem
    //         });
    //     } catch (error) {
    //         console.error('Error creating problem:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'Error creating problem',
    //             error: error.message
    //         });
    //     }
    // });

    // // Update problem by ID
    // app.put('/api/problems/:id', async (req, res) => {
    //     try {
    //         const { id } = req.params;
    //         const updatedProblem = await updateProblem(id, req.body);
            
    //         if (!updatedProblem) {
    //             return res.status(404).json({
    //                 success: false,
    //                 message: 'Problem not found'
    //             });
    //         }
            
    //         res.status(200).json({
    //             success: true,
    //             message: 'Problem updated successfully',
    //             data: updatedProblem
    //         });
    //     } catch (error) {
    //         console.error('Error updating problem:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'Error updating problem',
    //             error: error.message
    //         });
    //     }
    // });

    // // Delete problem by ID
    // app.delete('/api/problems/:id', async (req, res) => {
    //     try {
    //         const { id } = req.params;
    //         const deletedProblem = await deleteProblem(id);
            
    //         if (!deletedProblem) {
    //             return res.status(404).json({
    //                 success: false,
    //                 message: 'Problem not found'
    //             });
    //         }
            
    //         res.status(200).json({
    //             success: true,
    //             message: 'Problem deleted successfully',
    //             data: deletedProblem
    //         });
    //     } catch (error) {
    //         console.error('Error deleting problem:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'Error deleting problem',
    //             error: error.message
    //         });
    //     }
    // });

    // // ==================== ERROR HANDLING ====================

    // // Handle 404 for undefined routes
    // app.use('*', (req, res) => {
    //     res.status(404).json({
    //         success: false,
    //         message: 'Route not found'
    //     });
    // });

    // // // Global error handler
    // app.use((err, req, res, next) => {
    //     console.error('Unhandled error:', err);
    //     res.status(500).json({
    //         success: false,
    //         message: 'Internal server error',
    //         error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    //     });
    // });

    // Start server
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
        console.log('Available endpoints:');
        console.log('GET    /api/problemlist              - Get all problems from problem list');
        console.log('POST   /api/problemlist              - Add problem to problem list');
        console.log('GET    /api/problems                 - Get all problems (with optional pagination)');
        console.log('GET    /api/problems/id/:id          - Get problem by ID');
        console.log('GET    /api/problems/slug/:slug      - Get problem by slug');
        console.log('GET    /api/problems/difficulty/:difficulty - Get problems by difficulty');
        console.log('POST   /api/problems                 - Create new problem');
        console.log('PUT    /api/problems/:id             - Update problem by ID');
        console.log('DELETE /api/problems/:id             - Delete problem by ID');
    });