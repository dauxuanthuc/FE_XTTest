import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import NotificationBell from './NotificationBell';

export default function NavBar() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
      <Link to="/">Home</Link>
      {' | '}
      {/* Ôn bài luôn hiển thị, không cần đăng nhập */}
      <Link to="/student/practice">Ôn bài</Link>{' | '}
      {!user && <><Link to="/login">Login</Link>{' | '}<Link to="/signup">Signup</Link>{' | '}</>}
      {user && <><span>Hi, {user.username}</span>{' | '}</>}
      {user && user.roles && user.roles.includes('ROLE_ADMIN') && <><Link to="/admin">Admin</Link>{' | '}</>}
      {user && user.roles && user.roles.includes('ROLE_ADMIN') && <><Link to="/admin/notifications">Quản lý thông báo</Link>{' | '}</>}
      {user && <NotificationBell />}
      {user && user.roles && user.roles.includes('ROLE_TEACHER') && <><Link to="/teacher">Teacher</Link>{' | '}</>}
      {user && <><Link to="/user">User</Link>{' | '}</>}
      {user && <><Link to="/student/join">Tham gia lớp</Link>{' | '}</>}
      {user && <><Link to="/student/exam">Thi</Link>{' | '}</>}
      {user && <><Link to="/student/history">Lịch sử</Link>{' | '}</>}
      {user && <button onClick={handleLogout}>Logout</button>}
    </nav>
  );
}
