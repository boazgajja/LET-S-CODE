const Problem = require('./../models/Problem');
const ProblemList = require('./../models/problemlists');
const { connectDB, disconnectDB } = require('./db');

// Insert new problem to main problems collection
const insertProblem = async (problemData) => {
  try {
    await connectDB();
    const newProblem = new Problem(problemData);
    const savedProblem = await newProblem.save();
    console.log(`Problem created: ${savedProblem.title }`);
    return savedProblem;
  } catch (error) {
    console.error('Error creating problem:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Insert new problem to problem list
const insertProblemToList = async (problemData) => {
  try {
    await connectDB();
    const newProblem = new ProblemList(problemData);
    const savedProblem = await newProblem.save();
    console.log(`Problem added to list: ${savedProblem.title }`);
    return savedProblem;
  } catch (error) {
    console.error('Error adding problem to list:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Bulk insert problems
const insertMultipleProblems = async (problemsArray) => {
  try {
    await connectDB();
    const insertedProblems = await Problem.insertMany(problemsArray);
    console.log(`Inserted ${insertedProblems.length} problems`);
    return insertedProblems;
  } catch (error) {
    console.error('Error inserting multiple problems:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

module.exports = {
  insertProblem,
  insertProblemToList,
  insertMultipleProblems
};