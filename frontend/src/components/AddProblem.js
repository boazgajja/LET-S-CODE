import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../context/datacontext';
import '../styles/AddProblem.css';
import axios from 'axios';
import { Plus } from 'lucide-react'; // Import Plus icon

const AddProblem = () => {
  const { user } = useDataContext();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [userAddedProblems, setUserAddedProblems] = useState([]);
  
  // Fix: Change from const { problem } = useState to const [problem, setProblem] = useState
  const [problem, setProblem] = useState({
    title: '',
    difficulty: 'Easy',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    tags: '',
    examples: [{ input: '', output: '', explanation: '' }],
    testCases: [{ input: '', output: '' }],
    solution: { hint1: '', hint2: '', hint3: '' }
  });

  // Sample JSON template based on the Problem model
  const sampleJsonTemplate = {
    title: "Sample Problem Title",
    difficulty: "Easy", // Options: Easy, Medium, Hard
    description: "Detailed problem description goes here...",
    inputFormat: "Description of input format...",
    outputFormat: "Description of output format...",
    constraints: ["1 ≤ n ≤ 10^5", "1 ≤ arr[i] ≤ 10^9"],
    tags: ["arrays", "sorting", "algorithms"],
    examples: [
      {
        input: "Example input 1",
        output: "Example output 1",
        explanation: "Explanation for example 1"
      }
    ],
    testCases: [
      {
        input: "Test case input 1",
        output: "Expected output 1"
      }
    ],
    solution: {
      hint1: "First hint for solving the problem",
      hint2: "Second hint for solving the problem",
      hint3: "Third hint for solving the problem"
    }
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/');
      return;
    }
    
    // Fetch user's teams
    const fetchTeams = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_LINK}/teams`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          setTeams(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      }
    };
    
    // Fetch problems added by the user
    const fetchUserAddedProblems = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_LINK}/problems/user-added`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          setUserAddedProblems(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching user added problems:', err);
      }
    };
    
    fetchTeams();
    fetchUserAddedProblems();
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProblem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleJsonInputChange = (e) => {
    setJsonInput(e.target.value);
  };

  const parseJsonInput = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      
      // Format the constraints and tags if they're strings
      if (typeof parsedJson.constraints === 'string') {
        parsedJson.constraints = parsedJson.constraints.split('\n').filter(c => c.trim() !== '');
      }
      
      if (typeof parsedJson.tags === 'string') {
        parsedJson.tags = parsedJson.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      }
      
      // Ensure examples and testCases are arrays
      if (!Array.isArray(parsedJson.examples)) {
        parsedJson.examples = [{ input: '', output: '', explanation: '' }];
      }
      
      if (!Array.isArray(parsedJson.testCases)) {
        parsedJson.testCases = [{ input: '', output: '' }];
      }
      
      // Ensure solution object exists
      if (!parsedJson.solution) {
        parsedJson.solution = { hint1: '', hint2: '', hint3: '' };
      }
      
      // Set the problem state with the parsed JSON
      setProblem(parsedJson);
      setJsonMode(false); // Switch back to form mode
      setError(null);
    } catch (err) {
      setError('Invalid JSON format. Please check your input.');
    }
  };

  const copyJsonTemplate = () => {
    setJsonInput(JSON.stringify(sampleJsonTemplate, null, 2));
  };

  const handleNestedInputChange = (e, index, field, subfield) => {
    const { value } = e.target;
    setProblem(prev => {
      const updated = { ...prev };
      updated[field][index][subfield] = value;
      return updated;
    });
  };

  const handleSolutionChange = (e, hint) => {
    const { value } = e.target;
    setProblem(prev => ({
      ...prev,
      solution: {
        ...prev.solution,
        [hint]: value
      }
    }));
  };

  const addExample = () => {
    setProblem(prev => ({
      ...prev,
      examples: [...prev.examples, { input: '', output: '', explanation: '' }]
    }));
  };

  const removeExample = (index) => {
    setProblem(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const addTestCase = () => {
    setProblem(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', output: '' }]
    }));
  };

  const removeTestCase = (index) => {
    setProblem(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Format the problem data
      const formattedProblem = {
        ...problem,
        id: Date.now().toString(), // Generate a unique ID
        slug: problem.title.toLowerCase().replace(/\s+/g, '-'),
        constraints: typeof problem.constraints === 'string' 
          ? problem.constraints.split('\n').filter(c => c.trim() !== '') 
          : problem.constraints,
        tags: typeof problem.tags === 'string' 
          ? problem.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') 
          : problem.tags
      };
      
      // Submit the problem - using environment variable for consistency
      const response = await axios.post(`${process.env.REACT_APP_SERVER_LINK}/problems`, formattedProblem, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setSuccess(true);
        
        // If a team is selected, add the problem to the team
        if (selectedTeam) {
          await axios.post(`${process.env.REACT_APP_SERVER_LINK}/api/teams/${selectedTeam}/problems`, {
            problemId: response.data.data._id
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
        }
        
        // Reset form after successful submission
        setProblem({
          title: '',
          difficulty: 'Easy',
          description: '',
          inputFormat: '',
          outputFormat: '',
          constraints: '',
          tags: '',
          examples: [{ input: '', output: '', explanation: '' }],
          testCases: [{ input: '', output: '' }],
          solution: { hint1: '', hint2: '', hint3: '' }
        });
        
        // Refresh the user added problems list
        const updatedProblemsResponse = await axios.get(`${process.env.REACT_APP_SERVER_LINK}/problems/user-added`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (updatedProblemsResponse.data.success) {
          setUserAddedProblems(updatedProblemsResponse.data.data);
        }
        
        // No need to redirect, just show success message
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error adding problem:', err);
      setError(err.response?.data?.message || 'Error adding problem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap_container">
      <h1>Add New Problem</h1>
      
      {success && (
        <div className="ap_success-message">
          Problem added successfully!
        </div>
      )}
      
      {error && (
        <div className="ap_error-message">
          {error}
        </div>
      )}
      
      <div className="ap_mode-toggle">
        <button 
          className={`ap_mode-btn ${!jsonMode ? 'active' : ''}`}
          onClick={() => setJsonMode(false)}
        >
          Form Mode
        </button>
        <button 
          className={`ap_mode-btn ${jsonMode ? 'active' : ''}`}
          onClick={() => setJsonMode(true)}
        >
          JSON Mode
        </button>
      </div>
      
      {/* Display user added problems */}
      {userAddedProblems.length > 0 && (
        <div className="ap_user-problems-section">
          <h3>Your Added Problems</h3>
          <div className="ap_user-problems-list">
            {userAddedProblems.map(problem => {
              const solvedCount = problem.solvedBy ? problem.solvedBy.length : 0;
              const addedDate = new Date(problem.createdAt);
              const currentDate = new Date();
              const monthDiff = currentDate.getMonth() - addedDate.getMonth() + 
                (12 * (currentDate.getFullYear() - addedDate.getFullYear()));
              const willBeRemoved = solvedCount < 20 && monthDiff >= 1;
              
              return (
                <div key={problem._id} className="ap_user-problem-card">
                  <div className="ap_user-problem-info">
                    <h4>{problem.title}</h4>
                    <div className="ap_user-problem-meta">
                      <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
                        {problem.difficulty}
                      </span>
                      <span className="ap_solved-count">
                        Solved by: {solvedCount} users
                      </span>
                      {willBeRemoved && (
                        <span className="ap_removal-warning">
                          Will be removed soon (needs 20+ solves within a month)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Rest of the existing form code */}
      {jsonMode ? (
        <div className="ap_json-container">
          <div className="ap_json-header">
            <h3>JSON Input</h3>
            <button 
              type="button" 
              className="ap_template-btn"
              onClick={copyJsonTemplate}
            >
              Load Template
            </button>
          </div>
          
          <div className="ap_form-group">
            <textarea 
              className="ap_json-input"
              value={jsonInput}
              onChange={handleJsonInputChange}
              placeholder="Paste your problem JSON here..."
              rows={20}
            />
          </div>
          
          <div className="ap_json-actions">
            <button 
              type="button" 
              className="ap_parse-btn"
              onClick={parseJsonInput}
            >
              Parse JSON
            </button>
          </div>
          
          <div className="ap_json-help">
            <h4>Problem Schema</h4>
            <pre className="ap_schema-display">
              {JSON.stringify({
                id: "String (required, unique)",
                slug: "String (required, unique)",
                title: "String (required)",
                difficulty: "String (required, enum: ['Easy', 'Medium', 'Hard'])",
                description: "String (required)",
                inputFormat: "String (required)",
                outputFormat: "String (required)",
                examples: [{
                  input: "String",
                  output: "String",
                  explanation: "String"
                }],
                constraints: ["String"],
                tags: ["String"],
                testCases: [{
                  input: "String",
                  output: "String"
                }],
                solution: {
                  hint1: "String",
                  hint2: "String",
                  hint3: "String"
                }
              }, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="ap_form-group">
            <label htmlFor="title">Title</label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              value={problem.title} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="ap_form-group">
            <label htmlFor="difficulty">Difficulty</label>
            <select 
              id="difficulty" 
              name="difficulty" 
              value={problem.difficulty} 
              onChange={handleInputChange} 
              required
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          
          <div className="ap_form-group">
            <label htmlFor="description">Description</label>
            <textarea 
              id="description" 
              name="description" 
              value={problem.description} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="ap_form-group">
            <label htmlFor="inputFormat">Input Format</label>
            <textarea 
              id="inputFormat" 
              name="inputFormat" 
              value={problem.inputFormat} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="ap_form-group">
            <label htmlFor="outputFormat">Output Format</label>
            <textarea 
              id="outputFormat" 
              name="outputFormat" 
              value={problem.outputFormat} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="ap_form-group">
            <label htmlFor="constraints">Constraints (one per line)</label>
            <textarea 
              id="constraints" 
              name="constraints" 
              value={problem.constraints} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="ap_form-group">
            <label htmlFor="tags">Tags (comma separated)</label>
            <input 
              type="text" 
              id="tags" 
              name="tags" 
              value={problem.tags} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="ap_form-section">
            <h3>Examples</h3>
            {problem.examples.map((example, index) => (
              <div key={index} className="ap_example-container">
                <h4>Example {index + 1}</h4>
                <div className="ap_form-group">
                  <label>Input</label>
                  <textarea 
                    value={example.input} 
                    onChange={(e) => handleNestedInputChange(e, index, 'examples', 'input')} 
                  />
                </div>
                <div className="ap_form-group">
                  <label>Output</label>
                  <textarea 
                    value={example.output} 
                    onChange={(e) => handleNestedInputChange(e, index, 'examples', 'output')} 
                  />
                </div>
                <div className="ap_form-group">
                  <label>Explanation</label>
                  <textarea 
                    value={example.explanation} 
                    onChange={(e) => handleNestedInputChange(e, index, 'examples', 'explanation')} 
                  />
                </div>
                {index > 0 && (
                  <button 
                    type="button" 
                    className="ap_remove-btn" 
                    onClick={() => removeExample(index)}
                  >
                    Remove Example
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              className="ap_add-btn" 
              onClick={addExample}
            >
              Add Example
            </button>
          </div>
          
          <div className="ap_form-section">
            <h3>Test Cases</h3>
            {problem.testCases.map((testCase, index) => (
              <div key={index} className="ap_test-case-container">
                <h4>Test Case {index + 1}</h4>
                <div className="ap_form-group">
                  <label>Input</label>
                  <textarea 
                    value={testCase.input} 
                    onChange={(e) => handleNestedInputChange(e, index, 'testCases', 'input')} 
                  />
                </div>
                <div className="ap_form-group">
                  <label>Output</label>
                  <textarea 
                    value={testCase.output} 
                    onChange={(e) => handleNestedInputChange(e, index, 'testCases', 'output')} 
                  />
                </div>
                {index > 0 && (
                  <button 
                    type="button" 
                    className="ap_remove-btn" 
                    onClick={() => removeTestCase(index)}
                  >
                    Remove Test Case
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              className="ap_add-btn" 
              onClick={addTestCase}
            >
              Add Test Case
            </button>
          </div>
          
          <div className="ap_form-section">
            <h3>Solution Hints</h3>
            <div className="ap_form-group">
              <label htmlFor="hint1">Hint 1</label>
              <textarea 
                id="hint1" 
                value={problem.solution.hint1} 
                onChange={(e) => handleSolutionChange(e, 'hint1')} 
              />
            </div>
            <div className="ap_form-group">
              <label htmlFor="hint2">Hint 2</label>
              <textarea 
                id="hint2" 
                value={problem.solution.hint2} 
                onChange={(e) => handleSolutionChange(e, 'hint2')} 
              />
            </div>
            <div className="ap_form-group">
              <label htmlFor="hint3">Hint 3</label>
              <textarea 
                id="hint3" 
                value={problem.solution.hint3} 
                onChange={(e) => handleSolutionChange(e, 'hint3')} 
              />
            </div>
          </div>
          
          {teams.length > 0 && (
            <div className="ap_form-group">
              <label htmlFor="team">Add to Team (Optional)</label>
              <select 
                id="team" 
                value={selectedTeam} 
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">None</option>
                {teams.map(team => (
                  <option key={team.team._id} value={team.team._id}>
                    {team.team.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="ap_form-actions">
            <button 
              type="button" 
              className="ap_cancel-btn" 
              onClick={() => navigate('/problem')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="ap_submit-btn" 
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Problem'}
            </button>
          </div>
        </form>
      )}
      
      {/* Add floating action button */}
      <div 
        className="ap_floating-action-button"
        onClick={() => navigate('/add-problem')}
      >
        <Plus size={24} />
      </div>
    </div>
  );
};

export default AddProblem;