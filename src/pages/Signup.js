import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState(['user']);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const toggleRole = (role) => {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rolesToSend = roles.length > 0 ? roles : ['user'];
    try {
      await authService.signup(username, password, rolesToSend);
      setMessage('Signup successful. Please login.');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username (email)</label><br />
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Password</label><br />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit">Signup</button>
      </form>
      {message && <div style={{ marginTop: 10 }}>{message}</div>}
    </div>
  );
}
