const mongoose = require('mongoose');

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

// Pending Problem Schema
const pendingProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
  description: { type: String, required: true },
  inputFormat: { type: String, required: true },
  outputFormat: { type: String, required: true },
  examples: { type: [exampleSchema] },
  constraints: { type: [String], required: true },
  tags: { type: [String], required: true },
  testCases: { type: [testCaseSchema] },
  solution: { type: solutionSchema },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  solvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PendingProblem = mongoose.model('PendingProblem', pendingProblemSchema);
module.exports = PendingProblem;