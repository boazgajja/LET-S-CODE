const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function getSubmissionFeedback({ title, testcases, expected_outputs, user_outputs, code }) {
  const prompt = `
You're an AI code assistant.

Problem: ${title}

Test Cases:
${testcases.map((test, i) => `
Test Case ${i + 1}:
Input: ${test}
Expected: ${expected_outputs[i]}
User Output: ${user_outputs[i]}
Result: ${expected_outputs[i] === user_outputs[i] ? '✅ Passed' : '❌ Failed'}
`).join('\n')}

User's Code:
${code}

Analyze the failed test cases and suggest reasons and improvements.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { getSubmissionFeedback };
