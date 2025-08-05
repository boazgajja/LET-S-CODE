// models/Problem.js
const mongoose = require('mongoose');

// Counter Schema to store sequence
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 37 }
});
const Counter = mongoose.model('Counter', counterSchema);

// Example schema
const exampleSchema = new mongoose.Schema({
  input: { type: String },
  output: { type: String },
  explanation: { type: String }
}, { _id: false });

// Test case schema
const testCaseSchema = new mongoose.Schema({
  input: { type: String },
  output: { type: String }
}, { _id: false });

// Solution hints schema
const solutionSchema = new mongoose.Schema({
  hint1: { type: String },
  hint2: { type: String },
  hint3: { type: String }
}, { _id: false });

// Main Problem Schema - FIXED: using Number for id
const problemSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // Changed to Number
  slug: { type: String, required: true, unique: true, sparse: true },
  title: { type: String, required: true },
  difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
  description: { type: String, required: true },
  inputFormat: { type: String, required: true },
  outputFormat: { type: String, required: true },
  examples: { type: [exampleSchema] },
  constraints: { type: [String], required: true },
  tags: { type: [String], required: true },
  testCases: { type: [testCaseSchema] },
  hiddenTestCases: { type: [testCaseSchema], default: [] },
  solution: { type: solutionSchema },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  solvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

// Auto-increment ID logic - FIXED: now returns Number
problemSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew && !doc.id) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'problemId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      doc.id = counter.seq; // Remove .toString() to keep as Number
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

const Problem = mongoose.model('Problem', problemSchema);
module.exports = Problem;