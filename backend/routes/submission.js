const express = require('express');
const router = express.Router();
const axios = require('axios');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');

// Gemini API Key from .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Gemini API endpoint
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Route to save a submission and get AI feedback
router.post('/', async (req, res) => {
  try {
    const { userId, problemId, code, language, testCases, testOutputs } = req.body;

    if (!userId || !problemId || !code || !language || !testCases || !testOutputs) {
      return res.status(400).json({ error: 'Missing fields in request' });
    }

    // Fetch problem title
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Call Gemini API for feedback
    const prompt = `
You are an AI assistant analyzing a coding submission.
Problem Title: ${problem.title}
Submitted Code:
\`\`\`${language}
${code}
\`\`\`
Test Cases:
${testCases.map((tc, i) => `Input ${i + 1}: ${tc}\nExpected Output: ${testOutputs[i]}`).join('\n\n')}

Please provide:
1. A short summary of what the code is doing.
2. Any logical errors or inefficiencies.
3. Suggestions for improvement if any.
`;

    const aiResponse = await axios.post(GEMINI_API_URL, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const aiAnalysis = aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis from AI";

    // Save submission in database
    const submission = new Submission({
      userId,
      problemId,
      code,
      language,
      testCases,
      testOutputs,
      aiAnalysis
    });

    await submission.save();

    res.status(200).json({ success: true, submission });
  } catch (err) {
    console.error('Submission save error:', err.message);
    res.status(500).json({ error: 'Server error saving submission' });
  }
});

module.exports = router;
