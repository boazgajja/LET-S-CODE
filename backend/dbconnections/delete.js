const Problem = require('./../models/Problem');
const ProblemList = require('./../models/problemlists');
const { connectDB, disconnectDB } = require('./db');

// Delete problem by ID
const deleteProblem = async (id) => {
  try {
    await connectDB();
const deletedProblem = await Problem.findOneAndDelete({ id: String(id) }); // ✅

    
    if (deletedProblem) {
      console.log(`Problem deleted: ${deletedProblem.title}`);
    } else {
      console.log('Problem not found for deletion');
    }
    
    return deletedProblem;
  } catch (error) {
    console.error('Error deleting problem:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Delete problem from problem list by ID
// const deleteProblemFromList = async (id) => {
//   try {
//     await connectDB();
//     const deletedProblem = await ProblemList.findByIdAndDelete(id);
    
//     if (deletedProblem) {
//       console.log(`Problem deleted from list: ${deletedProblem.title || deletedProblem._id}`);
//     } else {
//       console.log('Problem not found in list for deletion');
//     }
    
//     return deletedProblem;
//   } catch (error) {
//     console.error('Error deleting problem from list:', error.message);
//     throw error;
//   } finally {
//     await disconnectDB();
//   }
// };

// Delete problem by slug
const deleteProblemBySlug = async (slug) => {
  try {
    await connectDB();
    const deletedProblem = await Problem.findOneAndDelete({ slug });
    
    if (deletedProblem) {
      console.log(`Problem deleted by slug: ${deletedProblem.title}`);
    } else {
      console.log('Problem not found for deletion by slug');
    }
    
    return deletedProblem;
  } catch (error) {
    console.error('Error deleting problem by slug:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Delete multiple problems by criteria
const deleteMultipleProblems = async (criteria) => {
  try {
    await connectDB();
    const result = await Problem.deleteMany(criteria);
    console.log(`Deleted ${result.deletedCount} problems`);
    return result;
  } catch (error) {
    console.error('Error deleting multiple problems:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Soft delete problem (mark as deleted instead of removing)
const softDeleteProblem = async (id) => {
  try {
    await connectDB();
    const updatedProblem = await Problem.findOneAndUpdate(
      id, 
      { 
        isDeleted: true, 
        deletedAt: new Date() 
      }, 
      { new: true }
    );
    
    if (updatedProblem) {
      console.log(`Problem soft deleted: ${updatedProblem.title }`);
    } else {
      console.log('Problem not found for soft deletion');
    }
    
    return updatedProblem;
  } catch (error) {
    console.error('Error soft deleting problem:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

module.exports = {
  deleteProblem,
  // deleteProblemFromList,
  deleteProblemBySlug,
  deleteMultipleProblems,
  softDeleteProblem
};