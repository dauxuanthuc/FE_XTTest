import React, { useState } from 'react';
import axios from 'axios';
import authService from '../services/auth.service';

export default function JoinClass() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const token = authService.getToken();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post('http://localhost:8080/api/student/join-class', { code }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: res.data.message || 'Joined class successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Tham gia lớp</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <label>Mã lớp</label>
        <input value={code} onChange={e => setCode(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6, marginBottom: 12 }} />
        <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>{loading ? 'Đang gửi...' : 'Tham gia'}</button>
      </form>
      {message && (
        <div style={{ marginTop: 12, color: message.type === 'error' ? '#c62828' : '#2e7d32' }}>{message.text}</div>
      )}
    </div>
  );
}
