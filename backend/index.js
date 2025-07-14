const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;
const { connectDB, disconnectDB } = require('./dbconnections/db');

// Import route files
const problemListRoutes = require('./routes/problemListRoute.js');
const problemRoutes = require('./routes/problemRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const submissionRoutes = require('./routes/submissionRoutes.js');
// const userRoutes = require('./routes/userRoutes.js');
const teamRoutes = require('./routes/teamRoutes.js');
const friendRoutes = require('./routes/friendRoutes.js');

// Middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(cors()); // Enable CORS

// Basic health check route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Problem Management API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
app.use('/api', problemListRoutes);
app.use('/api', problemRoutes);
app.use('/api', authRoutes);
// app.use('/api/users', userRoutes);
app.use('/api', teamRoutes);
app.use('/api', friendRoutes);
app.use('/api/submissions', submissionRoutes);

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});


// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    // Handle different types of errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: err.message
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            error: err.message
        });
    }
    
    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry',
            error: 'Resource already exists'
        });
    }
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        // Connect to MongoDB before starting the server
        await connectDB();
        
        app.listen(port, () => {
            console.log(`🚀 Server is running on http://localhost:${port}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('\n📋 Available endpoints:');
            console.log('┌─────────────────────────────────────────────────────────────────┐');
            console.log('│                        API ENDPOINTS                            │');
            console.log('├─────────────────────────────────────────────────────────────────┤');
            console.log('│ GET    /                                - Health check           │');
            console.log('│                                                                 │');
            console.log('│ AUTH ROUTES                                                     │');
            console.log('│ POST   /api/auth/login                  - User login             │');
            console.log('│ POST   /api/auth/register               - User registration      │');
            console.log('│ POST   /api/auth/logout                 - User logout            │');
            console.log('│ GET    /api/auth/verify                 - Verify token           │');
            console.log('│                                                                 │');
            console.log('│ USER ROUTES                                                     │');
            console.log('│ GET    /api/users                       - Get all users          │');
            console.log('│ GET    /api/users/:id                   - Get user by ID         │');
            console.log('│ PUT    /api/users/:id                   - Update user profile    │');
            console.log('│ DELETE /api/users/:id                   - Delete user account    │');
            console.log('│ GET    /api/users/:id/profile           - Get user profile       │');
            console.log('│                                                                 │');
            console.log('│ PROBLEM ROUTES                                                  │');
            console.log('│ GET    /api/problemlist                 - Get all problems       │');
            console.log('│ POST   /api/problemlist                 - Add problem to list    │');
            console.log('│ GET    /api/problems                    - Get all problems       │');
            console.log('│ GET    /api/problems/pid/:id            - Get problem by ID      │');
            console.log('│ GET    /api/problems/slug/:slug         - Get problem by slug    │');
            console.log('│ GET    /api/problems/difficulty/:level  - Get by difficulty      │');
            console.log('│ POST   /api/problems                    - Create new problem     │');
            console.log('│ PUT    /api/problems/:id                - Update problem by ID   │');
            console.log('│ DELETE /api/problems/:id                - Delete problem by ID   │');
            console.log('│                                                                 │');
            console.log('│ SUBMISSION ROUTES                                               │');
            console.log('│ GET    /api/submissions                 - Get submissions        │');
            console.log('│ POST   /api/submissions                 - Create submission      │');
            console.log('│ GET    /api/submissions/:id             - Get submission by ID   │');
            console.log('│ PUT    /api/submissions/:id             - Update submission      │');
            console.log('│ DELETE /api/submissions/:id             - Delete submission      │');
            console.log('│                                                                 │');
            console.log('│ TEAM ROUTES                                                     │');
            console.log('│ GET    /api/teams                       - Get all teams          │');
            console.log('│ POST   /api/teams                       - Create new team        │');
            console.log('│ GET    /api/teams/:id                   - Get team by ID         │');
            console.log('│ PUT    /api/teams/:id                   - Update team            │');
            console.log('│ DELETE /api/teams/:id                   - Delete team            │');
            console.log('│ POST   /api/teams/:id/join              - Join team              │');
            console.log('│ POST   /api/teams/:id/leave             - Leave team             │');
            console.log('│ GET    /api/teams/:id/members           - Get team members       │');
            console.log('│                                                                 │');
            console.log('│ FRIEND ROUTES                                                   │');
            console.log('│ GET    /api/friends                     - Get user\'s friends     │');
            console.log('│ POST   /api/friends/request             - Send friend request    │');
            console.log('│ PUT    /api/friends/accept/:id          - Accept friend request  │');
            console.log('│ PUT    /api/friends/reject/:id          - Reject friend request  │');
            console.log('│ DELETE /api/friends/:id                 - Remove friend          │');
            console.log('│ GET    /api/friends/requests            - Get friend requests    │');
            console.log('│ GET    /api/friends/suggestions         - Get friend suggestions │');
            console.log('└─────────────────────────────────────────────────────────────────┘');
        });
        
        // Handle graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, shutting down gracefully');
            await disconnectDB();
            process.exit(0);
        });
        
        process.on('SIGINT', async () => {
            console.log('SIGINT received, shutting down gracefully');
            await disconnectDB();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        // Don't exit immediately, allow some time for logging
        setTimeout(() => process.exit(1), 1000);
    }
}

// Start the server
startServer();

module.exports = app;
