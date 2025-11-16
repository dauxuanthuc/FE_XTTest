import React, { useEffect, useState } from 'react';
import axios from 'axios';
import authService from '../services/auth.service';

export default function ExamHistory() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = authService.getToken();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8080/api/student/results', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('vi-VN');
    } catch (e) { return '—'; }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Lịch sử bài làm</h2>
      {loading && <div>Đang tải...</div>}
      {!loading && results.length === 0 && <div>Chưa có kết quả</div>}
      {!loading && results.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Exam</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Score</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Câu đúng</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Thời gian làm</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id}>
                <td style={{ padding: 8 }}>{r.examTitle || r.examId}</td>
                <td style={{ padding: 8 }}><strong>{r.score}/{r.maxScore}</strong></td>
                <td style={{ padding: 8 }}>{r.correctAnswers}/{r.totalQuestions}</td>
                <td style={{ padding: 8 }}>{formatDuration(r.durationSeconds)}</td>
                <td style={{ padding: 8 }}>{formatDate(r.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
