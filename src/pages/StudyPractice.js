import React, { useEffect, useState } from 'react';
import axios from 'axios';
import authService from '../services/auth.service';

export default function StudyPractice() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [bookmarked, setBookmarked] = useState([]);
  const token = authService.getToken();

  // load bookmarked questions from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bookmarkedQuestions');
      if (raw) setBookmarked(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to load bookmarks', e);
    }
  }, []);

  const persistBookmarks = (list) => {
    try {
      localStorage.setItem('bookmarkedQuestions', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save bookmarks', e);
    }
  };

  const toggleBookmark = (question) => {
    setBookmarked(prev => {
      const exists = prev.some(p => p.id === question.id);
      const next = exists ? prev.filter(p => p.id !== question.id) : [...prev, question];
      persistBookmarks(next);
      return next;
    });
  };

  const removeBookmark = (id) => {
    setBookmarked(prev => {
      const next = prev.filter(p => p.id !== id);
      persistBookmarks(next);
      return next;
    });
  };

  useEffect(() => {
    fetchPublicSets();
  }, []);

  const fetchPublicSets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8080/api/student/question-sets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSets(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startPractice = async (setId) => {
    setSelected(setId);
    try {
      const res = await axios.get(`http://localhost:8080/api/question-sets/${setId}/questions?mode=practice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure questions include correctAnswer for practice
      setQuestions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const optionStyle = (isCorrect) => ({
    padding: 8,
    borderRadius: 6,
    backgroundColor: isCorrect ? '#e8f5e9' : '#fff',
    border: isCorrect ? '1px solid #2e7d32' : '1px solid #eee',
    marginBottom: 6
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>Ôn bài (Practice)</h2>
      {loading && <div>Đang tải...</div>}
      {!loading && (
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ width: 340 }}>
            <h3>Bộ câu hỏi ôn (Có sẵn)</h3>
            {sets.length === 0 && <div>Không có bộ câu hỏi ôn</div>}
            {sets.map(s => (
              <div key={s.id} style={{ padding: 10, border: '1px solid #ddd', marginBottom: 10 }}>
                <div style={{ fontWeight: 'bold' }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{s.questionCount || 0} câu</div>
                <button onClick={() => startPractice(s.id)} style={{ marginTop: 8 }}>Xem đáp án</button>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            {selected ? (
              <div>
                <h3>Danh sách câu hỏi và đáp án</h3>
                {questions.length === 0 ? <div>Không có câu hỏi</div> : (
                  <ol>
                    {questions.map(q => (
                      <li key={q.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{q.questionText}</div>
                          <div>
                            <label style={{ fontSize: 14 }}>
                              <input type="checkbox" checked={bookmarked.some(b => b.id === q.id)} onChange={() => toggleBookmark(q)} /> Đánh dấu ôn
                            </label>
                          </div>
                        </div>
                        <div>
                          <div style={optionStyle(q.correctAnswer === 'A')}>A. {q.optionA}</div>
                          <div style={optionStyle(q.correctAnswer === 'B')}>B. {q.optionB}</div>
                          <div style={optionStyle(q.correctAnswer === 'C')}>C. {q.optionC}</div>
                          <div style={optionStyle(q.correctAnswer === 'D')}>D. {q.optionD}</div>
                        </div>
                        {q.correctAnswer && <div style={{ marginTop: 8, color: '#2e7d32', fontWeight: '600' }}>Đáp án: {q.correctAnswer}</div>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ) : (
              <div>Chọn một bộ câu hỏi để xem đáp án ngay lập tức.</div>
            )}
          </div>

          <div style={{ width: 360 }}>
            <h3>Danh sách đã đánh dấu</h3>
            {bookmarked.length === 0 && <div>Chưa có câu hỏi nào được đánh dấu</div>}
            {bookmarked.map(b => (
              <div key={b.id} style={{ padding: 8, border: '1px solid #eee', marginBottom: 8 }}>
                <div style={{ fontWeight: '600' }}>{b.questionText}</div>
                <div style={{ marginTop: 6, color: '#666' }}>Đáp án: {b.correctAnswer}</div>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => removeBookmark(b.id)} style={{ padding: '6px 10px' }}>Bỏ đánh dấu</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
