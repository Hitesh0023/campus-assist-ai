import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

const Login = () => {
  const { login, addToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      login(data);
      addToast('Welcome back!');
      navigate('/chat', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="page-content" style={{ maxWidth: 520, paddingTop: '5rem' }}>
      <div className="section-header">
        <h1>Login to Campus Assist AI</h1>
        <p>Sign in with your email and password to access your chat history anytime.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {error && <div style={{ color: '#EF4444', fontWeight: 600 }}>{error}</div>}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="Enter password"
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={!email || !password}>
            Login
          </button>

          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
            New here? <Link to="/register" style={{ color: 'var(--violet-light)' }}>Create an account</Link>
          </p>
        </form>
      </div>
    </main>
  );
};

export default Login;
