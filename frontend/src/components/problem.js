import React, { useState, useEffect , useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import CodeEditor from './editor';
import { ArrowLeft, Code, Clock, Users, TrendingUp, Lightbulb, ChevronRight, Menu, X  } from 'lucide-react';
import { useDataContext } from '../context/datacontext'; // Add this import
import './../styles/problem.css';

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
  const { addSubmission } = useDataContext(); // Add this line
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [inputHeight, setInputHeight] = useState(80);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('-- Hit run to see the output --');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartY = useRef(0);
  const startHeight = useRef(0);

  // Initialize code template when language changes
  useEffect(() => {
    setCode(defaultCodeTemplates[language] || '// Write your code here');
  }, [language]);

  // Fetch problem data from API
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const response = await fetch(process.env.REACT_APP_SERVER_LINK + `/problems/${id}`);
        
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

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Drag functionality
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    startHeight.current = inputHeight;
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaY = dragStartY.current - e.clientY;
    const newHeight = Math.max(80, Math.min(500, startHeight.current + deltaY));
    setInputHeight(newHeight);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    startHeight.current = inputHeight;
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = dragStartY.current - touch.clientY;
    const newHeight = Math.max(100, Math.min(500, startHeight.current + deltaY));
    setInputHeight(newHeight);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  const runCode = async () => {
    if (!code.trim()) {
      setOutput('Please write some code first!');
      return;
    }

    setIsRunning(true);
    const options = {
      method: 'POST',
      url: process.env.REACT_APP_JUDGE_POST,
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
    // Prevent multiple submissions
    if (isSubmitting) return;
    
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

    try {
      for (let i = 0; i < allTestCases.length; i++) {
        const testCase = allTestCases[i];
        const options = {
          method: 'POST',
          url: process.env.REACT_APP_JUDGE_POST,
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
        
        // Save submission to database
        if (problem && problem._id) {
          try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER_LINK}/submissions`, {
              userId: localStorage.getItem("userId"),
              problemId: problem._id,
              code,
              status: "correct"
            });
            
            // Add submission to context
            if (response.data && response.data.success) {
              addSubmission(response.data.data);
            }
            
            console.log("Submission saved successfully");
          } catch (err) {
            console.error("Failed to save submission:", err.message);
          }
        }
      } else {
        resultText += `\n💡 Keep trying! Review the failed test cases above.`;
        
        // Save incorrect submission
        if (problem && problem._id) {
          try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER_LINK}/submissions`, {
              userId: localStorage.getItem("userId"),
              problemId: problem._id,
              code,
              status: "wrong"
            });
            
            // Add submission to context
            if (response.data && response.data.success) {
              addSubmission(response.data.data);
            }
            
            console.log("Submission saved successfully");
          } catch (err) {
            console.error("Failed to save submission:", err.message);
          }
        }
      }

      setOutput(resultText);
    } catch (error) {
      console.error('Submission error:', error);
      setOutput('Error during submission: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextHint = () => {
    if (!problem?.solution) return;
    
    const hints = [problem.solution.hint1, problem.solution.hint2, problem.solution.hint3].filter(Boolean);
    if (currentHint < hints.length - 1) {
      setCurrentHint(currentHint + 1);
    }
  };

  const getCurrentHints = () => {
    if (!problem?.solution) return [];
    
    const hints = [problem.solution.hint1, problem.solution.hint2, problem.solution.hint3].filter(Boolean);
    return hints.slice(0, currentHint + 1);
  };

  const hasMoreHints = () => {
    if (!problem?.solution) return false;
    
    const hints = [problem.solution.hint1, problem.solution.hint2, problem.solution.hint3].filter(Boolean);
    return currentHint < hints.length - 1;
  };

  const loadExample = (example) => {
    setInput(example.input);
    if(inputHeight<180)
    setInputHeight(180);
  };

  if (loading) {
    return (
      <div className="problem-container">
        <div className="loading">Loading problem...</div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="problem-container">
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
    <div className="problem-container">
      <header className="header">
        <Link to="/" className="back-btn">
          <ArrowLeft size={20} />
        </Link>
        <div className="header-title">
          <Code size={24} />
          <span>LET'S CODE</span>
        </div>
        
      </header>

      <div className="main-content">
        <div className={`left-panel ${isMobile && showLeftPanel ? 'show' : ''}`}>
          <div className="problem-header">
            <h1 className="problem-title">{problem.title}</h1>
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

          <div className="section">
            <h2 className="section-title">Description</h2>
            <p className="description">{problem.description}</p>
          </div>

          {problem.inputFormat && (
            <div className="format-section">
              <div className="format-item">
                <h3 className="section-title">Input Format</h3>
                <p>{problem.inputFormat}</p>
              </div>
              {problem.outputFormat && (
                <div className="format-item">
                  <h3 className="section-title">Output Format</h3>
                  <p>{problem.outputFormat}</p>
                </div>
              )}
            </div>
          )}

          {problem.examples && problem.examples.length > 0 && (
            <div className="section">
              <h2 className="section-title">Examples</h2>
              {problem.examples.slice(0, 3).map((example, index) => (
                <div key={index} className="exampl-container">
                  <div className="example-header">
                    <span className="example-title">Example {index + 1}</span>
                    <button 
                      className="load-btn"
                      onClick={() => loadExample(example)}
                    >
                      Load
                    </button>
                  </div>
                  <div className="example-content">
                    <div className="example-row">
                      <span className="example-label">Input:</span>
                      <div className="example-value">{example.input}</div>
                    </div>
                    <div className="example-row">
                      <span className="example-label">Output:</span>
                      <div className="example-value">{example.output}</div>
                    </div>
                    {example.explanation && (
                      <div className="example-row">
                        <span className="example-label">Explanation:</span>
                        <div className="example-value">{example.explanation}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {problem.constraints && problem.constraints.length > 0 && (
            <div className="section">
              <h2 className="section-title">Constraints</h2>
              <div className="constraints">
                <ul>
                  {problem.constraints.map((constraint, index) => (
                    <li key={index}>{constraint}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {problem.tags && problem.tags.length > 0 && (
            <div className="section">
              <h2 className="section-title">Tags</h2>
              <div className="tags">
                {problem.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {problem.solution && (
            <div className="section">
              <div className="hints-section">
                <div className="hints-header">
                  <h2 className="section-title">Hints</h2>
                  <button 
                    className="hints-toggle"
                    onClick={() => setShowHints(!showHints)}
                  >
                    <Lightbulb size={16} />
                    {showHints ? 'Hide Hints' : 'Show Hints'}
                  </button>
                </div>
                {showHints && (
                  <>
                    {getCurrentHints().map((hint, index) => (
                      <div key={index} className="hint-item">
                        <Lightbulb size={16} />
                        <span>{hint}</span>
                      </div>
                    ))}
                    {hasMoreHints() && (
                      <button 
                        className="next-hint-btn"
                        onClick={nextHint}
                      >
                        Next Hint
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="right-panel">
          {isMobile && (
          <button 
            className="mobile-toggle"
            onClick={() => setShowLeftPanel(!showLeftPanel)}
          >
            {showLeftPanel ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
          <div className="toolbar">
            
            <select 
              className="language-select"
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
            >
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

          <div className="editor-container">
            <CodeEditor 
              language={language}
              value={code}
              onChange={setCode}
            />
          </div>

          <div 
            className="drag-handle"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />

          <div className="input-output" style={{ height: inputHeight }}>
            <div className="input-section">
              <div className="section-header">Input</div>
              <textarea 
                className="input-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your test input here..."
              />
            </div>
            <div className="output-section">
              <div className="section-header">Output</div>
              <div className="output-content">{output}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Problem;