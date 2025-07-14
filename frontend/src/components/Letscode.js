import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trophy, Sparkles, Plus, Users } from 'lucide-react';
import '../styles/home.css';
import { useTheme } from '../context/themeContext';
import { useDataContext } from '../context/datacontext';
import Navbar from './Navbar';

export default function LetsCode() {
  const { theme } = useTheme();
  const { user, workingProblems, addWorkingProblem, removeWorkingProblem, teams } = useDataContext();
  
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch problems only once when component mounts
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const response = await fetch(process.env.REACT_APP_SERVER_LINK + '/problemlist');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const response_data = await response.json();
        let problemsArray = Array.isArray(response_data)
          ? response_data
          : response_data.data || [];

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
  }, []); // Remove workingProblems dependency

  // Memoize the function to check if a problem is marked
  const isProblemMarked = useCallback((problemId) => {
    return workingProblems.some(p => p._id === problemId);
  }, [workingProblems]);

  // Memoize the marked problems count
  const markedCount = React.useMemo(() => {
    return problems.filter(problem => isProblemMarked(problem.id)).length;
  }, [problems, isProblemMarked]);

  // Memoize the filtered problems with marked status
  const filteredProblems = React.useMemo(() => {
    return problems.filter(problem => {
      const matchesSearch = problem.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTopics = selectedTopics.length === 0 || selectedTopics.some(topic => problem.tags?.includes(topic));
      return matchesSearch && matchesTopics;
    }).map(problem => ({
      ...problem,
      isMarked: isProblemMarked(problem.id)
    }));
  }, [problems, searchTerm, selectedTopics, isProblemMarked]);

  const getUserInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || 'A';
  };

  const topicCounts = problems.length > 0 ? {
    'Array': problems.filter(p => p.tags?.includes('Array')).length,
    'String': problems.filter(p => p.tags?.includes('String')).length,
    'Hash Table': problems.filter(p => p.tags?.includes('Hash Table')).length,
    'Dynamic Programming': problems.filter(p => p.tags?.includes('Dynamic Programming')).length,
    'Math': problems.filter(p => p.tags?.includes('Math')).length,
    'Linked List': problems.filter(p => p.tags?.includes('Linked List')).length,
    'Two Pointers': problems.filter(p => p.tags?.includes('Two Pointers')).length,
    'Binary Search': problems.filter(p => p.tags?.includes('Binary Search')).length,
  } : {};

  const toggleProblemMark = useCallback((problemId) => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;

    const isMarked = isProblemMarked(problemId);

    if (isMarked) {
      removeWorkingProblem(problemId);
    } else {
      addWorkingProblem({
        _id: problem.id,
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        status: 'working'
      });
    }

    // No need to update local state since we're using memoized values
    // The component will re-render automatically when workingProblems changes
    return false;
  }, [problems, isProblemMarked, addWorkingProblem, removeWorkingProblem]);

  const toggleTopicFilter = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const getDifficultyConfig = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return { class: 'difficulty-easy' };
      case 'Medium': return { class: 'difficulty-medium' };
      case 'Hard': return { class: 'difficulty-hard' };
      default: return { class: 'difficulty-default' };
    }
  };

  if (loading) {
    return <div className="lc_loading-container">Loading problems...</div>;
  }

  if (error) {
    return (
      <div className="lc_error-container">
        <p>Error loading problems: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className={`lc-app-container ${theme}`}>
      <Navbar />

      <div className="lc-main-layout">
        {/* Sidebar */}
        <div className="lc-sidebar hide-scrollbar">
          <div className="lc-sidebar-content">
            {/* My Teams Section */}
            <div className="lc-sidebar-section">
              <h3 className="lc-sidebar-title">
                <Users className="lc-teams-icon" />
                <span>My Teams</span>
              </h3>
              <div className="lc-teams-list">
                {teams.length === 0 ? (
                  <p className="lc-no-teams">No teams yet</p>
                ) : (
                  teams.map((team) => (
                    <Link key={team._id} to={`/team/${team._id}`} className="lc-team-item">
                      <Users size={16} /> {team.name}
                    </Link>
                  ))
                )}
                <Link to="/teams" className="lc-add-team-link">
                  <Plus size={16} /> Manage Teams
                </Link>
              </div>
            </div>

            <div>
              <h3 className="lc-sidebar-title">
                <Trophy className="lc-trophy-icon" />
                <span>Working Problems</span>
              </h3>
              <div className="lc-working-problems-list">
                {workingProblems.map(problem => {
                  const diffConfig = getDifficultyConfig(problem.difficulty);
                  return (
                    <Link key={problem._id} to={`/problem/${problem._id}`} className="lc-working-problem-link">
                      <div className="lc-working-problem-card">
                        <div className="working-problem-header">
                          <div className="working-problem-info">
                            <div className="working-indicator"></div>
                            <span>{problem._id}. {problem.title}</span>
                          </div>
                        </div>
                        <div className="working-problem-footer">
                          <span className={`difficulty-badge ${diffConfig.class}`}>{problem.difficulty}</span>
                          <span>{problem.acceptance}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {workingProblems.length === 0 && <p className="lc-no-working-problems">No problems currently being worked on</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lc-main-content">
          <div className="content-header">
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
                  <span>Progress: {markedCount}/{problems.length} marked</span>
                </div>
              </div>
            </div>

            {selectedTopics.length > 0 && (
              <div className="lc-active-filters">
                <span>Filtered by:</span>
                {selectedTopics.map(topic => (
                  <span key={topic} className="lc-filter-tag">
                    {topic}
                    <button onClick={() => toggleTopicFilter(topic)}>×</button>
                  </span>
                ))}
                <button onClick={() => setSelectedTopics([])} className="lc-clear-filters">Clear all</button>
              </div>
            )}
          </div>

          <div className="lc-problems-list">
            {filteredProblems.map(problem => {
              const diffConfig = getDifficultyConfig(problem.difficulty);
              const isMarked = problem.isMarked;
              return (
                <Link key={problem.id} to={`/problem/${problem.id}`} className="lc-problem-link">
                  <div className="lc-problem-card">
                    <div className="lc-problem-left">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleProblemMark(problem.id);
                          return false;
                        }}
                        className={`lc-problem-checkbox ${isMarked ? 'lc-problem-checkbox-active' : ''}`}
                      >
                        {isMarked && <div className="lc-checkbox-dot"></div>}
                      </button>
                      <div className="lc-problem-title-container">
                        <span className="lc-problem-title">{problem.id}. {problem.title}</span>
                      </div>
                    </div>
                    <div className="lc-problem-right">
                      <div className="lc-acceptance-info">
                        <div className="lc-acceptance-label">Acceptance</div>
                        <div className="lc-acceptance-value">{problem.acceptance}</div>
                      </div>
                      <div className={`lc-difficulty-badge ${diffConfig.class}`}>
                        {problem.difficulty}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {filteredProblems.length === 0 && <p className="lc-no-problems">No problems match your current filters.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}