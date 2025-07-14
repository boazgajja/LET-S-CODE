import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../context/datacontext';
import '../styles/AddProblem.css';
import axios from 'axios';

const AddProblem = () => {
  const { user } = useDataContext();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
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

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/');
      return;
    }
    
    // Fetch user's teams
    const fetchTeams = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_LINK}/api/teams`, {
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
    
    fetchTeams();
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProblem(prev => ({
      ...prev,
      [name]: value
    }));
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
        constraints: problem.constraints.split('\n').filter(c => c.trim() !== ''),
        tags: problem.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      };
      
      // Submit the problem - ensure we're using the correct URL
      const response = await axios.post(`http://localhost:3001/api/problems`, formattedProblem, {
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
        
        // Redirect to the problem list after a delay
        setTimeout(() => {
          navigate('/problem');
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
          Problem added successfully! Redirecting...
        </div>
      )}
      
      {error && (
        <div className="ap_error-message">
          {error}
        </div>
      )}
      
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
        
        {/* Update all other form-group classes to ap_form-group */}
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
    </div>
  );
};

export default AddProblem;