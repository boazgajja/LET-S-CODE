import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Code, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useDataContext } from '../context/datacontext';
import '../styles/Submissions.css';
import Navbar from './Navbar';

const Submissions = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { user, fetchWithTokenRefresh } = useDataContext();
  const [submission, setSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  // Helper function to check if submission is valid
  const isValidSubmission = (sub) => {
    return sub && sub.problem && sub.problem._id && sub.problem.title;
  };

  // Helper function to check if problem is deleted
  const isProblemDeleted = (sub) => {
    return sub && sub.problem && sub.problem.isDeleted;
  };

  // Fetch submissions with pagination
  const fetchSubmissions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/submissions/user/${user._id || user.userId}?page=${page}&limit=${pageSize}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSubmissions(data.data.submissions || []);
        // console.log(data.data.submissions);

        setTotalPages(data.data.pagination.totalPages || 1);
      } else {
        setError(data.message || 'Failed to fetch submissions');
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Error fetching submissions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific submission by ID
  const fetchSubmissionById = async () => {
    if (!submissionId) return;
    
    try {
      setLoading(true);
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/submissions/${submissionId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSubmission(data.data);
      } else {
        setError(data.message || 'Failed to fetch submission');
      }
    } catch (err) {
      console.error('Error fetching submission:', err);
      setError('Error fetching submission');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionId) {
      fetchSubmissionById();
    } else {
      fetchSubmissions();
    }
  }, [submissionId, page, user]);

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    return status === 'correct' ? 'var(--success)' : 'var(--danger)';
  };

  const getStatusIcon = (status) => {
    return status === 'correct' ? <CheckCircle size={16} /> : <XCircle size={16} />;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="s_container">
          <div className="s_loading">Loading submissions...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="s_container">
          <div className="s_back-link">
            <Link to="/problem" className="s_btn s_btn-primary">
            Go to Problems
          </Link>
          </div>
          <div className="s_error">{error}</div>
          <Link to="/problem" className="s_btn s_btn-primary">
            Go to Problems
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="s_container">
        {submissionId ? (
          // Single submission view
          submission ? (
            <div className="s_submission-detail">
              <div className="s_back-link">
                <Link to="/submissions">
                  <ArrowLeft size={16} /> Back to all submissions
                </Link>
              </div>
              <h2>Submission Details</h2>
              <div className="s_detail-card">
                <div className="s_detail-header">
                  <h3>
                    {submission.problem && !submission.problem.isDeleted ? (
                      <Link to={`/problem/${submission.problem._id}`}>
                        {submission.problem.title}
                      </Link>
                    ) : (
                      <span className="s_deleted-problem">
                        {submission.problem?.title || `Problem ID: ${submission.problem?._id}`}
                        {submission.problem?.isDeleted && ' (Deleted)'}
                      </span>
                    )}
                  </h3>
                  <span 
                    className="s_status-badge" 
                    style={{ backgroundColor: getStatusColor(submission.status) }}
                  >
                    {getStatusIcon(submission.status)}
                    {submission.status === 'correct' ? 'Accepted' : 'Wrong Answer'}
                  </span>
                </div>
                <div className="s_detail-meta">
                  <span><Calendar size={14} /> Submitted: {formatDate(submission.createdAt)}</span>
                  {submission.problem?.difficulty && (
                    <span>Difficulty: <strong>{submission.problem.difficulty}</strong></span>
                  )}
                </div>
                <div className="s_code-container">
                  <h4><Code size={16} /> Submitted Code</h4>
                  <pre className="s_code-block">
                    <code>{submission.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="s_not-found">
              <div className="s_back-link">
                <Link to="/submissions">
                  <ArrowLeft size={16} /> Back to all submissions
                </Link>
              </div>
              <p>Submission not found</p>
            </div>
          )
        ) : (
          // Submissions list view
          <div className="s_submissions-list">
            <div className="s_back-link">
             <Link to="/problem" className="s_btn s_btn-primary">
            Go to Problems
          </Link>
            </div>
            <h2>Your Submissions</h2>
            {submissions.length > 0 ? (
              <>
                <div className="s_list">
                  {submissions.map((sub) => (
                    <div key={sub._id} className={`s_list-item ${isProblemDeleted(sub) ? 's_deleted-item' : ''}`}>
                      <div className="s_item-problem">
                        {sub.problem && !sub.problem.isDeleted ? (
                          <Link to={`/problem/${sub.problem._id}`}>
                            {sub.problem.title}
                          </Link>
                        ) : (
                          <span className="s_deleted-problem">
                            {sub.problem?.title || `Problem ID: ${sub.problem?._id || 'Unknown'}`}
                            {sub.problem?.isDeleted && ' (Deleted)'}
                          </span>
                        )}
                      </div>
                      <div className="s_item-details">
                        <span 
                          className="s_status-badge" 
                          style={{ backgroundColor: getStatusColor(sub.status) }}
                        >
                          {getStatusIcon(sub.status)}
                          {sub.status === 'correct' ? 'Accepted' : 'Wrong Answer'}
                        </span>
                        <span className="s_date">{formatDate(sub.createdAt)}</span>
                        <Link to={`/submissions/${sub.submissionId}`} className="s_view-btn">
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show info message if some problems are deleted */}
                {submissions.some(sub => isProblemDeleted(sub)) && (
                  <div className="s_info-message">
                    ℹ️ Some submissions reference deleted problems.
                  </div>
                )}

                <div className="s_pagination">
                  <button 
                    className="s_pagination-btn" 
                    onClick={handlePrevPage} 
                    disabled={page === 1}
                  >
                    <ArrowLeft size={16} /> Previous
                  </button>
                  <span className="s_page-info">Page {page} of {totalPages}</span>
                  <button 
                    className="s_pagination-btn" 
                    onClick={handleNextPage} 
                    disabled={page === totalPages}
                  >
                    Next <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="s_empty-state">
                <p>You haven't made any submissions yet.</p>
                <Link to="/problem" className="s_btn s_btn-primary">Solve Problems</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Submissions;