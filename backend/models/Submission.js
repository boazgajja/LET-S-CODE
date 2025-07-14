const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemList',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['correct', 'wrong'],
    required: true
  }
}, {
  timestamps: true
});

submissionSchema.index({ user: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
