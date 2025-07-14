import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, ChevronRight, Users, Trophy, Brain, Mail, Lock, User, Eye, EyeOff, X } from 'lucide-react';
import '../styles/landing.css';
import { useDataContext } from '../context/datacontext';

const LetsCodeLanding = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUser, user } = useDataContext();

  // If user is already logged in, redirect to problems page
  useEffect(() => {
    if (user) {
      navigate('/problem');
    }
  }, [user, navigate]);

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

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInData.email || !signInData.password) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Signing in with data', signInData);
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signInData),
      });
      const data = await response.json();
      console.log('Sign in response:', data);
      if (response.ok) {
        const userId = data.data.user._id;
        localStorage.setItem('userId', userId);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Store the tokens
        localStorage.setItem('token', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        
        // Update user in context
        updateUser(data.data.user);
        
        console.log('User ID:', data.data.user._id);
        console.log('Sign in successful:', data);
        alert('Sign in successful!');
        setShowSignIn(false);
        
        // Navigate to problems page
        navigate('/problem');
      } else alert(data.message || 'Sign in failed');
    } catch (error) {
      alert('Sign in error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword, firstName, lastName } = signUpData;
    if (!username || !email || !password || !confirmPassword || !firstName || !lastName) {
      alert('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(process.env.REACT_APP_SERVER_LINK +'/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, firstName, lastName }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Account created successfully! Please sign in.');
        setShowSignUp(false);
        setShowSignIn(true);
        setSignUpData({ username: '', email: '', password: '', confirmPassword: '', firstName: '', lastName: '' });
      } else alert(data.message || 'Sign up failed');
    } catch (error) {
      alert('Sign up error.');
    } finally {
      setIsLoading(false);
    }
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
    <form onSubmit={handleSignIn}>
      <h2>Sign In</h2>
      <input type="email" placeholder="Email" value={signInData.email} onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} required />
      <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={signInData.password} onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} required />
      <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
      <button type="submit" disabled={isLoading}>{isLoading ? 'Signing In...' : 'Sign In'}</button>
    </form>
  );

  const signUpForm = (
    <form onSubmit={handleSignUp}>
      <h2>Sign Up</h2>
      <input type="text" placeholder="Username" value={signUpData.username} onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })} required />
      <input type="email" placeholder="Email" value={signUpData.email} onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} required />
      <input type="text" placeholder="First Name" value={signUpData.firstName} onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })} required />
      <input type="text" placeholder="Last Name" value={signUpData.lastName} onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })} required />
      <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={signUpData.password} onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} required />
      <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" value={signUpData.confirmPassword} onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })} required />
      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
      <button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Account'}</button>
    </form>
  );

  return (
    <div className="l_landing-container">
      <header className="l_header">
        <div className="l_header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="l_logo">
            <div className="l_logo-icon"><Code2 className="l_logo-svg" /></div>
            <span className="l_logo-text">LET'S CODE</span>
          </div>
          <div className="l_header-buttons">
            <button onClick={() => setShowSignIn(true)} className="l_btn-signin">Sign In</button>
            <button onClick={() => setShowSignUp(true)} className="l_btn-signup">Sign Up</button>
          </div>
        </div>
      </header>

      <section className="l_hero">
        <div className="l_hero-content">
          <div className="l_hero-icon"><div className="l_hero-icon-bg"><Code2 className="l_hero-icon-svg" /></div></div>
          <h1 className="l_hero-title">LET'S CODE</h1>
          <blockquote className="l_hero-quote">"The best way to learn to code is by coding. Every expert was once a beginner."</blockquote>
          <p className="l_hero-description">Master programming through hands-on practice. Solve challenges, build projects, and level up your coding skills with our interactive platform.</p>
          <div className="l_hero-buttons">
            <button onClick={() => setShowSignUp(true)} className="l_btn-primary"><span>Start Coding Now</span><ChevronRight className="l_btn-icon" /></button>
            <button onClick={() => setShowSignIn(true)} className="l_btn-secondary">Already have an account?</button>
          </div>
        </div>
      </section>

      {showSignIn && renderFormOverlay(signInForm, () => setShowSignIn(false))}
      {showSignUp && renderFormOverlay(signUpForm, () => setShowSignUp(false))}

      <section className="l_features">
        <div className="l_features-grid">
          <div className="l_feature-card"><div className="l_feature-icon l_green"><Brain /></div><h3>Smart Challenges</h3><p>Progressive difficulty levels that adapt to your skill level.</p></div>
          <div className="l_feature-card"><div className="l_feature-icon l_purple"><Trophy /></div><h3>Track Progress</h3><p>Monitor your improvement with detailed analytics.</p></div>
          <div className="l_feature-card"><div className="l_feature-icon l_yellow"><Users /></div><h3>Community</h3><p>Join thousands of developers learning and growing together.</p></div>
        </div>
      </section>

      <footer className="l_footer">
        <div className="l_footer-content">
          <div className="l_footer-logo"><Code2 className="l_footer-icon" /><span>LET'S CODE</span></div>
          <p>&copy; 2025 Let's Code. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LetsCodeLanding;