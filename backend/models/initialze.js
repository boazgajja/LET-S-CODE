const Counter = require('./Problem');

// Initialize the problemId counter on startup if not exists
async function initCounter() {
  await Counter.findByIdAndUpdate(
    'problemId',
    { $setOnInsert: { seq: 34 } },
    { upsert: true }
  );
}

initCounter();
