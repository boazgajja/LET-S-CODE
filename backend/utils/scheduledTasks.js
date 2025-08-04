const cron = require('node-cron');
const PendingProblem = require('../models/PendingProblem');

// Schedule a task to run daily at midnight
const scheduleRemoveOldPendingProblems = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running scheduled task: Remove old pending problems');
      
      // Find pending problems older than 1 month with less than 20 solves
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const result = await PendingProblem.deleteMany({
        createdAt: { $lt: oneMonthAgo },
        $expr: { $lt: [{ $size: "$solvedBy" }, 20] }
      });
      
      console.log(`Removed ${result.deletedCount} old pending problems`);
    } catch (error) {
      console.error('Error in scheduled task:', error);
    }
  });
  
  console.log('Scheduled task set up: Remove old pending problems');
};

module.exports = {
  scheduleRemoveOldPendingProblems
};