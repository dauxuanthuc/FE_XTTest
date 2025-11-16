import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.login(username, password);
      const user = authService.getCurrentUser();
      if (user && user.roles.includes('ROLE_ADMIN')) navigate('/admin');
      else if (user && user.roles.includes('ROLE_TEACHER')) navigate('/teacher');
      else navigate('/user');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username (email)</label><br />
          <input 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            placeholder="teacher@demo or admin@demo or student@demo"
          />
        </div>
        <div>
          <label>Password</label><br />
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            placeholder="teacher or admin or student"
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        <strong>Test Credentials:</strong><br/>
        Teacher: teacher@demo / teacher<br/>
        Admin: admin@demo / admin<br/>
        Student: student@demo / student
      </div>
    </div>
  );
}
