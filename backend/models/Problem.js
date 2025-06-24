const mongoose = require('mongoose');

// Schema for examples
const exampleSchema = new mongoose.Schema({
  input: {
    type: String,
    required: false
  },
  output: {
    type: String,
    required: false
  },
  explanation: {
    type: String,
    required: false
  }
}, { _id: false });

// Schema for test cases
const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: false
  },
  output: {
    type: String,
    required: false
  }
}, { _id: false });

// Schema for solution hints
const solutionSchema = new mongoose.Schema({
  hint1: {
    type: String,
    required: false
  },
  hint2: {
    type: String,
    required: false
  },
  hint3: {
    type: String,
    required: false
  }
}, { _id: false });

// Main Problem Schema
const problemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  description: {
    type: String,
    required: true
  },
  inputFormat: {
    type: String,
    required: true
  },
  outputFormat: {
    type: String,
    required: true
  },
  examples: {
    type: [exampleSchema],
    required: false
  },
  constraints: {
    type: [String],
    required: true
  },
  tags: {
    type: [String],
    required: true
  },
  testCases: {
    type: [testCaseSchema],
    required: false 
  },
  hiddenTestCases: {
    type: [testCaseSchema],
    required: false,
    default: []
  },
  solution: {
    type: solutionSchema,
    required: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
}, { _id: false });

// Create the model
const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;