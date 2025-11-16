import React, { useState } from 'react';
import ExamManagement from '../components/ExamManagement';
import ExamResults from '../components/ExamResults';
import ClassManagement from '../components/ClassManagement';
import AdminQuestionManagement from './AdminQuestionManagement';

const TeacherPage = () => {
  const [activeTab, setActiveTab] = useState('classes');

  const containerStyle = {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const tabHeaderStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #e0e0e0',
    flexWrap: 'wrap'
  };

  const tabButtonStyle = (isActive) => ({
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    color: isActive ? '#1976d2' : '#666',
    borderBottom: isActive ? '3px solid #1976d2' : 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.3s ease'
  });

  return (
    <div style={containerStyle}>
      <h1>Bảng Điều Khiển Giáo Viên</h1>
      
      <div style={tabHeaderStyle}>
        <button
          style={tabButtonStyle(activeTab === 'classes')}
          onClick={() => setActiveTab('classes')}
        >
          🏫 Lớp Của Tôi
        </button>
        <button
          style={tabButtonStyle(activeTab === 'exams')}
          onClick={() => setActiveTab('exams')}
        >
          📝 Đề Thi Online
        </button>
        <button
          style={tabButtonStyle(activeTab === 'questionsets')}
          onClick={() => setActiveTab('questionsets')}
        >
          📚 Bộ Câu Hỏi
        </button>
        <button
          style={tabButtonStyle(activeTab === 'results')}
          onClick={() => setActiveTab('results')}
        >
          📊 Kết Quả Thi
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        {activeTab === 'classes' && <ClassManagement />}
        {activeTab === 'exams' && <ExamManagement />}
        {activeTab === 'questionsets' && <AdminQuestionManagement />}
        {activeTab === 'results' && <ExamResults />}
      </div>
    </div>
  );
};

export default TeacherPage;
