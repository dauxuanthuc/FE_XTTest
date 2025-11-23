import React, { useEffect, useState } from 'react';
import axios from 'axios';
import authService from '../services/auth.service';

export default function StudyPractice() {
  const [sets, setSets] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [mode, setMode] = useState('review'); // 'review' or 'simulate'
  const [simCount, setSimCount] = useState(10);
  const [simQuestions, setSimQuestions] = useState([]);
  const [simIndex, setSimIndex] = useState(0);
  const [simAnswers, setSimAnswers] = useState({}); // {questionId: 'A' }
  const [simStarted, setSimStarted] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [savedResults, setSavedResults] = useState([]);
  const [bookmarked, setBookmarked] = useState([]);
  

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
    // load saved simulate results
    try {
      const raw = localStorage.getItem('practiceSimResults');
      if (raw) setSavedResults(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to load saved simulate results', e);
    }
  }, []);

  const fetchPublicSets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8080/api/practice/question-sets');
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
      const res = await axios.get(`http://localhost:8080/api/practice/question-sets/${setId}/questions`);
      // Ensure questions include correctAnswer for practice
      setQuestions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const startSimulate = async (setId, count) => {
    setSelected(setId);
    setSimResult(null);
    setSimStarted(false);
    try {
      const res = await axios.get(`http://localhost:8080/api/practice/question-sets/${setId}/questions`);
      const all = res.data || [];
      if (all.length === 0) {
        setSimQuestions([]);
        return;
      }
      const shuffled = shuffle(all);
      const take = Math.min(count || 10, shuffled.length);
      const picked = shuffled.slice(0, take);
      setSimQuestions(picked);
      setSimAnswers({});
      setSimIndex(0);
      setSimStarted(true);
    } catch (err) {
      console.error(err);
    }
  };

  const selectSimAnswer = (questionId, choice) => {
    setSimAnswers(prev => ({ ...prev, [questionId]: choice }));
  };

  const finishSimulate = () => {
    const total = simQuestions.length;
    let correct = 0;
    const details = simQuestions.map(q => {
      const sel = simAnswers[q.id];
      const ok = sel && sel === q.correctAnswer;
      if (ok) correct++;
      const mapChoiceToText = (choice) => {
        if (!choice) return null;
        const key = `option${choice}`;
        return q[key] || null;
      };
      return {
        id: q.id,
        questionText: q.questionText,
        selected: sel || null,
        selectedText: mapChoiceToText(sel),
        correctAnswer: q.correctAnswer,
        correctText: mapChoiceToText(q.correctAnswer),
        ok
      };
    });
    setSimResult({ total, correct, details });
    setSimStarted(false);
    // save to localStorage
    try {
      const setTitle = sets.find(s => s.id === selected)?.title || '';
      const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        setId: selected,
        setTitle,
        result: { total, correct, details }
      };
      const next = [entry, ...(savedResults || [])].slice(0, 50); // keep max 50
      setSavedResults(next);
      localStorage.setItem('practiceSimResults', JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save simulate result', e);
    }
  };

  const viewSavedResult = (entry) => {
    setSimResult(entry.result);
    setSimStarted(false);
    setSelected(entry.setId);
  };

  const deleteSavedResult = (id) => {
    const next = (savedResults || []).filter(r => r.id !== id);
    setSavedResults(next);
    localStorage.setItem('practiceSimResults', JSON.stringify(next));
  };

  const clearSavedResults = () => {
    setSavedResults([]);
    localStorage.removeItem('practiceSimResults');
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
            <div style={{ marginBottom: 10 }}>
              <label style={{ marginRight: 8 }}><input type="radio" checked={mode === 'review'} onChange={() => setMode('review')} /> Ôn (Xem đáp án)</label>
              <label><input type="radio" checked={mode === 'simulate'} onChange={() => setMode('simulate')} /> Thi thử (Giả lập)</label>
            </div>
            {mode === 'simulate' && (
              <div style={{ marginBottom: 12 }}>
                <label>Số câu: <input type="number" value={simCount} min={1} max={200} onChange={e => setSimCount(parseInt(e.target.value || '10'))} style={{ width: 80, marginLeft: 6 }} /></label>
              </div>
            )}
            {sets.length === 0 && <div>Không có bộ câu hỏi ôn</div>}
            <div style={{ marginBottom: 10 }}>
              <label>Chọn môn: </label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ marginLeft: 8 }}>
                <option value="All">Tất cả</option>
                {[...new Set(sets.map(x => x.subject).filter(Boolean))].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {sets.filter(s => selectedSubject === 'All' || s.subject === selectedSubject).map(s => (
              <div key={s.id} style={{ padding: 10, border: '1px solid #ddd', marginBottom: 10 }}>
                <div style={{ fontWeight: 'bold' }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{s.questionCount || 0} câu — <span style={{ fontStyle: 'italic' }}>{s.subject || '—'}</span></div>
                {mode === 'review' && <button onClick={() => startPractice(s.id)} style={{ marginTop: 8 }}>Xem đáp án</button>}
                {mode === 'simulate' && <button onClick={() => startSimulate(s.id, simCount)} style={{ marginTop: 8 }}>Bắt đầu thi thử</button>}
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            {simStarted ? (
              <div>
                <h3>Thi thử: Câu {simIndex + 1} / {simQuestions.length}</h3>
                {simQuestions.length === 0 ? <div>Không có câu hỏi</div> : (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 10 }}>{simQuestions[simIndex].questionText}</div>
                    {['A','B','C','D'].map(ch => (
                      <div key={ch} style={{ marginBottom: 8 }}>
                        <button onClick={() => selectSimAnswer(simQuestions[simIndex].id, ch)} style={{ padding: 10, width: '100%', textAlign: 'left', background: simAnswers[simQuestions[simIndex].id] === ch ? '#cfe3ff' : '#fff' }}>
                          {ch}. {simQuestions[simIndex][`option${ch}`]}
                        </button>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button onClick={() => setSimIndex(i => Math.max(0, i - 1))} disabled={simIndex === 0}>Trước</button>
                      <button onClick={() => setSimIndex(i => Math.min(simQuestions.length - 1, i + 1))} disabled={simIndex === simQuestions.length - 1}>Tiếp</button>
                      <button onClick={finishSimulate}>Hoàn thành</button>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      Đã trả lời: {Object.keys(simAnswers).length} / {simQuestions.length}
                    </div>
                  </div>
                )}
              </div>
            ) : simResult ? (
              <div>
                <h3>Kết quả thi thử</h3>
                <div style={{ fontSize: 18, fontWeight: '700' }}>{simResult.correct} / {simResult.total} đúng</div>
                <div style={{ marginTop: 12 }}>
                  {simResult.details.map(d => (
                    <div key={d.id} style={{ padding: 8, border: '1px solid #eee', marginBottom: 8 }}>
                      <div style={{ fontWeight: '600' }}>{d.questionText}</div>
                      <div>Đáp án bạn chọn: {d.selected ? `${d.selected} — ${d.selectedText || ''}` : '—'}</div>
                      <div>Đáp án đúng: {d.correctAnswer ? `${d.correctAnswer} — ${d.correctText || ''}` : '—'}</div>
                      <div style={{ color: d.ok ? '#2e7d32' : '#c62828', fontWeight: 600 }}>{d.ok ? 'Đúng' : 'Sai'}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => { setSimResult(null); setSimQuestions([]); setSelected(null); }}>Quay lại</button>
                </div>
              </div>
            ) : (
              // default review UI
              (selected ? (
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
              ))
            )}
          </div>

          <div style={{ width: 360 }}>
            <h3>Danh sách đã đánh dấu</h3>
            <h4>Lịch sử thi thử</h4>
            {(!savedResults || savedResults.length === 0) && <div>Chưa có kết quả thi thử</div>}
            {savedResults && savedResults.map(r => (
              <div key={r.id} style={{ padding: 8, border: '1px solid #eee', marginBottom: 8 }}>
                <div style={{ fontWeight: '600' }}>{r.setTitle || 'Đề không tên'}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{new Date(r.date).toLocaleString()} — {r.result.correct}/{r.result.total} đúng</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <button onClick={() => viewSavedResult(r)} style={{ padding: '6px 10px' }}>Xem</button>
                  <button onClick={() => deleteSavedResult(r.id)} style={{ padding: '6px 10px' }}>Xoá</button>
                </div>
              </div>
            ))}
            {savedResults && savedResults.length > 0 && <div style={{ marginTop: 6 }}><button onClick={clearSavedResults}>Xoá tất cả</button></div>}

            <h3 style={{ marginTop: 12 }}>Danh sách đã đánh dấu</h3>
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
