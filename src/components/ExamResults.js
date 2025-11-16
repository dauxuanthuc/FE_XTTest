import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExamResults = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [results, setResults] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/teacher/exams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(response.data.data || []);
    } catch (err) {
      setError('Lỗi tải danh sách đề thi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (examId) => {
    setLoading(true);
    setError('');
    try {
      const [resultsRes, statsRes] = await Promise.all([
        axios.get(`http://localhost:8080/api/teacher/exams/${examId}/results`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:8080/api/teacher/exams/${examId}/statistics`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setResults(resultsRes.data.data || []);
      setStatistics(statsRes.data.data || {});
      setSelectedExam(examId);
    } catch (err) {
      setError('Lỗi tải kết quả: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px'
  };

  const selectStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '20px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  const statsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  };

  const statCardStyle = {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const statNumberStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: '5px'
  };

  const statLabelStyle = {
    fontSize: '14px',
    color: '#666'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const thStyle = {
    padding: '12px',
    backgroundColor: '#1976d2',
    color: '#fff',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: '14px'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #eee',
    fontSize: '14px'
  };

  const passedStyle = {
    ...tdStyle,
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    fontWeight: 'bold'
  };

  const failedStyle = {
    ...tdStyle,
    backgroundColor: '#ffebee',
    color: '#c62828',
    fontWeight: 'bold'
  };

  const errorStyle = {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px'
  };

  const emptyStyle = {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  };

  return (
    <div style={containerStyle}>
      <h2>Xem Kết Quả Thi</h2>

      {error && <div style={errorStyle}>{error}</div>}

      <select
        value={selectedExam || ''}
        onChange={(e) => {
          const examId = parseInt(e.target.value);
          if (examId) {
            fetchResults(examId);
          }
        }}
        style={selectStyle}
      >
        <option value="">-- Chọn Đề Thi Để Xem Kết Quả --</option>
        {exams.map(exam => (
          <option key={exam.id} value={exam.id}>
            {exam.title}
          </option>
        ))}
      </select>

      {loading ? (
        <div style={emptyStyle}>Đang tải dữ liệu...</div>
      ) : selectedExam ? (
        <>
          {statistics && (
            <div style={statsContainerStyle}>
              <div style={statCardStyle}>
                <div style={statNumberStyle}>{statistics.totalAttempts || 0}</div>
                <div style={statLabelStyle}>Tổng Lượt Nộp</div>
              </div>
              <div style={statCardStyle}>
                <div style={statNumberStyle}>{statistics.passedCount || 0}</div>
                <div style={statLabelStyle}>Đạt</div>
              </div>
              <div style={statCardStyle}>
                <div style={statNumberStyle}>{statistics.failedCount || 0}</div>
                <div style={statLabelStyle}>Không Đạt</div>
              </div>
              <div style={statCardStyle}>
                <div style={statNumberStyle}>{statistics.averageScore?.toFixed(1) || 0}</div>
                <div style={statLabelStyle}>Điểm TB</div>
              </div>
              {statistics.highestScore !== undefined && (
                <div style={statCardStyle}>
                  <div style={statNumberStyle}>{statistics.highestScore}</div>
                  <div style={statLabelStyle}>Điểm Cao Nhất</div>
                </div>
              )}
              {statistics.lowestScore !== undefined && (
                <div style={statCardStyle}>
                  <div style={statNumberStyle}>{statistics.lowestScore}</div>
                  <div style={statLabelStyle}>Điểm Thấp Nhất</div>
                </div>
              )}
            </div>
          )}

          <h3>Danh Sách Kết Quả</h3>
          {results.length === 0 ? (
            <div style={emptyStyle}>Chưa có sinh viên nào nộp bài thi này</div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Tên Sinh Viên</th>
                  <th style={thStyle}>Điểm</th>
                  <th style={thStyle}>Câu Đúng</th>
                  <th style={thStyle}>Thời Gian</th>
                  <th style={thStyle}>Trạng Thái</th>
                  <th style={thStyle}>Ngày Nộp</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result.id}>
                    <td style={tdStyle}>{result.studentUsername}</td>
                    <td style={tdStyle}><strong>{result.score}/{result.maxScore}</strong></td>
                    <td style={tdStyle}>{result.correctAnswers}/{result.totalQuestions}</td>
                    <td style={tdStyle}>{result.durationSeconds ? Math.round(result.durationSeconds / 60) : 0} phút</td>
                    <td style={result.isPassed ? passedStyle : failedStyle}>
                      {result.isPassed ? '✓ ĐẠT' : '✕ KHÔNG ĐẠT'}
                    </td>
                    <td style={tdStyle}>
                      {new Date(result.submittedAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <div style={emptyStyle}>Vui lòng chọn một đề thi để xem kết quả</div>
      )}
    </div>
  );
};

export default ExamResults;
