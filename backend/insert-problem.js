const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://boazgajja:boaz%400099@problemset.ruvpee3.mongodb.net/problemset?retryWrites=true&w=majority&appName=problemset';

// Connect to your MongoDB database
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

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

// Your converted data
const problemsData = [
  { id: 2, title: "Find Maximum of Two Numbers", difficulty: "Easy", acceptance: "67.2%", tags: ["Math", "Conditional"], isMarked: false },
  { id: 3, title: "Check Even or Odd", difficulty: "Easy", acceptance: "78.9%", tags: ["Math", "Modulo"], isMarked: true },
  { id: 4, title: "Count Digits in a Number", difficulty: "Easy", acceptance: "72.4%", tags: ["Math", "String"], isMarked: false },
  { id: 5, title: "Calculate Factorial", difficulty: "Easy", acceptance: "65.8%", tags: ["Math", "Recursion"], isMarked: false },
  { id: 6, title: "Reverse a String", difficulty: "Easy", acceptance: "71.3%", tags: ["String", "Two Pointers"], isMarked: true },
  { id: 7, title: "Sum of Array Elements", difficulty: "Easy", acceptance: "76.1%", tags: ["Array", "Math"], isMarked: false },
  { id: 8, title: "Check if String is Palindrome", difficulty: "Easy", acceptance: "68.7%", tags: ["String", "Two Pointers"], isMarked: false },
  { id: 9, title: "Find Minimum in Array", difficulty: "Easy", acceptance: "74.5%", tags: ["Array", "Math"], isMarked: true },
  { id: 10, title: "Count Vowels in String", difficulty: "Easy", acceptance: "69.2%", tags: ["String", "Counting"], isMarked: false },
  { id: 11, title: "Find Nth Fibonacci Number", difficulty: "Easy", acceptance: "63.4%", tags: ["Math", "Dynamic Programming"], isMarked: false },
  { id: 12, title: "Two Sum", difficulty: "Medium", acceptance: "55.8%", tags: ["Array", "Hash Table"], isMarked: true },
  { id: 13, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", acceptance: "42.3%", tags: ["String", "Sliding Window", "Hash Set"], isMarked: false },
  { id: 14, title: "Valid Parentheses", difficulty: "Medium", acceptance: "51.7%", tags: ["String", "Stack"], isMarked: false },
  { id: 15, title: "Binary Search", difficulty: "Medium", acceptance: "58.9%", tags: ["Array", "Binary Search"], isMarked: true },
  { id: 16, title: "Merge Intervals", difficulty: "Medium", acceptance: "47.2%", tags: ["Array", "Sorting"], isMarked: false },
  { id: 17, title: "Rotate Array", difficulty: "Medium", acceptance: "53.6%", tags: ["Array", "Two Pointers"], isMarked: false },
  { id: 18, title: "Group Anagrams", difficulty: "Medium", acceptance: "49.1%", tags: ["String", "Hash Table", "Sorting"], isMarked: true },
  { id: 19, title: "Longest Palindromic Substring", difficulty: "Medium", acceptance: "44.8%", tags: ["String", "Dynamic Programming"], isMarked: false },
  { id: 20, title: "Container With Most Water", difficulty: "Medium", acceptance: "52.3%", tags: ["Array", "Two Pointers"], isMarked: false },
  { id: 21, title: "Generate All Permutations", difficulty: "Medium", acceptance: "38.9%", tags: ["Backtracking", "Recursion"], isMarked: false },
  { id: 22, title: "Subarray Sum Equals K", difficulty: "Medium", acceptance: "46.7%", tags: ["Array", "Hash Map", "Prefix Sum"], isMarked: true },
  { id: 23, title: "Search in Rotated Sorted Array", difficulty: "Medium", acceptance: "41.5%", tags: ["Array", "Binary Search"], isMarked: false },
  { id: 24, title: "Spiral Matrix", difficulty: "Medium", acceptance: "43.2%", tags: ["Array", "Matrix"], isMarked: false },
  { id: 25, title: "Word Break", difficulty: "Medium", acceptance: "40.6%", tags: ["String", "Dynamic Programming"], isMarked: false },
  { id: 26, title: "Jump Game", difficulty: "Medium", acceptance: "48.3%", tags: ["Array", "Greedy"], isMarked: true },
  { id: 27, title: "Decode Ways", difficulty: "Medium", acceptance: "39.7%", tags: ["String", "Dynamic Programming"], isMarked: false },
  { id: 28, title: "Coin Change", difficulty: "Medium", acceptance: "45.1%", tags: ["Dynamic Programming", "Array"], isMarked: false },
  { id: 29, title: "Product of Array Except Self", difficulty: "Medium", acceptance: "50.9%", tags: ["Array", "Prefix Sum"], isMarked: false },
  { id: 30, title: "House Robber", difficulty: "Medium", acceptance: "47.8%", tags: ["Dynamic Programming", "Array"], isMarked: true },
  { id: 31, title: "Unique Paths", difficulty: "Medium", acceptance: "54.2%", tags: ["Math", "Dynamic Programming"], isMarked: false },
  { id: 32, title: "Median of Two Sorted Arrays", difficulty: "Hard", acceptance: "28.4%", tags: ["Array", "Binary Search", "Divide and Conquer"], isMarked: false },
  { id: 33, title: "Trapping Rain Water", difficulty: "Hard", acceptance: "32.1%", tags: ["Array", "Two Pointers", "Stack"], isMarked: false },
  { id: 34, title: "Longest Valid Parentheses", difficulty: "Hard", acceptance: "26.7%", tags: ["String", "Dynamic Programming", "Stack"], isMarked: true },
  { id: 35, title: "Edit Distance", difficulty: "Hard", acceptance: "31.5%", tags: ["String", "Dynamic Programming"], isMarked: false },
  { id: 36, title: "N-Queens", difficulty: "Hard", acceptance: "25.8%", tags: ["Backtracking", "Recursion"], isMarked: false }
];

// Function to insert data
const insertProblems = async () => {
  try {
    await connectDB();
    
    // Clear existing data (optional)
    await ProblemList.deleteMany({});
    console.log('Cleared existing problems');
    
    // Insert new data
    const result = await ProblemList.insertMany(problemsData);
    console.log(`Successfully inserted ${result.length} problems`);
    
    // Display some statistics
    const easyCount = result.filter(p => p.difficulty === 'Easy').length;
    const mediumCount = result.filter(p => p.difficulty === 'Medium').length;
    const hardCount = result.filter(p => p.difficulty === 'Hard').length;
    const markedCount = result.filter(p => p.isMarked).length;
    
    console.log(`\nStatistics:`);
    console.log(`Easy: ${easyCount}`);
    console.log(`Medium: ${mediumCount}`);
    console.log(`Hard: ${hardCount}`);
    console.log(`Marked: ${markedCount}`);
    
    // Show first few inserted records
    console.log('\nFirst 3 inserted problems:');
    result.slice(0, 3).forEach(problem => {
      console.log(`${problem.id}. ${problem.title} (${problem.difficulty}) - ${problem.acceptance}`);
    });
    
  } catch (error) {
    console.error('Error inserting problems:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the insertion
insertProblems();

// Export for use in other files
module.exports = {
  ProblemList,
  problemsData,
  insertProblems
};