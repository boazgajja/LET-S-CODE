// models/ProblemList.js
const mongoose = require('mongoose');

// Problem List Schema for home page - FIXED: added reference to Problem
const problemListSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  problemRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }, // Reference to Problem document
  title: { type: String, required: true },
  difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
  acceptance: { type: String, required: true },
  tags: [{ type: String, required: true }],
  isMarked: { type: Boolean, default: false }
}, { timestamps: true });

// Add index for better performance
problemListSchema.index({ id: 1 });
problemListSchema.index({ problemRef: 1 });

const ProblemList = mongoose.model('ProblemList', problemListSchema);
module.exports = ProblemList;