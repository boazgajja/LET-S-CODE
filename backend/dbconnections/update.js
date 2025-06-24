const Problem = require('./../models/Problem');
const ProblemList = require('./../models/problemlists');
const { connectDB, disconnectDB } = require('./db');

// Update problem by ID
const updateProblem = async (id, updateData) => {
  try {
    await connectDB();
   const updatedProblem = await Problem.findOneAndUpdate(
  { id: String(id) },  // ✅ Match using custom `id`
  updateObj,
  { new: true }        // Optional: return updated document
);

    
    if (updatedProblem) {
      console.log(`Problem updated: ${updatedProblem.title }`);
    } else {
      console.log('Problem not found for update');
    }
    
    return updatedProblem;
  } catch (error) {
    console.error('Error updating problem:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Update problem in problem list by ID
const updateProblemInList = async (id, updateData) => {
  try {
    await connectDB();
 const updatedProblem = await Problem.findOneAndUpdate(
  { id: String(id) },  // ✅ Match using custom `id`
  updateObj,
  { new: true }        // Optional: return updated document
);

    
    if (updatedProblem) {
      console.log(`Problem list item updated: ${updatedProblem.title }`);
    } else {
      console.log('Problem list item not found for update');
    }
    
    return updatedProblem;
  } catch (error) {
    console.error('Error updating problem in list:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Update problem by slug
const updateProblemBySlug = async (slug, updateData) => {
  try {
    await connectDB();
    const updatedProblem = await Problem.findOneAndUpdate(
      { slug }, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (updatedProblem) {
      console.log(`Problem updated by slug: ${updatedProblem.title}`);
    } else {
      console.log('Problem not found for update by slug');
    }
    
    return updatedProblem;
  } catch (error) {
    console.error('Error updating problem by slug:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Update multiple problems by criteria
const updateMultipleProblems = async (criteria, updateData) => {
  try {
    await connectDB();
    const result = await Problem.updateMany(criteria, updateData);
    console.log(`Updated ${result.modifiedCount} problems`);
    return result;
  } catch (error) {
    console.error('Error updating multiple problems:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

module.exports = {
  updateProblem,
  updateProblemInList,
  updateProblemBySlug,
  updateMultipleProblems
};