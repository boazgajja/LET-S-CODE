import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Trophy, Sparkles, Plus, Users, Calendar, CheckCircle } from 'lucide-react';
import axios from 'axios';
import '../styles/home.css';
import { useTheme } from '../context/themeContext';
import { useDataContext } from '../context/datacontext';
import Navbar from './Navbar';

// Helper component for common problem card inner content
function ProblemCardInner({ problem, showCalendar, daysAgo, isSolved }) {
  return (
    <div className="lc-problem-title-container">
      <span className="lc-problem-title">
        {problem.id ? `${problem.id}. ` : ''}{problem.title || 'Untitled Problem'}
      </span>
      {isSolved && (
        <span className="lc-problem-solved" style={{ color: 'var(--success)', marginLeft: '8px' }}>
          ✓ Done
        </span>
      )}
      {showCalendar && (
        <div className="home-problem-stats">
          <span className="days-ago">
            <Calendar size={14} /> {daysAgo} days ago
          </span>
          {problem.solvedBy && Array.isArray(problem.solvedBy) && (
            <span className="solved-count">{"     "} {problem.solvedBy.length} solved</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function LetsCode() {
  const { theme } = useTheme();
  const location = useLocation();
  const {
    user,
    workingProblems,
    fetchWorkingProblems,
    addWorkingProblem,
    removeWorkingProblem,
    teams,
    fetchTeams
  } = useDataContext();

  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [problems, setProblems] = useState([]);
  const [userAddedProblems, setUserAddedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine if we're on home page
  const isHomePage = location.pathname === '/home' || location.pathname === '/';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (isHomePage) {
          await fetchUserAddedProblems();
        } else {
          await fetchProblems();
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
    fetchData();
    fetchWorkingProblems();
  }, [isHomePage]);

  const fetchProblems = async () => {
    const response = await fetch(process.env.REACT_APP_SERVER_LINK + '/problemlist');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const response_data = await response.json();
    let problemsArray = Array.isArray(response_data) ? response_data : response_data.data || [];
    console.log('Fetched problems:', problemsArray);
    setProblems(problemsArray);
  };

  const fetchUserAddedProblems = async () => {
    console.log('Fetching user-added problems...');
    const token = localStorage.getItem('token');
    console.log('Using token:', token ? 'Token exists' : 'No token');
    const response = await axios.get(`${process.env.REACT_APP_SERVER_LINK}/problems/pending`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('User added problems response:', response.data);
    if (response.data.success) {
      setUserAddedProblems(response.data.data);
    }
  };

  // Helper function to calculate days ago
  const getDaysAgo = (dateString) => {
    if (!dateString) return 0;
    const problemDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - problemDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if problem is marked - with null safety
  const isProblemMarked = useCallback(
    (problemId) => {
      if (!problemId || !workingProblems) return false;
      return workingProblems.some((wp) => {
        return wp && wp.id && wp.id === problemId;
      });
    },
    [workingProblems]
  );

  const markedCount = useMemo(
    () => {
      const currentProblems = isHomePage ? userAddedProblems : problems;
      if (!currentProblems || currentProblems.length === 0) return 0;
      return currentProblems.filter((problem) => problem && problem.id && isProblemMarked(problem.id)).length;
    },
    [isHomePage ? userAddedProblems : problems, isProblemMarked]
  );

  // Fixed isProblemSolved function with proper null checks
  const isProblemSolved = useCallback(
    (problemId) => {
      if (!problemId) return false;
      if (!user || !user.stats || !user.stats.solvedProblems) return false;
      if (!Array.isArray(user.stats.solvedProblems)) return false;
      return user.stats.solvedProblems
        .filter(id => id !== null && id !== undefined)
        .some(id => {
          try {
            return id.toString() === problemId.toString();
          } catch (error) {
            console.warn('Error comparing problem IDs:', { id, problemId, error });
            return false;
          }
        });
    },
    [user]
  );

  const filteredProblems = useMemo(
    () => {
      const currentProblems = isHomePage ? userAddedProblems : problems;
      if (!currentProblems || !Array.isArray(currentProblems)) return [];
      return currentProblems
        .filter((problem) => {
          if (!problem) return false;
          const matchesSearch = problem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
          const matchesTopics = selectedTopics.length === 0 ||
            (problem.tags && Array.isArray(problem.tags) && selectedTopics.some(topic => problem.tags.includes(topic)));
          return matchesSearch && matchesTopics;
        })
        .map((problem) => ({
          ...problem,
          isMarked: problem.id ? isProblemMarked(problem.id) : false,
          isSolved: problem.id ? isProblemSolved(problem.id) : false,
        }));
    },
    [isHomePage ? userAddedProblems : problems, searchTerm, selectedTopics, isProblemMarked, isProblemSolved]
  );

  const getUserInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || 'A';
  };

  const topicCounts = useMemo(() => {
    const currentProblems = isHomePage ? userAddedProblems : problems;
    if (!currentProblems || currentProblems.length === 0) return {};
    return {
      Array: currentProblems.filter(p => p?.tags?.includes('Array')).length,
      String: currentProblems.filter(p => p?.tags?.includes('String')).length,
      'Hash Table': currentProblems.filter(p => p?.tags?.includes('Hash Table')).length,
      'Dynamic Programming': currentProblems.filter(p => p?.tags?.includes('Dynamic Programming')).length,
      Math: currentProblems.filter(p => p?.tags?.includes('Math')).length,
      'Linked List': currentProblems.filter(p => p?.tags?.includes('Linked List')).length,
      'Two Pointers': currentProblems.filter(p => p?.tags?.includes('Two Pointers')).length,
      'Binary Search': currentProblems.filter(p => p?.tags?.includes('Binary Search')).length,
    };
  }, [isHomePage ? userAddedProblems : problems]);

  // Toggle problem mark with better error handling
  const toggleProblemMark = useCallback(
    async (problemId) => {
      try {
        if (!problemId) {
          console.error('Problem ID is required');
          return false;
        }
        const currentProblems = isHomePage ? userAddedProblems : problems;
        const problem = currentProblems.find((p) => p && p.id === problemId);
        if (!problem) {
          console.error('Problem not found:', problemId);
          return false;
        }
        const isMarked = isProblemMarked(problemId);
        console.log(`Toggling problem ${problemId}, currently marked:`, isMarked);
        if (isMarked) {
          await removeWorkingProblem(problemId);
        } else {
          await addWorkingProblem({
            id: problem.id,
            title: problem.title || 'Untitled Problem',
            difficulty: problem.difficulty || 'Medium',
            acceptance: problem.acceptance || 'N/A',
            status: 'working',
          });
        }
        return false;
      } catch (error) {
        console.error('Error toggling problem mark:', error);
        return false;
      }
    },
    [isHomePage ? userAddedProblems : problems, isProblemMarked, addWorkingProblem, removeWorkingProblem]
  );

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
                  teams.map((team) =>
                    team.team && team.team._id && team.team.name ? (
                      <Link key={team._id} to={`/teams/${team.team._id}`} className="lc-team-item">
                        <pre><Users size={16} /> {team.team.name}</pre>
                        {team.team.joinRequests && team.team.joinRequests.length > 0 && (
                          <span className="lc-join-request-badge">
                            {team.team.joinRequests.length}
                          </span>
                        )}
                      </Link>
                    ) : null
                  )
                )}
                <Link to="/teams" className="lc-add-team-link">
                  <Plus size={16} /> Manage Teams
                </Link>
              </div>
            </div>

            {/* Working Problems Section */}
            <div>
              <h3 className="lc-sidebar-title">
                <Trophy className="lc-trophy-icon" />
                <span>Working Problems</span>
              </h3>
              <div className="lc-working-problems-list">
                {workingProblems.map((problem) => {
                  const diffConfig = getDifficultyConfig(problem.difficulty);
                  return (
                    <Link 
                      key={problem._id} 
                      to={`/problem/${problem.problemRef?._id || problem._id}`} 
                      className="lc-working-problem-link"
                    >
                      <div className="lc-working-problem-card">
                        <div className="working-problem-header">
                          <div className="working-problem-info">
                            <div className="working-indicator"></div>
                            <span>{problem.id}. {problem.title}</span>
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
                {workingProblems.length === 0 && (
                  <p className="lc-no-working-problems">No problems currently being worked on</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lc-main-content">
          <div className="content-header">
            {isHomePage && (
              <div className="home-page-header">
                <h2 className="home-title">LetsCode User's Contributed Problems</h2>
                <p className="home-subtitle"></p>
              </div>
            )}
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
                    placeholder={isHomePage ? "Search your problems..." : "Search problems..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              <div className="controls-section">
                <div className="progress-count">
                  <Sparkles className="sparkles-icon" />
                  <span>Progress: {markedCount}/{isHomePage ? userAddedProblems.length : problems.length} marked</span>
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
            {filteredProblems.map((problem) => {
              if (!problem || !problem._id) return null;
              
              const diffConfig = getDifficultyConfig(problem.difficulty);
              const isMarked = problem.isMarked;
              const showCalendar = isHomePage;
              const daysAgo = showCalendar ? getDaysAgo(problem.createdAt || problem.dateAdded) : null;

              return (
                <Link
                  key={problem._id}
                  to={
                    isHomePage
                      ? `/problems/pending/${problem._id}`
                      : `/problem/${problem.problemRef?._id || problem._id}`
                  }
                  className="lc-problem-link"
                >
                  <div className="lc-problem-card">
                    {/* Checkbox and title (only on /problems, not in /home) */}
                    {!isHomePage && (
                      <div className="lc-problem-left">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleProblemMark(problem.id);
                          }}
                          className={`lc-problem-checkbox ${isMarked ? 'lc-problem-checkbox-active' : ''}`}
                        >
                          {isMarked && <div className="lc-checkbox-dot"></div>}
                        </button>
                        <ProblemCardInner
                          problem={problem}
                          showCalendar={false}
                          daysAgo={daysAgo}
                          isSolved={problem.isSolved}
                        />
                      </div>
                    )}
                    {/* Title and stats ONLY on /home */}
                    {isHomePage && (
                      <div className="lc-problem-left">
                        <ProblemCardInner
                          problem={problem}
                          showCalendar={true}
                          daysAgo={daysAgo}
                          isSolved={problem.isSolved}
                        />
                      </div>
                    )}
                    {/* Right side (acceptance, difficulty) is always shown */}
                    <div className="lc-problem-right">
                      <div className="lc-acceptance-info">
                        <div className="lc-acceptance-label">Acceptance</div>
                        <div className="lc-acceptance-value">{problem.acceptance || 'N/A'}</div>
                      </div>
                      <div className={`lc-difficulty-badge ${diffConfig.class}`}>
                        {problem.difficulty || 'Medium'}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {filteredProblems.length === 0 && (
              <p className="lc-no-problems">
                {isHomePage
                  ? "You haven't added any problems yet."
                  : "No problems match your current filters."
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
