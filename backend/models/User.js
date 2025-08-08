const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

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
    select: false
  },
  isOnline: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  profile: {
    firstName: { type: String, trim: true, maxlength: [50, 'First name cannot exceed 50 characters'] },
    lastName: { type: String, trim: true, maxlength: [50, 'Last name cannot exceed 50 characters'] },
    bio: { type: String, maxlength: [500, 'Bio cannot exceed 500 characters'] },
    avatar: { type: String, default: null },
    dateOfBirth: { type: Date },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    website: { type: String, trim: true },
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true }
  },
  stats: {
    problemsSolved: { type: Number, default: 0 },
    solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProblemList' }],
    totalSubmissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    ranking: { type: Number, default: 0 },
    coins: { type: Number, default: 100 },
    badges: [{
      name: String,
      description: String,
      earnedAt: { type: Date, default: Date.now }
    }]
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, default: 'javascript' },
    emailNotifications: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  lastLogin: { type: Date, default: Date.now },
  refreshToken: { type: String, select: false },
  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }],
  teams: [{
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  friends: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  friendCode: { type: String, unique: true },
  workingProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProblemList' }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add this static method to the schema
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Returns a public profile object (without sensitive fields)
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
};

// Hash password before saving - THIS IS THE KEY FIX
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with salt rounds of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate friend code if not exists
userSchema.pre('save', function(next) {
  if (!this.friendCode) {
    this.friendCode = uuidv4().substring(0, 8).toUpperCase();
  }
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;