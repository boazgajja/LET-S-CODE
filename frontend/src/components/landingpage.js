import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, ChevronRight, Users, Trophy, Brain, Eye, EyeOff } from 'lucide-react';
import '../styles/landing.css';
import { useAuth } from '../context/AuthContext';

const LetsCodeLanding = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { login, register, isAuthenticated, user } = useAuth();

  // If user is already logged in, redirect to problems page
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User is authenticated, redirecting to /problem');
      navigate('/problem', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const [errors, setErrors] = useState({});

  // Clear errors and success messages when switching forms
  const clearMessages = () => {
    setErrors({});
    setSuccessMessage('');
  };

  // Validation functions
  const validateSignIn = () => {
    const newErrors = {};
    
    if (!signInData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!signInData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUp = () => {
    const newErrors = {};
    
    if (!signUpData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (signUpData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!signUpData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signUpData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!signUpData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!signUpData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!signUpData.password) {
      newErrors.password = 'Password is required';
    } else if (signUpData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!signUpData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signUpData.password !== signUpData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!validateSignIn()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      const result = await login(signInData);
      
      if (result.success) {
        console.log('✅ Sign in successful');
        setSuccessMessage('Login successful! Redirecting...');
        setShowSignIn(false);
        setSignInData({ email: '', password: '' });
        clearMessages();
        // Navigation will be handled by the useEffect
      } else {
        setErrors({ submit: result.message || 'Sign in failed' });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setErrors({ submit: 'Sign in error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!validateSignUp()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      const { confirmPassword, ...registrationData } = signUpData;
      const result = await register(registrationData);
      
      if (result.success) {
        console.log('✅ Registration successful, auto-login completed');
        setSuccessMessage('Account created successfully! You are now logged in. Redirecting...');
        
        // Clear form data
        setSignUpData({ 
          username: '', 
          email: '', 
          password: '', 
          confirmPassword: '', 
          firstName: '', 
          lastName: '' 
        });
        
        // Close modal after a short delay to show success message
        setTimeout(() => {
          setShowSignUp(false);
          clearMessages();
        }, 1500);
        
        // Navigation will be handled by the useEffect when auth state updates
      } else {
        setErrors({ submit: result.message || 'Sign up failed' });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ submit: 'Sign up error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = (modalSetter) => {
    modalSetter(false);
    clearMessages();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const renderFormOverlay = (form, closeHandler) => (
    <div className="l_modal-overlay" onClick={closeHandler}>
      <div className="l_modal-form" onClick={(e) => e.stopPropagation()}>
        <button className="l_modal-close" type="button" onClick={closeHandler}>×</button>
        {form}
      </div>
    </div>
  );

  const signInForm = (
    <form onSubmit={handleSignIn} className="l_auth-form">
      <h2>Welcome Back</h2>
      <p className="l_form-subtitle">Sign in to continue coding</p>
      
      {errors.submit && <div className="l_error-message">{errors.submit}</div>}
      {successMessage && <div className="l_success-message">{successMessage}</div>}
      
      <div className="l_form-group">
        <input 
          type="email" 
          placeholder="Email Address" 
          value={signInData.email} 
          onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
          className={errors.email ? 'l_error' : ''}
        />
        {errors.email && <span className="l_field-error">{errors.email}</span>}
      </div>
      
      <div className="l_form-group">
        <div className="l_password-input">
          <input 
            type={showPassword ? 'text' : 'password'} 
            placeholder="Password" 
            value={signInData.password} 
            onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
            className={errors.password ? 'l_error' : ''}
          />
          <button 
            type="button" 
            className="l_password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && <span className="l_field-error">{errors.password}</span>}
      </div>
      
      <button type="submit" disabled={isLoading} className="l_submit-btn">
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
      
      <p className="l_form-switch">
        Don't have an account? 
        <button 
          type="button" 
          onClick={() => { setShowSignIn(false); setShowSignUp(true); clearMessages(); }}
          className="l_link-btn"
        >
          Sign up here
        </button>
      </p>
    </form>
  );

  const signUpForm = (
    <form onSubmit={handleSignUp} className="l_auth-form">
      <h2>Join Let's Code</h2>
      <p className="l_form-subtitle">Create your account to start coding</p>
      
      {errors.submit && <div className="l_error-message">{errors.submit}</div>}
      {successMessage && <div className="l_success-message">{successMessage}</div>}
      
      <div className="l_form-row">
        <div className="l_form-group">
          <input 
            type="text" 
            placeholder="First Name" 
            value={signUpData.firstName} 
            onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
            className={errors.firstName ? 'l_error' : ''}
          />
          {errors.firstName && <span className="l_field-error">{errors.firstName}</span>}
        </div>
        
        <div className="l_form-group">
          <input 
            type="text" 
            placeholder="Last Name" 
            value={signUpData.lastName} 
            onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
            className={errors.lastName ? 'l_error' : ''}
          />
          {errors.lastName && <span className="l_field-error">{errors.lastName}</span>}
        </div>
      </div>
      
      <div className="l_form-group">
        <input 
          type="text" 
          placeholder="Username" 
          value={signUpData.username} 
          onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
          className={errors.username ? 'l_error' : ''}
        />
        {errors.username && <span className="l_field-error">{errors.username}</span>}
      </div>
      
      <div className="l_form-group">
        <input 
          type="email" 
          placeholder="Email Address" 
          value={signUpData.email} 
          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
          className={errors.email ? 'l_error' : ''}
        />
        {errors.email && <span className="l_field-error">{errors.email}</span>}
      </div>
      
      <div className="l_form-group">
        <div className="l_password-input">
          <input 
            type={showPassword ? 'text' : 'password'} 
            placeholder="Password" 
            value={signUpData.password} 
            onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
            className={errors.password ? 'l_error' : ''}
          />
          <button 
            type="button" 
            className="l_password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && <span className="l_field-error">{errors.password}</span>}
      </div>
      
      <div className="l_form-group">
        <div className="l_password-input">
          <input 
            type={showConfirmPassword ? 'text' : 'password'} 
            placeholder="Confirm Password" 
            value={signUpData.confirmPassword} 
            onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
            className={errors.confirmPassword ? 'l_error' : ''}
          />
          <button 
            type="button" 
            className="l_password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.confirmPassword && <span className="l_field-error">{errors.confirmPassword}</span>}
      </div>
      
      <button type="submit" disabled={isLoading} className="l_submit-btn">
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
      
      <p className="l_form-switch">
        Already have an account? 
        <button 
          type="button" 
          onClick={() => { setShowSignUp(false); setShowSignIn(true); clearMessages(); }}
          className="l_link-btn"
        >
          Sign in here
        </button>
      </p>
    </form>
  );

  return (
    <div className="l_landing-container">
      <header className="l_header">
        <div className="l_header-content">
          <div className="l_logo">
            <div className="l_logo-icon">
              <Code2 className="l_logo-svg" />
            </div>
            <span className="l_logo-text">LET'S CODE</span>
          </div>
          <div className="l_header-buttons">
            <button onClick={() => setShowSignIn(true)} className="l_btn-signin">
              Sign In
            </button>
            <button onClick={() => setShowSignUp(true)} className="l_btn-signup">
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <section className="l_hero">
        <div className="l_hero-content">
          <div className="l_hero-icon">
            <div className="l_hero-icon-bg">
              <Code2 className="l_hero-icon-svg" />
            </div>
          </div>
          <h1 className="l_hero-title">LET'S CODE</h1>
          <blockquote className="l_hero-quote">
            "The best way to learn to code is by coding. Every expert was once a beginner."
          </blockquote>
          <p className="l_hero-description">
            Master programming through hands-on practice. Solve challenges, build projects, 
            and level up your coding skills with our interactive platform.
          </p>
          <div className="l_hero-buttons">
            <button onClick={() => setShowSignUp(true)} className="l_btn-primary">
              <span>Start Coding Now</span>
              <ChevronRight className="l_btn-icon" />
            </button>
            <button onClick={() => setShowSignIn(true)} className="l_btn-secondary">
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      {showSignIn && renderFormOverlay(signInForm, () => closeModal(setShowSignIn))}
      {showSignUp && renderFormOverlay(signUpForm, () => closeModal(setShowSignUp))}

      <section className="l_features">
        <div className="l_features-grid">
          <div className="l_feature-card">
            <div className="l_feature-icon l_green">
              <Brain />
            </div>
            <h3>Smart Challenges</h3>
            <p>Progressive difficulty levels that adapt to your skill level.</p>
          </div>
          <div className="l_feature-card">
            <div className="l_feature-icon l_purple">
              <Trophy />
            </div>
            <h3>Track Progress</h3>
            <p>Monitor your improvement with detailed analytics.</p>
          </div>
          <div className="l_feature-card">
            <div className="l_feature-icon l_yellow">
              <Users />
            </div>
            <h3>Community</h3>
            <p>Join thousands of developers learning and growing together.</p>
          </div>
        </div>
      </section>

      <footer className="l_footer">
        <div className="l_footer-content">
          <div className="l_footer-logo">
            <Code2 className="l_footer-icon" />
            <span>LET'S CODE</span>
          </div>
          <p>&copy; 2025 Let's Code. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LetsCodeLanding;