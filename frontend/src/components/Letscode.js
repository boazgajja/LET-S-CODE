import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Code, Database, Shell, Zap, Brain, Trophy, Check, Sparkles, Plus } from 'lucide-react';
import '../home.css';

export default function LetsCode() {
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch problems from API
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://let-s-code.onrender.com/api/problemlist');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
       const response_data = await response.json();
console.log('API Response:', response_data);

// Extract the problems array from the response
let problemsArray;
if (Array.isArray(response_data)) {
  // If response is directly an array
  problemsArray = response_data;
} else if (response_data.data && Array.isArray(response_data.data)) {
  // If response has a 'data' property containing the array
  problemsArray = response_data.data;
} else {
  throw new Error(`Expected array or object with data property, but received: ${JSON.stringify(response_data)}`);
}

        console.log('Problems array:', problemsArray);
        console.log('Array length:', problemsArray.length);

        setProblems(problemsArray);
        setError(null);
      } catch (err) {
        console.error('Error fetching problems:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Calculate topic counts dynamically based on fetched problems
  const topicCounts = problems.length > 0 ? {
    'Array': problems.filter(p => p.tags && p.tags.includes('Array')).length,
    'String': problems.filter(p => p.tags && p.tags.includes('String')).length,
    'Hash Table': problems.filter(p => p.tags && p.tags.includes('Hash Table')).length,
    'Dynamic Programming': problems.filter(p => p.tags && p.tags.includes('Dynamic Programming')).length,
    'Math': problems.filter(p => p.tags && p.tags.includes('Math')).length,
    'Linked List': problems.filter(p => p.tags && p.tags.includes('Linked List')).length,
    'Two Pointers': problems.filter(p => p.tags && p.tags.includes('Two Pointers')).length,
    'Binary Search': problems.filter(p => p.tags && p.tags.includes('Binary Search')).length,
  } : {};

  // Function to toggle problem mark
  const toggleProblemMark = (problemId) => {
    setProblems(prevProblems => 
      prevProblems.map(problem => 
        problem.id === problemId 
          ? { ...problem, isMarked: !problem.isMarked }
          : problem
      )
    );
  };

  const toggleTopicFilter = (topic) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      } else {
        return [...prev, topic];
      }
    });
  };

  const getDifficultyConfig = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return { class: 'difficulty-easy' };
      case 'Medium': return { class: 'difficulty-medium' };
      case 'Hard': return { class: 'difficulty-hard' };
      default: return { class: 'difficulty-default' };
    }
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title && problem.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopics = selectedTopics.length === 0 || (problem.tags && selectedTopics.some(topic => problem.tags.includes(topic)));
    return matchesSearch && matchesTopics;
  });

  const workingProblems = problems.filter(p => p.isMarked && !p.solved);
  const markedCount = problems.filter(p => p.isMarked).length;

  // Loading state
  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px'
        }}>
          Loading problems...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="app-container">
        <div className="error-container" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: 'red'
        }}>
          <p>Error loading problems: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-flex">
            <div className="nav-left">
              <div className="logo-section">
                <div className="logo-icon">
                  <Code className="logo-code-icon" />
                </div>
                <span className="logo-text">
                  LET'S CODE
                </span>
              </div>
              <div className="nav-links">
                <button className="nav-link nav-link-active">
                  Problems
                </button>
                <button className="nav-link nav-link-add">
                  <Plus className="plus-icon" />
                  <span>Add Problem</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="main-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-content">
            <div>
              <h3 className="sidebar-title">
                <Trophy className="trophy-icon" />
                <span>Working Problems</span>
              </h3>
              <div className="working-problems-list">
                {workingProblems.map(problem => {
                  const diffConfig = getDifficultyConfig(problem.difficulty);
                  return (
                   <>
                    <Link key={problem.id} to={`/problem/${problem.id}`} className="working-problem-link">
                      <div className="working-problem-card">
                        <div className="working-problem-header">
                          <div className="working-problem-info">
                            <div className="working-indicator"></div>
                            <span className="working-problem-title">{problem.id}. {problem.title}</span>
                          </div>
                        </div>
                        <div className="working-problem-footer">
                          <span className={`difficulty-badge ${diffConfig.class}`}>
                            {problem.difficulty}
                          </span>
                          <span className="acceptance-rate">{problem.acceptance}</span>
                        </div>
                      </div>
                    </Link>
                    </>
                  );
                })}
                {workingProblems.length === 0 && (
                  <p className="no-working-problems">No problems currently being worked on</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="content-header">
            {/* Topic Tags */}
            <div className="topic-tags">
              {Object.entries(topicCounts).map(([topic, count]) => (
                <button 
                  key={topic} 
                  onClick={() => toggleTopicFilter(topic)}
                  className={`topic-tag ${selectedTopics.includes(topic) ? 'topic-tag-active' : ''}`}
                >
                  <span>{topic}</span>
                  <span className="topic-count">{count}</span>
                </button>
              ))}
            </div>

            {/* Search and Controls */}
            <div className="search-controls">
              <div className="search-section">
                <div className="search-input-container">
                  <Search className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search problems..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              <div className="controls-section">
                <div className="progress-count">
                  <Sparkles className="sparkles-icon" />
                  <span className="count-text">Progress: {markedCount}/{problems.length} marked</span>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {selectedTopics.length > 0 && (
              <div className="active-filters">
                <div className="filter-info">
                  <span className="filter-label">Filtered by:</span>
                  {selectedTopics.map(topic => (
                    <span key={topic} className="filter-tag">
                      <span>{topic}</span>
                      <button 
                        onClick={() => toggleTopicFilter(topic)}
                        className="filter-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button 
                    onClick={() => setSelectedTopics([])}
                    className="clear-filters"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Problems List */}
          <div className="problems-list">
            {filteredProblems.map((problem) => {
              const diffConfig = getDifficultyConfig(problem.difficulty);
              const isMarked = problem.isMarked;
              return (
                <>
                <Link key={problem.id} to={`/problem/${problem.id}`} className="problem-link">
                  <div className="problem-card">
                    <div className="problem-left">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleProblemMark(problem.id);
                        }}
                        className={`problem-checkbox ${isMarked ? 'problem-checkbox-active' : ''}`}
                      >
                        {isMarked && <div className="checkbox-dot"></div>}
                      </button>
                      <div className="problem-title-container">
                        <span className="problem-title">{problem.id}. {problem.title}</span>
                      </div>
                    </div>
                    <div className="problem-right">
                      <div className="acceptance-info">
                        <div className="acceptance-label">Acceptance</div>
                        <div className="acceptance-value">{problem.acceptance}</div>
                      </div>
                      <div className={`difficulty-badge ${diffConfig.class}`}>
                        <span className="difficulty-text">
                          {problem.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                </>
              );
            })}
            {filteredProblems.length === 0 && problems.length > 0 && (
              <div className="no-problems" style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666',
                fontSize: '16px'
              }}>
                No problems match your current filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}