const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  problemTitle: { type: String },
  problemDifficulty: { type: String },
  code: { type: String, required: true },
  status: { type: String, enum: ['correct', 'wrong'], required: true },
  explanation: { type: String } // Explanation/comment for the submission
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
