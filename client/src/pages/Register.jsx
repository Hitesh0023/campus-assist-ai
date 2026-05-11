import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

const Register = () => {
  const { login, addToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/auth/signup', { email, password, nickname });
      login(data);
      addToast('Account created successfully!');
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="page-content" style={{ maxWidth: 520, paddingTop: '5rem' }}>
      <div className="section-header">
        <h1>Create your account</h1>
        <p>Register with email and password to save your chat history and access it later.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {error && <div style={{ color: '#EF4444', fontWeight: 600 }}>{error}</div>}

          <label>
            Nickname
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="input-field"
              placeholder="Campus nickname"
            />
          </label>

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
              placeholder="Choose a password"
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={!email || !password}>
            Register
          </button>

          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--violet-light)' }}>Login</Link>
          </p>
        </form>
      </div>
    </main>
  );
};

export default Register;
