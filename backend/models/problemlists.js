const mongoose = require('mongoose');

// Problem List Schema for home page
const problemListSchema = new mongoose.Schema({
  id: {
    type: Number,
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
  acceptance: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    required: true
  }],
  isMarked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});
const ProblemList = mongoose.model('ProblemList', problemListSchema);
module.exports = ProblemList;