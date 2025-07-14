const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    profile: {
        firstName: {
            type: String,
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters']
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters']
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters']
        },
        avatar: {
            type: String,
            default: null
        },
        dateOfBirth: {
            type: Date
        },
        country: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        website: {
            type: String,
            trim: true
        },
        github: {
            type: String,
            trim: true
        },
        linkedin: {
            type: String,
            trim: true
        }
    },
    stats: {
        problemsSolved: {
            type: Number,
            default: 0
        },
        totalSubmissions: {
            type: Number,
            default: 0
        },
        acceptedSubmissions: {
            type: Number,
            default: 0
        },
        ranking: {
            type: Number,
            default: 0
        },
        badges: [{
            name: String,
            description: String,
            earnedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        language: {
            type: String,
            default: 'javascript'
        },
        emailNotifications: {
            type: Boolean,
            default: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    refreshToken: {
        type: String,
        select: false
    }, 
    submissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission'
    }],
    teams: [{
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    friends: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    friendCode: {
        type: String,
        unique: true
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
    if (this.profile.firstName && this.profile.lastName) {
        return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.profile.firstName || this.profile.lastName || this.username;
});

// Virtual for acceptance rate
userSchema.virtual('stats.acceptanceRate').get(function() {
    if (this.stats.totalSubmissions === 0) return 0;
    return Math.round((this.stats.acceptedSubmissions / this.stats.totalSubmissions) * 100);
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'stats.ranking': 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password and generate friendCode
userSchema.pre('save', async function(next) {
    // Generate friendCode for new users
    if (this.isNew && !this.friendCode) {
        const { v4: uuidv4 } = require('uuid');
        this.friendCode = uuidv4().substring(0, 8);
    }
    
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.refreshToken;
    delete userObject.__v;
    return userObject;
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier },
            { username: identifier }
        ]
    });
};

// Static method to get user rankings
userSchema.statics.getUserRankings = function(limit = 10) {
    return this.find({ isActive: true })
        .sort({ 'stats.ranking': -1, 'stats.problemsSolved': -1 })
        .limit(limit)
        .select('username profile.firstName profile.lastName profile.avatar stats')
        .lean();
};

const User = mongoose.model('User', userSchema);

module.exports = User;