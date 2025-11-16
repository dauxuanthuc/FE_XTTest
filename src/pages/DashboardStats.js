import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/dashboard/stats`);
      setStats(res.data);
      setError('');
    } catch (err) {
      setError('Lỗi tải dữ liệu thống kê: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, color: '#721c24', backgroundColor: '#f8d7da', borderRadius: 4 }}>
        <p>{error}</p>
        <button onClick={fetchStats} style={{ padding: '8px 16px', marginTop: 10 }}>
          Thử lại
        </button>
      </div>
    );
  }

  const StatCard = ({ title, value, color = '#007bff' }) => (
    <div
      style={{
        flex: 1,
        minWidth: 150,
        padding: 20,
        margin: 10,
        backgroundColor: color,
        color: 'white',
        borderRadius: 8,
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 'normal', opacity: 0.9 }}>
        {title}
      </h4>
      <h2 style={{ margin: '10px 0 0 0', fontSize: 36, fontWeight: 'bold' }}>
        {value}
      </h2>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ marginBottom: 20 }}>📊 Thống Kê Hệ Thống</h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <StatCard title="Tổng Lớp" value={stats?.totalClasses || 0} color="#28a745" />
        <StatCard title="Tổng Giáo Viên" value={stats?.totalTeachers || 0} color="#17a2b8" />
        <StatCard title="Tổng Sinh Viên" value={stats?.totalStudents || 0} color="#ffc107" />
        <StatCard title="Tổng Đề" value={stats?.totalQuestionSets || 0} color="#e83e8c" />
        <StatCard title="Lượt Làm Bài" value={stats?.totalExamAttempts || 0} color="#fd7e14" />
      </div>

      <div style={{ marginTop: 30, padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <h4>Thông Tin Chi Tiết</h4>
        <ul style={{ lineHeight: 1.8, color: '#333' }}>
          <li>
            <strong>Lớp học:</strong> {stats?.totalClasses} lớp
          </li>
          <li>
            <strong>Giáo viên:</strong> {stats?.totalTeachers} người
          </li>
          <li>
            <strong>Sinh viên:</strong> {stats?.totalStudents} người
          </li>
          <li>
            <strong>Đề trắc nghiệm:</strong> {stats?.totalQuestionSets} đề
          </li>
          <li>
            <strong>Lượt làm bài kiểm tra:</strong> {stats?.totalExamAttempts} lần
          </li>
        </ul>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button onClick={fetchStats} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          🔄 Làm mới
        </button>
      </div>
    </div>
  );
}
