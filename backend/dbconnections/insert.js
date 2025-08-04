const Problem = require('./../models/Problem');
const ProblemList = require('./../models/problemlists');
const { connectDB, disconnectDB } = require('./db');

// Helper function to generate slug if not provided
const generateSlug = (title) => {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
};

// Helper function to ensure unique slug
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existingProblem = await Problem.findOne({ 
      slug: slug,
      ...(excludeId && { _id: { $ne: excludeId } })
    });
    
    if (!existingProblem) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Insert new problem to problem list
const insertProblemToList = async (problemData) => {
  try {
    // Generate slug if not provided
    let slug = problemData.slug;
    if (!slug && problemData.title) {
      slug = generateSlug(problemData.title);
    }
    
    // Ensure unique slug for problem list
    if (slug) {
      slug = await ensureUniqueSlug(slug, problemData._id);
    }
    
    const problemListData = {
      ...problemData,
      slug: slug,
      acceptance: problemData.acceptance || 0 // Default to 0 if not provided
    };
    
    const newProblem = new ProblemList(problemListData);
    const savedProblem = await newProblem.save();
    console.log(`Problem added to list: ${savedProblem.title} (slug: ${savedProblem.slug})`);
    return savedProblem;
  } catch (error) {
    console.error('Error adding problem to list:', error.message);
    throw error;
  }
};

// Insert new problem to main problems collection (AND to list)
// Modify the insertProblem function to include the user ID

const insertProblem = async (problemData, userId = null) => {
  try {
    // Generate slug if not provided
    let slug = problemData.slug;
    if (!slug && problemData.title) {
      slug = generateSlug(problemData.title);
    }
    
    // Ensure unique slug
    if (slug) {
      slug = await ensureUniqueSlug(slug);
    }
    
    // Prepare problem data with slug and user ID
    const problemDataWithSlug = {
      ...problemData,
      slug: slug,
      // Generate unique ID if not provided (frontend sends Date.now().toString())
      id: problemData.id || Date.now().toString(),
      // Set the user who added the problem
      addedBy: userId
    };
    
    const newProblem = new Problem(problemDataWithSlug);
    console.log(`Problem created:`, newProblem);
    const savedProblem = await newProblem.save();
    console.log(`Problem created: ${savedProblem.title} (slug: ${savedProblem.slug})`);
    
    // Insert to list as well with acceptance field
    const problemListData = {
      ...problemDataWithSlug,
      acceptance: problemDataWithSlug.acceptance || 0, // Default to 0 if not provided
      _id: savedProblem._id // Use the same ID from the main problem
    };
    
    await insertProblemToList(problemListData);
    return savedProblem;
  } catch (error) {
    console.error('Error creating problem:', error.message);
    throw error;
  }
};

// Bulk insert problems
const insertMultipleProblems = async (problemsArray) => {
  try {
    // Process each problem to ensure it has a unique slug
    const processedProblems = await Promise.all(
      problemsArray.map(async (problem) => {
        let slug = problem.slug;
        if (!slug && problem.title) {
          slug = generateSlug(problem.title);
        }
        
        // Ensure unique slug
        if (slug) {
          slug = await ensureUniqueSlug(slug);
        }
        
        return {
          ...problem,
          slug: slug,
          id: problem.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
      })
    );
    
    const insertedProblems = await Problem.insertMany(processedProblems);
    console.log(`Inserted ${insertedProblems.length} problems`);
    
    // Also insert to problem list with acceptance field
    const problemListData = insertedProblems.map(problem => ({
      ...problem.toObject(),
      acceptance: problem.acceptance || 0
    }));
    
    await ProblemList.insertMany(problemListData);
    console.log(`Inserted ${problemListData.length} problems to list`);
    
    return insertedProblems;
  } catch (error) {
    console.error('Error inserting multiple problems:', error.message);
    throw error;
  }
};

// Update problem (helper function for editing existing problems)
const updateProblem = async (problemId, updateData) => {
  try {
    // If title is being updated, regenerate slug
    if (updateData.title) {
      let slug = updateData.slug || generateSlug(updateData.title);
      slug = await ensureUniqueSlug(slug, problemId);
      updateData.slug = slug;
    }
    
    const updatedProblem = await Problem.findByIdAndUpdate(
      problemId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedProblem) {
      throw new Error('Problem not found');
    }
    
    // Also update in problem list
    await ProblemList.findByIdAndUpdate(
      problemId,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log(`Problem updated: ${updatedProblem.title} (slug: ${updatedProblem.slug})`);
    return updatedProblem;
  } catch (error) {
    console.error('Error updating problem:', error.message);
    throw error;
  }
};

module.exports = {
  insertProblem,
  insertProblemToList,
  insertMultipleProblems,
  updateProblem,
  generateSlug,
  ensureUniqueSlug
};