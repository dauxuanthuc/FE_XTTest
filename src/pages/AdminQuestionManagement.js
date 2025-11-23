import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function AdminQuestionManagement() {
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false);

  const token = localStorage.getItem('token');

  const getHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // default to class-only; can be "PUBLIC"
    visibility: 'CLASS',
    subject: '',
    isExamScoped: false
  });

  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A'
  });

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all question sets
  const fetchQuestionSets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/question-sets`, {
        headers: getHeaders()
      });
      setQuestionSets(res.data || []);
      setSuccessMessage('');
    } catch (error) {
      console.error('Error fetching question sets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions for a specific set
  const fetchQuestions = async (setId) => {
    try {
      const res = await axios.get(`${API_URL}/api/question-sets/${setId}/questions`, {
        headers: getHeaders()
      });
      setQuestions(res.data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  useEffect(() => {
    fetchQuestionSets();
  }, []);

  const handleCreateUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!formData.title.trim()) {
        alert('Tiêu đề không được để trống');
        return;
      }

      if (editingId) {
        // Update
        await axios.put(`${API_URL}/api/question-sets/${editingId}`, {
          title: formData.title,
          description: formData.description,
          visibility: formData.visibility,
          isExamScoped: formData.isExamScoped,
          subject: formData.subject
        }, {
          headers: getHeaders()
        });
        setSuccessMessage('Cập nhật đề thành công!');
      } else {
        // Create
        await axios.post(`${API_URL}/api/question-sets`, {
          title: formData.title,
          description: formData.description,
          visibility: formData.visibility,
          isExamScoped: formData.isExamScoped,
          subject: formData.subject
        }, {
          headers: getHeaders()
        });
        setSuccessMessage('Tạo đề mới thành công!');
      }

      setFormData({ title: '', description: '', visibility: 'CLASS', subject: '', isExamScoped: false });
      setShowForm(false);
      setEditingId(null);
      fetchQuestionSets();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đề này?')) {
      try {
        await axios.delete(`${API_URL}/api/question-sets/${id}`, {
          headers: getHeaders()
        });
        setSuccessMessage('Xóa đề thành công!');
        fetchQuestionSets();
      } catch (error) {
        alert('Lỗi xóa: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEdit = (qs) => {
    setFormData({ title: qs.title, description: qs.description, visibility: qs.visibility || 'CLASS', subject: qs.subject || '', isExamScoped: !!qs.isExamScoped });
    setEditingId(qs.id);
    setShowForm(true);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Vui lòng chọn file để upload');
      return;
    }

    if (!selectedSetId) {
      setUploadError('Vui lòng chọn đề trước khi upload file');
      return;
    }

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', uploadFile);

      const res = await axios.post(
        `${API_URL}/api/question-sets/${selectedSetId}/upload`,
        formDataObj,
        { headers: { 'Content-Type': 'multipart/form-data', ...getHeaders() } }
      );

      setSuccessMessage(`Tải lên thành công! ${res.data.questionCount} câu hỏi đã được thêm vào.`);
      setUploadFile(null);
      setUploadError('');
      fetchQuestionSets();
      fetchQuestions(selectedSetId);
    } catch (error) {
      setUploadError('Lỗi upload: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      if (!selectedSetId) {
        alert('Vui lòng chọn một đề trước');
        return;
      }

      if (!questionForm.questionText.trim()) {
        alert('Câu hỏi không được để trống');
        return;
      }

      await axios.post(`${API_URL}/api/question-sets/${selectedSetId}/questions`, questionForm, {
        headers: getHeaders()
      });
      setSuccessMessage('Thêm câu hỏi thành công!');
      setQuestionForm({
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A'
      });
      fetchQuestions(selectedSetId);
      fetchQuestionSets();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      try {
        await axios.delete(`${API_URL}/api/question-sets/questions/${questionId}`, {
          headers: getHeaders()
        });
        setSuccessMessage('Xóa câu hỏi thành công!');
        fetchQuestions(selectedSetId);
        fetchQuestionSets();
      } catch (error) {
        alert('Lỗi: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h3>Quản Lý Đề Trắc Nghiệm</h3>

      {successMessage && (
        <div style={{ padding: 10, marginBottom: 15, backgroundColor: '#d4edda', color: '#155724', borderRadius: 4 }}>
          {successMessage}
        </div>
      )}

      {/* Create/Update Form */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', marginBottom: 10 }}>
          {showForm ? 'Đóng' : editingId ? 'Sửa Đề' : 'Tạo Đề Mới'}
        </button>

        {showForm && (
          <form onSubmit={handleCreateUpdate} style={{ marginTop: 10, padding: 15, border: '1px solid #ddd', borderRadius: 4 }}>
            <div style={{ marginBottom: 10 }}>
              <label>Tiêu đề: </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Mô tả: </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: 8, minHeight: 80 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Môn: </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Nhập môn, ví dụ: Đại cương, Chuyên ngành"
                style={{ width: '100%', padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Hiển thị: </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                style={{ padding: 8 }}
              >
                <option value="CLASS">Cho lớp (mặc định)</option>
                <option value="PUBLIC">Toàn hệ thống</option>
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ marginRight: 8 }}>
                <input
                  type="checkbox"
                  checked={formData.isExamScoped}
                  onChange={(e) => setFormData({ ...formData, isExamScoped: e.target.checked })}
                />
                {' '}Chỉ dành cho kỳ thi (không cho ôn)
              </label>
            </div>
            <button type="submit" style={{ padding: '8px 16px', marginRight: 10 }}>
              {editingId ? 'Cập Nhật' : 'Tạo'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ title: '', description: '', visibility: 'CLASS', isExamScoped: false });
              }}
              style={{ padding: '8px 16px' }}
            >
              Hủy
            </button>
          </form>
        )}
      </div>

      {/* File Upload Section */}
      <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#f9f9f9' }}>
        <h4>Tải Lên File Câu Hỏi (Excel/JSON/Word)</h4>
        {uploadError && (
          <div style={{ padding: 10, marginBottom: 10, backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 4 }}>
            {uploadError}
          </div>
        )}
        <div style={{ marginBottom: 10 }}>
          <label>Chọn đề: </label>
          <select
            value={selectedSetId || ''}
            onChange={(e) => setSelectedSetId(e.target.value ? parseInt(e.target.value) : null)}
            style={{ padding: 8, width: '100%' }}
          >
            <option value="">-- Chọn một đề --</option>
            {questionSets.map((qs) => (
              <option key={qs.id} value={qs.id}>
                {qs.title} ({qs.questionCount} câu) {qs.visibility ? `- ${qs.visibility}` : ''} {qs.isExamScoped ? '(Exam-only)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Chọn file: </label>
          <input
            type="file"
            accept=".xlsx,.json,.docx"
            onChange={(e) => setUploadFile(e.target.files[0])}
            style={{ width: '100%', padding: 8 }}
          />
          <small style={{ color: '#666' }}>Hỗ trợ: Excel (.xlsx), JSON (.json), Word (.docx)</small>
        </div>
        <button onClick={handleFileUpload} style={{ padding: '8px 16px' }}>
          Tải Lên
        </button>
      </div>

      {/* Add Question Form */}
      <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#f0f8ff' }}>
        <h4>Thêm Câu Hỏi Trực Tiếp</h4>
        {selectedSetId ? (
          <form onSubmit={handleAddQuestion}>
            <div style={{ marginBottom: 10 }}>
              <label>Câu hỏi: </label>
              <textarea
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                style={{ width: '100%', padding: 8, minHeight: 60 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Tùy chọn A: </label>
              <input
                type="text"
                value={questionForm.optionA}
                onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                style={{ width: '100%', padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Tùy chọn B: </label>
              <input
                type="text"
                value={questionForm.optionB}
                onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                style={{ width: '100%', padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Tùy chọn C: </label>
              <input
                type="text"
                value={questionForm.optionC}
                onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                style={{ width: '100%', padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Tùy chọn D: </label>
              <input
                type="text"
                value={questionForm.optionD}
                onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                style={{ width: '100%', padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Đáp án đúng: </label>
              <select
                value={questionForm.correctAnswer}
                onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                style={{ padding: 8 }}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '8px 16px', marginRight: 10 }}>
              Thêm Câu Hỏi
            </button>
            <button
              type="button"
              onClick={() => setSelectedSetId(null)}
              style={{ padding: '8px 16px' }}
            >
              Xóa chọn
            </button>
          </form>
        ) : (
          <p style={{ color: '#666' }}>Vui lòng chọn một đề từ danh sách dưới để thêm câu hỏi.</p>
        )}
      </div>

      {/* Question Sets List */}
      <h4>Danh Sách Các Đề</h4>
      {questionSets.length === 0 ? (
        <p>Chưa có đề nào</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: 10, textAlign: 'left' }}>Tiêu đề</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Mô tả</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Môn</th>
              <th style={{ padding: 10, textAlign: 'center' }}>Số Câu</th>
              <th style={{ padding: 10, textAlign: 'center' }}>Loại File</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Tạo bởi</th>
              <th style={{ padding: 10, textAlign: 'center' }}>Hiển thị</th>
              <th style={{ padding: 10, textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {questionSets.map((qs) => (
              <tr key={qs.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: 10 }}>{qs.title}</td>
                <td style={{ padding: 10 }}>{qs.description || '-'}</td>
                <td style={{ padding: 10 }}>{qs.subject || '-'}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>{qs.questionCount}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>{qs.fileType || '-'}</td>
                <td style={{ padding: 10 }}>{qs.createdBy}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    backgroundColor: qs.isExamScoped ? '#ffc107' : (qs.visibility === 'PUBLIC' ? '#4caf50' : '#2196f3'),
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {qs.isExamScoped ? 'Exam-only' : (qs.visibility === 'PUBLIC' ? 'PUBLIC' : 'CLASS')}
                  </span>
                </td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      setSelectedSetId(qs.id);
                      fetchQuestions(qs.id);
                      setShowQuestions(!showQuestions);
                    }}
                    style={{ padding: '4px 8px', marginRight: 5 }}
                  >
                    Xem Câu
                  </button>
                  <button
                    onClick={() => handleEdit(qs)}
                    style={{ padding: '4px 8px', marginRight: 5 }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(qs.id)}
                    style={{ padding: '4px 8px', backgroundColor: '#f8d7da', color: '#721c24' }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Questions Display */}
      {showQuestions && selectedSetId && (
        <div style={{ marginTop: 20, padding: 15, border: '2px solid #007bff', borderRadius: 4, backgroundColor: '#f0f8ff' }}>
          <h4>Câu Hỏi Trong Đề (Tổng: {questions.length})</h4>
          {questions.length === 0 ? (
            <p>Chưa có câu hỏi nào trong đề này</p>
          ) : (
            questions.map((q, index) => (
              <div key={q.id} style={{ marginBottom: 15, padding: 10, backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: 4 }}>
                <p>
                  <strong>{index + 1}. {q.questionText}</strong>
                </p>
                <div style={{ marginLeft: 20, marginBottom: 10 }}>
                  <p>A. {q.optionA}</p>
                  <p>B. {q.optionB}</p>
                  <p>C. {q.optionC}</p>
                  <p>D. {q.optionD}</p>
                  <p style={{ color: '#28a745', fontWeight: 'bold' }}>Đáp án: {q.correctAnswer}</p>
                </div>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  style={{ padding: '4px 8px', backgroundColor: '#f8d7da', color: '#721c24' }}
                >
                  Xóa
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
