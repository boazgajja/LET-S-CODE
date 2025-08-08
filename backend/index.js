const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: '*', // In production, restrict this to your frontend URL
        methods: ['GET', 'POST']
    }
});
const port = process.env.PORT || 3001;
const { connectDB, disconnectDB } = require('./dbconnections/db');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Team = require('./models/Team');

// Import route files
const problemListRoutes = require('./routes/problemListRoute.js');
const problemRoutes = require('./routes/problemRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const submissionRoutes = require('./routes/submissionRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const teamRoutes = require('./routes/teamRoutes.js');
const friendRoutes = require('./routes/friendRoutes.js');
// Remove this line
// const teamWarRoutes = require('./routes/teamWarRoutes.js');

// Middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

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
app.use('/api/users', userRoutes);
app.use('/api', teamRoutes);
app.use('/api', friendRoutes);
// Remove this line
// app.use('/api', teamWarRoutes);
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

// Socket.io connection handling
const connectedUsers = new Map(); // Map to store user ID -> socket ID

io.on('connection', async (socket) => {
    console.log('New client connected');
    
    // Authenticate user with token
    socket.on('authenticate', async (token) => {
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
            const userId = decoded.userId;
            
            // Store user connection
            connectedUsers.set(userId, socket.id);
            
            // Update user's online status
            await User.findByIdAndUpdate(userId, { isOnline: true, lastActive: Date.now() });
            
            // Notify friends that user is online
            const user = await User.findById(userId);
            const friends = user.friends.filter(friend => friend.status === 'accepted').map(friend => friend.user.toString());
            
            friends.forEach(friendId => {
                const friendSocketId = connectedUsers.get(friendId);
                if (friendSocketId) {
                    io.to(friendSocketId).emit('friend_status_change', { userId, isOnline: true });
                }
            });
            
            console.log(`User ${userId} authenticated and set to online`);
            
            // Join socket rooms for each team the user is in
            const userWithTeams = await User.findById(userId).populate('teams.team');
            userWithTeams.teams.forEach(teamData => {
                socket.join(`team_${teamData.team._id}`);
            });
        } catch (error) {
            console.error('Authentication error:', error);
        }
    });
    
    // Handle team chat messages
    socket.on('team_message', async (data) => {
        try {
            const { teamId, message, userId } = data;
            
            // Save message to database
            const team = await Team.findById(teamId);
            if (team) {
                team.messages.push({
                    sender: userId,
                    content: message
                });
                await team.save();
                
                // Broadcast message to team room
                io.to(`team_${teamId}`).emit('team_message', {
                    teamId,
                    message: {
                        sender: userId,
                        content: message,
                        timestamp: new Date()
                    }
                });
            }
        } catch (error) {
            console.error('Team message error:', error);
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
        console.log('Client disconnected');
        
        // Find user ID by socket ID
        let disconnectedUserId = null;
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                break;
            }
        }
        
        if (disconnectedUserId) {
            // Remove from connected users
            connectedUsers.delete(disconnectedUserId);
            
            // Update user's online status
            await User.findByIdAndUpdate(disconnectedUserId, { isOnline: false, lastActive: Date.now() });
            
            // Notify friends that user is offline
            const user = await User.findById(disconnectedUserId);
            const friends = user.friends.filter(friend => friend.status === 'accepted').map(friend => friend.user.toString());
            
            friends.forEach(friendId => {
                const friendSocketId = connectedUsers.get(friendId);
                if (friendSocketId) {
                    io.to(friendSocketId).emit('friend_status_change', { userId: disconnectedUserId, isOnline: false });
                }
            });
            
            console.log(`User ${disconnectedUserId} disconnected and set to offline`);
        }
    });
});

// Start server
async function startServer() {
    try {
        // Connect to MongoDB before starting the server
        await connectDB();
        
        server.listen(port, () => {
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

module.exports = { app, server, io };
