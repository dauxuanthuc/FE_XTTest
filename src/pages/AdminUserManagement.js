import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editRoles, setEditRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      setMessage('Lỗi tải danh sách user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoles = (userId, currentRoles) => {
    setEditingId(userId);
    setEditRoles({ [userId]: [...currentRoles] });
  };

  const toggleRole = (userId, role) => {
    setEditRoles(prev => ({
      ...prev,
      [userId]: prev[userId].includes(role)
        ? prev[userId].filter(r => r !== role)
        : [...prev[userId], role]
    }));
  };

  const saveRoles = async (userId) => {
    try {
      const token = authService.getToken();
      const res = await axios.put(
        `${API_URL}/api/admin/users/${userId}/roles`,
        { roles: editRoles[userId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u => u.id === userId ? {
        ...u,
        roles: res.data.roles
      } : u));
      setEditingId(null);
      setMessage('Cập nhật role thành công');
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage('Lỗi cập nhật role');
      console.error(err);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Bạn chắc chắn muốn xóa user này?')) {
      try {
        const token = authService.getToken();
        await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(users.filter(u => u.id !== userId));
        setMessage('Xóa user thành công');
        setTimeout(() => setMessage(null), 2000);
      } catch (err) {
        setMessage('Lỗi xóa user');
        console.error(err);
      }
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Đang tải...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản Lý Người Dùng</h2>
      {message && <div style={{ marginBottom: 10, padding: 10, backgroundColor: '#e8f5e9', borderRadius: 4 }}>{message}</div>}

      {users.length === 0 ? (
        <p>Không có user nào</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Username</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Roles</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{user.id}</td>
                <td style={{ padding: 8 }}>{user.username}</td>
                <td style={{ padding: 8 }}>
                  {editingId === user.id ? (
                    <div>
                      <label style={{ display: 'block', marginBottom: 4 }}>
                        <input
                          type="checkbox"
                          checked={editRoles[user.id].includes('ROLE_ADMIN')}
                          onChange={() => toggleRole(user.id, 'ROLE_ADMIN')}
                        />
                        {' '}Admin
                      </label>
                      <label style={{ display: 'block', marginBottom: 4 }}>
                        <input
                          type="checkbox"
                          checked={editRoles[user.id].includes('ROLE_TEACHER')}
                          onChange={() => toggleRole(user.id, 'ROLE_TEACHER')}
                        />
                        {' '}Teacher
                      </label>
                      <label style={{ display: 'block' }}>
                        <input
                          type="checkbox"
                          checked={editRoles[user.id].includes('ROLE_USER')}
                          onChange={() => toggleRole(user.id, 'ROLE_USER')}
                        />
                        {' '}User
                      </label>
                    </div>
                  ) : (
                    user.roles.join(', ')
                  )}
                </td>
                <td style={{ padding: 8 }}>
                  {editingId === user.id ? (
                    <>
                      <button onClick={() => saveRoles(user.id)} style={{ marginRight: 8 }}>Lưu</button>
                      <button onClick={() => setEditingId(null)}>Hủy</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditRoles(user.id, user.roles)} style={{ marginRight: 8 }}>Sửa</button>
                      <button onClick={() => deleteUser(user.id)} style={{ color: 'red' }}>Xóa</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
