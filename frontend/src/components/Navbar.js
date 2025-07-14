import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code, Plus } from 'lucide-react';
import { useDataContext } from '../context/datacontext';
import { useTheme } from '../context/themeContext';
import '../styles/home.css';

const Navbar = ({ hideProfileImage = false }) => {
  const { user } = useDataContext();
  const { theme } = useTheme();
  const location = useLocation();

  const getUserInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || 'A';
  };

  return (
    <nav className="lc-navbar">
      <div className="lc-nav-content">
        <div className="lc-nav-flex">
          <div className="lc-nav-left">
            <div className="lc-logo-section">
              <Link to="/problem" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code className="lc-logo-code-icon" />
                <span className="lc-logo-text">LET'S CODE</span>
              </Link>
            </div>
            <div className="lc-nav-links">
              <Link 
                to="/problem" 
                className={`lc-nav-link ${location.pathname === '/problem' ? 'lc-nav-link-active' : ''}`}
              >
                Problems
              </Link>
              <Link 
                to="/add-problem" 
                className={`lc-nav-link lc-nav-link-add ${location.pathname === '/add-problem' ? 'lc-nav-link-active' : ''}`}
              >
                <Plus className="lc-plus-icon" />
                <span>Add Problem</span>
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