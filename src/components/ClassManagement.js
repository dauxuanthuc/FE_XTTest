import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedClass, setExpandedClass] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8080/api/teacher/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.data || []);
    } catch (err) {
      setError('Lỗi tải danh sách lớp: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/teacher/classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data || []);
      setExpandedClass(classId);
    } catch (err) {
      setError('Lỗi tải danh sách sinh viên: ' + (err.response?.data?.message || err.message));
    }
  };

  const containerStyle = {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px'
  };

  const classCardStyle = {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const classCardHoverStyle = {
    ...classCardStyle,
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)'
  };

  const studentListStyle = {
    marginTop: '10px',
    paddingLeft: '20px',
    borderLeft: '3px solid #1976d2'
  };

  const studentItemStyle = {
    padding: '8px 0',
    borderBottom: '1px solid #eee'
  };

  const headingStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  };

  const descriptionStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px'
  };

  const studentCountStyle = {
    display: 'inline-block',
    backgroundColor: '#1976d2',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    marginLeft: '10px'
  };

  const errorStyle = {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px'
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  };

  return (
    <div style={containerStyle}>
      <h2>Quản Lý Lớp Của Tôi</h2>
      
      {error && <div style={errorStyle}>{error}</div>}
      
      {loading ? (
        <div style={loadingStyle}>Đang tải dữ liệu...</div>
      ) : classes.length === 0 ? (
        <div style={loadingStyle}>Bạn chưa có lớp nào</div>
      ) : (
        <div>
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              style={expandedClass === classItem.id ? classCardHoverStyle : classCardStyle}
              onMouseEnter={(e) => {
                if (expandedClass !== classItem.id) {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (expandedClass !== classItem.id) {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }
              }}
            >
              <div style={headingStyle}>
                {classItem.className}
                <span style={studentCountStyle}>{students.length || '0'} SV</span>
              </div>
              
              {classItem.description && (
                <div style={descriptionStyle}>{classItem.description}</div>
              )}
              
              <button
                onClick={() => {
                  if (expandedClass === classItem.id) {
                    setExpandedClass(null);
                  } else {
                    fetchStudents(classItem.id);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginTop: '10px'
                }}
              >
                {expandedClass === classItem.id ? '▼ Ẩn Sinh Viên' : '▶ Xem Sinh Viên'}
              </button>

              {expandedClass === classItem.id && students.length > 0 && (
                <div style={studentListStyle}>
                  <h4 style={{ marginTop: '15px', marginBottom: '10px' }}>Danh Sách Sinh Viên ({students.length}):</h4>
                  {students.map((student) => (
                    <div key={student.id} style={studentItemStyle}>
                      <strong>{student.fullName || student.username}</strong>
                      {student.email && <div style={{ fontSize: '12px', color: '#999' }}>{student.email}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
