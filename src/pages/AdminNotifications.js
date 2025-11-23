import React, { useState, useEffect } from 'react';
import notificationService from '../services/notification.service';

export default function AdminNotifications() {
  const [list, setList] = useState([]);
  const [message, setMessage] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [toAll, setToAll] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  function load() {
    notificationService.getAllNotifications().then(res => setList(res.data || [])).catch(err => console.error(err));
  }

  function submit(e) {
    e.preventDefault();
    const payload = { message, targetUsername: targetUsername || null, targetRole: targetRole || null, toAll };
    notificationService.createNotification(payload).then(res => {
      setMessage(''); setTargetUsername(''); setTargetRole(''); setToAll(false);
      setError(null);
      load();
    }).catch(err => {
      // Extract meaningful server error message
      let serverMsg = null;
      if (err.response) {
        const data = err.response.data;
        if (typeof data === 'string') serverMsg = data;
        else if (data && data.message) serverMsg = data.message;
        else serverMsg = JSON.stringify(data);
      }
      const finalMsg = serverMsg || err.message || 'Lỗi không xác định';
      setError('Thất bại: ' + finalMsg);
    });
  }

  function markRead(id) {
    notificationService.markAsRead(id).then(() => load()).catch(err => console.error(err));
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý Thông Báo</h2>
      <p style={{ color: '#555' }}>Tạo thông báo nhanh cho người dùng theo tên, theo vai trò, hoặc gửi tới tất cả.</p>
      {error && <div style={{ marginBottom: 12, color: 'white', background: '#c23', padding: 8, borderRadius: 4 }}>{error}</div>}
      <form onSubmit={submit} style={{ marginBottom: 20 }}>
        <div>
          <label>Nội dung thông báo</label><br />
          <textarea placeholder="Nhập nội dung thông báo" value={message} onChange={e => setMessage(e.target.value)} rows={3} style={{ width: '100%' }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Tên người nhận (tùy chọn)</label><br />
          <input placeholder="username (ví dụ: user@example.com)" value={targetUsername} onChange={e => setTargetUsername(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Vai trò (tùy chọn, ví dụ: ROLE_TEACHER)</label><br />
          <input placeholder="ROLE_TEACHER" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label><input type="checkbox" checked={toAll} onChange={e => setToAll(e.target.checked)} /> Gửi tới tất cả người dùng</label>
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit">Tạo thông báo</button>
        </div>
      </form>

      <h3>Danh sách thông báo</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: 6 }}>Người nhận</th>
            <th style={{ border: '1px solid #ddd', padding: 6 }}>Nội dung</th>
            <th style={{ border: '1px solid #ddd', padding: 6 }}>Thời gian</th>
            <th style={{ border: '1px solid #ddd', padding: 6 }}>Đã đọc</th>
            <th style={{ border: '1px solid #ddd', padding: 6 }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {list.map(n => (
            <tr key={n.id}>
              <td style={{ border: '1px solid #eee', padding: 6 }}>{n.recipientUsername}</td>
              <td style={{ border: '1px solid #eee', padding: 6 }}>{n.message}</td>
              <td style={{ border: '1px solid #eee', padding: 6 }}>{new Date(n.createdAt).toLocaleString()}</td>
              <td style={{ border: '1px solid #eee', padding: 6 }}>{n.isRead ? 'Có' : 'Chưa'}</td>
              <td style={{ border: '1px solid #eee', padding: 6 }}>
                {!n.isRead && <button onClick={() => markRead(n.id)}>Đánh dấu đã đọc</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
