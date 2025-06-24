import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import CodeEditor from './editor';
import { ArrowLeft, Code, Clock, Users, TrendingUp } from 'lucide-react';
import './../problem.css';

const languageMap = {
  javascript: 63,
  cpp: 54,
  python: 71,
  java: 62
};

// Default code templates for different languages
const defaultCodeTemplates = {
  javascript: `// Write your solution here
function solve() {
    // Your code here
}

solve();`,
  
  python: `# Write your solution here
def solve():
    # Your code here
    pass


# Call your function and print result
solve()`,
  
  cpp: `#include <iostream>
using namespace std;

int solve() {
    // Your code here
    return 0;
}

int main() {
    solve();
    return 0;
}`,
  
  java: `
public class Main {
    public static int solve() {
        // Your code here
        return 0;
    }
    
    public static void main(String[] args) {
        solve();
    }
}`
};

function Problem() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [inputHeight, setInputHeight] = useState(180);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('-- Hit run to see the output --');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize code template when language changes
  useEffect(() => {
    setCode(defaultCodeTemplates[language] || '// Write your code here');
  }, [language]);

  // Fetch problem data from API
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://let-s-code.onrender.com/api/problems/pid/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Extract the actual problem data
        const problemData = result.success ? result.data : result;
        setProblem(problemData);
        console.log('Problem data fetched:', problemData);
        
        // Set initial input to first example if available
        if (problemData.examples && problemData.examples.length > 0) {
          setInput(problemData.examples[0].input);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching problem:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProblem();
    }
  }, [id]);

  // Prevent ResizeObserver error
  useEffect(() => {
    const handleError = (e) => {
      if (e.message.includes('ResizeObserver loop limit exceeded')) {
        e.stopImmediatePropagation();
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const startDrag = () => {
    const onDrag = (e) => {
      requestAnimationFrame(() => {
        const newHeight = window.innerHeight - e.clientY - 100;
        if (newHeight >= 100 && newHeight <= window.innerHeight * 0.6) {
          setInputHeight(newHeight);
        }
      });
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDrag);
    };

    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  const runCode = async () => {
    if (!code.trim()) {
      setOutput('Please write some code first!');
      return;
    }

    setIsRunning(true);
    const options = {
      method: 'POST',
      url: 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': '0ab6de0af9msh98d6f9c1bc68e73p155dafjsn99ea5a5188ab',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      data: {
        source_code: code,
        language_id: languageMap[language],
        stdin: input
      }
    };

    try {
      const res = await axios.request(options);
      
      if (res.data.status?.id === 3) { // Accepted
        setOutput(res.data.stdout || 'Code executed successfully (no output)');
      } else if (res.data.stderr) {
        setOutput(`Error:\n${res.data.stderr}`);
      } else if (res.data.compile_output) {
        setOutput(`Compilation Error:\n${res.data.compile_output}`);
      } else {
        setOutput(res.data.stdout || 'No output');
      }
    } catch (err) {
      setOutput('Error running code: ' + err.message);
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!problem || !problem.testCases) {
      setOutput('No test cases available');
      return;
    }

    if (!code.trim()) {
      setOutput('Please write some code first!');
      return;
    }

    setIsSubmitting(true);
    let allTestsPassed = true;
    let results = [];

    // Combine visible and hidden test cases
    const visibleTestCases = problem.testCases || [];
    const hiddenTestCases = problem.hiddenTestCases || [];
    const allTestCases = [...visibleTestCases, ...hiddenTestCases];

    let resultText = `\n=== SUBMISSION RESULTS ===\n`;

    for (let i = 0; i < allTestCases.length; i++) {
      const testCase = allTestCases[i];
      const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': '0ab6de0af9msh98d6f9c1bc68e73p155dafjsn99ea5a5188ab',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        data: {
          source_code: code,
          language_id: languageMap[language],
          stdin: testCase.input
        }
      };

      try {
        const res = await axios.request(options);
        const actualOutput = (res.data.stdout || '').trim();
        const expectedOutput = testCase.output.trim();
        const passed = actualOutput === expectedOutput;
        
        if (!passed) {
          allTestsPassed = false;
        }

        results.push({
          testCase: i + 1,
          input: testCase.input,
          expected: expectedOutput,
          actual: actualOutput,
          passed: passed,
          isHidden: i >= visibleTestCases.length,
          error: res.data.stderr || res.data.compile_output
        });
      } catch (err) {
        allTestsPassed = false;
        results.push({
          testCase: i + 1,
          input: testCase.input,
          expected: testCase.output,
          actual: 'Runtime Error',
          passed: false,
          isHidden: i >= visibleTestCases.length,
          error: err.message
        });
      }
    }

    // Display results
    const passedCount = results.filter(r => r.passed).length;
    resultText += `Status: ${allTestsPassed ? '✅ ACCEPTED' : '❌ WRONG ANSWER'}\n`;
    resultText += `Tests Passed: ${passedCount}/${results.length}\n\n`;

    // Show visible test cases results
    const visibleResults = results.slice(0, visibleTestCases.length);
    if (visibleResults.length > 0) {
      resultText += `📋 Visible Test Cases:\n`;
      visibleResults.forEach(result => {
        resultText += `Test ${result.testCase}: ${result.passed ? '✅ PASS' : '❌ FAIL'}\n`;
        if (!result.passed) {
          resultText += `  📥 Input: ${result.input}\n`;
          resultText += `  📤 Expected: ${result.expected}\n`;
          resultText += `  📤 Got: ${result.actual}\n`;
          if (result.error) {
            resultText += `  ⚠️ Error: ${result.error}\n`;
          }
        }
      });
    }

    // Show hidden test cases results (only pass/fail)
    const hiddenResults = results.slice(visibleTestCases.length);
    if (hiddenResults.length > 0) {
      resultText += `\n🔒 Hidden Test Cases:\n`;
      hiddenResults.forEach((result, index) => {
        resultText += `Hidden Test ${index + 1}: ${result.passed ? '✅ PASS' : '❌ FAIL'}\n`;
      });
    }

    if (allTestsPassed) {
      resultText += `\n🎉 Congratulations! All tests passed!`;
    } else {
      resultText += `\n💡 Keep trying! Review the failed test cases above.`;
    }

    setOutput(resultText);
    setIsSubmitting(false);
  };

  const loadExample = (example) => {
    setInput(example.input);
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading problem...</p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="page-wrapper">
        <div className="error-container">
          <p>Error loading problem: {error}</p>
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            Back to Problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <header className="main-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} />
        </Link>
        <div className="header-content">
          <Code size={24} />
          <h1>LET'S CODE</h1>
        </div>
      </header>

      <div className="main-body">
        <div className="left-section">
          <div className="problem-header">
            <div className="problem-title">{problem.title}</div>
            <span className={`difficulty-badge ${problem.difficulty?.toLowerCase()}`}>
              {problem.difficulty}
            </span>
          </div>

          <div className="problem-stats">
            <div className="stat-item">
              <TrendingUp size={16} />
              <span>{problem.acceptance || 'N/A'}</span>
            </div>
            <div className="stat-item">
              <Users size={16} />
              <span>{problem.submissions || 'N/A'}</span>
            </div>
            <div className="stat-item">
              <Clock size={16} />
              <span>{new Date(problem.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="description-section">
            <div className="section-title">Description</div>
            <div className="problem-desc">{problem.description}</div>
          </div>

          {problem.inputFormat && (
            <div className="format-section">
              <div className="format-item">
                <div className="section-title">Input Format</div>
                <p>{problem.inputFormat}</p>
              </div>
              {problem.outputFormat && (
                <div className="format-item">
                  <div className="section-title">Output Format</div>
                  <p>{problem.outputFormat}</p>
                </div>
              )}
            </div>
          )}

          {problem.examples && problem.examples.length > 0 && (
            <div className="examples">
              <div className="section-title">Examples</div>
              {problem.examples.slice(0, 3).map((ex, i) => (
                <div key={i} className="example-box">
                  <div className="example-header">
                    <strong>Example {i + 1}</strong>
                    <button 
                      className="example-load-btn"
                      onClick={() => loadExample(ex)}
                      title="Load this example as input"
                    >
                      Load
                    </button>
                  </div>
                  <div className="example-section">
                    <div className="example-label">Input:</div>
                    <div className="example-content">{ex.input}</div>
                  </div>
                  <div className="example-section">
                    <div className="example-label">Output:</div>
                    <div className="example-content">{ex.output}</div>
                  </div>
                  {ex.explanation && (
                    <div className="example-section">
                      <div className="example-label">Explanation:</div>
                      <div className="example-text">{ex.explanation}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {problem.constraints && problem.constraints.length > 0 && (
            <div className="constraints">
              <div className="section-title">Constraints</div>
              <ul>
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {problem.tags && problem.tags.length > 0 && (
            <div className="topics">
              <div className="section-title">Tags</div>
              <div>
                {problem.tags.map((tag, i) => (
                  <span key={i} className="topic-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {problem.solution && (
            <div className="hints">
              <div className="section-title">Hints</div>
              <div className="hint-list">
                {problem.solution.hint1 && <div className="hint-item">💡 {problem.solution.hint1}</div>}
                {problem.solution.hint2 && <div className="hint-item">💡 {problem.solution.hint2}</div>}
                {problem.solution.hint3 && <div className="hint-item">💡 {problem.solution.hint3}</div>}
              </div>
            </div>
          )}
        </div>

        <div className="right-section">
          <div className="editor-toolbar">
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
            <div className="toolbar-buttons">
              <button 
                className="btn run-btn" 
                onClick={runCode}
                disabled={isRunning}
              >
                {isRunning ? 'Running...' : 'Run'}
              </button>
              <button 
                className="btn submit-btn" 
                onClick={submitCode}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          <div className="editor-area">
            <CodeEditor language={language} value={code} onChange={setCode} />
          </div>

          <div className="drag-separator" onMouseDown={startDrag} />
          
          <div className="input-output" style={{ height: inputHeight }}>
            <div className="input-box">
              <h4>Input</h4>
              <textarea 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your test input here..."
              />
            </div>
            <div className="output-box">
              <h4>Output</h4>
              <div className="output-text">{output}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Problem;