import React, { useState } from 'react';
import AdminUserManagement from './AdminUserManagement';
import AdminClassManagement from './AdminClassManagement';
import AdminQuestionManagement from './AdminQuestionManagement';
import DashboardStats from './DashboardStats';

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard</h2>
      <div style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
        <button 
          onClick={() => setTab('dashboard')} 
          style={{ marginRight: 10, fontWeight: tab === 'dashboard' ? 'bold' : 'normal' }}
        >
          Tổng Quan
        </button>
        <button 
          onClick={() => setTab('users')} 
          style={{ marginRight: 10, fontWeight: tab === 'users' ? 'bold' : 'normal' }}
        >
          Quản Lý User
        </button>
        <button 
          onClick={() => setTab('classes')} 
          style={{ marginRight: 10, fontWeight: tab === 'classes' ? 'bold' : 'normal' }}
        >
          Quản Lý Lớp
        </button>
        <button 
          onClick={() => setTab('questions')} 
          style={{ fontWeight: tab === 'questions' ? 'bold' : 'normal' }}
        >
          Quản Lý Đề
        </button>
      </div>
      
      {tab === 'dashboard' && <DashboardStats />}
      {tab === 'users' && <AdminUserManagement />}
      {tab === 'classes' && <AdminClassManagement />}
      {tab === 'questions' && <AdminQuestionManagement />}
    </div>
  );
}
