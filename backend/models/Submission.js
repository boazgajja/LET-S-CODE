const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // For regular problems (ref: 'Problem')
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
  // For pending (custom) problems (ref: 'PendingProblem')
  pendingProblem: { type: mongoose.Schema.Types.ObjectId, ref: 'PendingProblem' },
  // Always store these for display/deletion safety
  problemTitle: { type: String, required: true },
  problemDifficulty: { type: String, required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ['correct', 'wrong'], required: true },
  explanation: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
