import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import authService from '../services/auth.service';

export default function TakeExam({ examId: propExamId }) {
  const [examId, setExamId] = useState(propExamId || null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  // don't cache token at module load; read fresh token at request time
  const timerRef = useRef();
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (examId) startExam();
    return () => clearInterval(timerRef.current);
  }, [examId]);

  const startExam = async () => {
    setLoading(true);
    try {
      // start endpoint should return questions and duration or session
      const res = await axios.post(`http://localhost:8080/api/student/exams/${examId}/start`, {}, {
        headers: { Authorization: `Bearer ${authService.getToken()}` }
      });

      const { questions: qList, durationSeconds, examId: returnedExamId } = res.data;
      // Replace examId (access code) with numeric DB id returned by server
      if (returnedExamId) setExamId(returnedExamId);
      setQuestions(qList || []);
      setTimeLeft(durationSeconds || 60 * 60);
      // record precise start time to compute actual duration used
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    const token = authService.getToken();
    if (!token) {
      alert('Bạn chưa đăng nhập. Vui lòng đăng nhập để nộp bài.');
      return;
    }

    try {
      // compute actual duration used (in seconds) from start time if available
      let durationUsed = null;
      if (startTimeRef.current) {
        durationUsed = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
      } else {
        // fallback: if no start time recorded, use the timeLeft as best-effort
        durationUsed = timeLeft;
      }

      const payload = {
        examId: Number(examId),
        durationSeconds: durationUsed,
        answers: Object.entries(answers).map(([qId, ans]) => ({ questionId: Number(qId), answer: ans }))
      };
      const res = await axios.post(`http://localhost:8080/api/student/exams/submit`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Backend now returns a compact DTO. Show friendly result and keep saved result in state.
      const data = res.data;
      setSubmitResult(data);
      // Stop timer and disable further input
      clearInterval(timerRef.current);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi nộp bài: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m} phút ${s} giây`;
    return `${s} giây`;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Thi online</h2>
      {!examId && (
        <div>
          <label>Exam ID</label>
          <input onChange={e => setExamId(e.target.value)} style={{ marginLeft: 8 }} />
          <button onClick={() => startExam()} style={{ marginLeft: 8 }}>Bắt đầu</button>
        </div>
      )}

      {loading && <div>Đang chuẩn bị...</div>}

      {questions.length > 0 && (
        <QuestionPager
          questions={questions}
          answers={answers}
          onSelect={handleSelect}
          onSubmit={handleSubmit}
          submitResult={submitResult}
          timeLeft={timeLeft}
          formatDuration={formatDuration}
        />
      )}
    </div>
  );
}

function QuestionPager({ questions, answers, onSelect, onSubmit, submitResult, timeLeft, formatDuration }) {
  const [index, setIndex] = useState(0);

  const q = questions[index];

  const goNext = () => {
    if (index < questions.length - 1) setIndex(i => i + 1);
  };
  const goPrev = () => {
    if (index > 0) setIndex(i => i - 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>Thời gian còn lại: {Math.floor(timeLeft/60)}:{('0'+(timeLeft%60)).slice(-2)}</div>
        <div>Câu {index+1}/{questions.length}</div>
      </div>

      <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}>
        <div style={{ fontWeight: 'bold', marginBottom: 12 }}>{q.questionText}</div>
        <div>
          {['A','B','C','D'].map(letter => (
            <div key={letter} style={{ marginBottom: 6 }}>
              <label>
                <input type="radio" name={"q"+q.id} checked={answers[q.id]===letter} onChange={() => onSelect(q.id, letter)} /> {letter}. {q['option'+letter]}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={goPrev} disabled={index===0} style={{ padding: '8px 12px' }}>‹ Trước</button>
        {index < questions.length - 1 ? (
          <button onClick={goNext} style={{ padding: '8px 12px' }}>Tiếp ›</button>
        ) : (
          <button onClick={onSubmit} style={{ padding: '8px 12px', backgroundColor: '#1976d2', color: '#fff' }}>Nộp bài</button>
        )}
        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          {submitResult && (
            <div style={{ marginTop: 0, padding: 12, border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9' }}>
              <div><strong>Điểm:</strong> {submitResult.score}/{submitResult.maxScore}</div>
              <div><strong>Câu đúng:</strong> {submitResult.correctAnswers}/{submitResult.totalQuestions}</div>
              <div><strong>Trạng thái:</strong> {submitResult.isPassed ? '✓ ĐẠT' : '✕ KHÔNG ĐẠT'}</div>
              <div><strong>Thời gian làm:</strong> {formatDuration(submitResult.durationSeconds)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
