const Problem = require('./../models/Problem'); // Adjust the path as necessary
const { connectDB, disconnectDB } = require('./db');
const ProblemList = require('./../models/problemlists'); // Adjust the path as necessary
// Get all problems from database

const getproblemlist = async () => {
  try {
    await connectDB();
    const problems = await ProblemList.find({});
    // console.log(`Retrieved ${problems.length} problems`);
    // console.log(problems);
    return problems;
  } catch (error) {
    console.error('Error fetching all problems:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

const getAllProblems = async () => {
  try {
    await connectDB();
    const problems = await Problem.find({});
    console.log(`Retrieved ${problems.length} problems`);
    console.log(problems);
    return problems;
  } catch (error) {
    console.error('Error fetching all problems:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Get problem by ID

// Modified function
const getProblemById = async (problemId) => {
  try {
    await connectDB();
    console.log('🔍 Fetching problem with ID:', problemId);
    const problem = await Problem.findOne({ id: problemId });
    console.log('🔍 Problem fetched:', problem ? problem.title : 'Not found');
    if (!problem) {
      throw new Error(`Problem with id ${problemId} not found`);
    }

    console.log('✅ Found problem:', Object.keys(problem._doc));
    return problem;
  } catch (error) {
    console.trace("❌ Stack Trace");
    console.error('❌ Error fetching problem by ID:', error.message);
    throw error;
  }
};

// Get problem by slug
const getProblemBySlug = async (slug) => {
  try {
    await connectDB();
    const problem = await Problem.findOne({ slug });
    if (problem) {
      console.log(`Retrieved problem: ${problem.title}`);
    } else {
      console.log('Problem not found');
    }
    return problem;
  } catch (error) {
    console.error('Error fetching problem by slug:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Get problems by difficulty
const getProblemsByDifficulty = async (difficulty) => {
  try {
    await connectDB();
    const problems = await Problem.find({ difficulty });
    console.log(`Retrieved ${problems.length} problems with difficulty: ${difficulty}`);
    return problems;
  } catch (error) {
    console.error('Error fetching problems by difficulty:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Get problems with pagination
const getProblemsWithPagination = async (page = 1, limit = 10) => {
  try {
    await connectDB();
    const skip = (page - 1) * limit;
    const problems = await Problem.find({}).skip(skip).limit(limit);
    const total = await Problem.countDocuments();
    
    console.log(`Retrieved ${problems.length} problems (Page ${page}/${Math.ceil(total / limit)})`);
    
    return {
      problems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProblems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching problems with pagination:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};
// getproblemlist();
module.exports = { 
  getAllProblems, 
  getProblemById, 
  getProblemBySlug, 
  getProblemsByDifficulty,
  getProblemsWithPagination,
  getproblemlist
};