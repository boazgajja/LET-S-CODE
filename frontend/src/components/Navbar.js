import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Remove Swords from the imports
// import { Code, User, Users, BookOpen, FileText, Plus, UserPlus, Swords } from 'lucide-react';
import { Code, User, Users, BookOpen, FileText, Plus, UserPlus } from 'lucide-react';
              
import { useDataContext } from '../context/datacontext';
import { useTheme } from '../context/themeContext';
import '../styles/home.css';

const Navbar = ({ hideProfileImage = false }) => {
  const { user } = useDataContext();
  const { theme } = useTheme();
  const location = useLocation();

  const getUserInitial = () => {
    // console.log('User:', user);
    return user?.username?.charAt(0).toUpperCase() || 'A';
  };

  return (
    <nav className="lc-navbar">
      <div className="lc-nav-content">
        <div className="lc-nav-flex">
          <div className="lc-nav-left">
            <div className="lc-logo-section">
              <Link to="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code className="lc-logo-code-icon" />
                <span className="lc-logo-text">LET'S CODE</span>
              </Link>
            </div>
            <div className="lc-nav-links">
              <Link 
                to="/problem" 
                className={`lc-nav-link ${location.pathname === '/problem' ? 'lc-nav-link-active' : ''}`}
              >
                <BookOpen size={18} />
                <span>Problems</span>
              </Link>
              <Link 
                to="/add-problem" 
                className={`lc-nav-link ${location.pathname === '/add-problem' ? 'lc-nav-link-active' : ''}`}
              >
                <Plus size={18} />
                <span>Add Problem</span>
              </Link>
              <Link 
                to="/submissions" 
                className={`lc-nav-link ${location.pathname === '/submissions' ? 'lc-nav-link-active' : ''}`}
              >
                <FileText size={18} />
                <span>Submissions</span>
              </Link>
              <Link 
                to="/teams" 
                className={`lc-nav-link ${location.pathname.startsWith('/teams') ? 'lc-nav-link-active' : ''}`}
              >
                <Users size={18} />
                <span>Teams</span>
              </Link>
              <Link 
                to="/friends" 
                className={`lc-nav-link ${location.pathname === '/friends' ? 'lc-nav-link-active' : ''}`}
              >
                <UserPlus size={18} />
                <span>Friends</span>
              </Link>
            </div>
          </div>
          <div className="lc-nav-right">
            {!hideProfileImage && (
              <Link to="/profile" className="lc-profile-link">
                <div className="lc-profile-circle">{getUserInitial()}</div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;