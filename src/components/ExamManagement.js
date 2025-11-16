import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questionSetId: '',
    startTime: '',
    endTime: '',
    durationMinutes: 60,
    passingScore: 50,
    numberOfQuestions: '',
    isRandom: false,
    classIds: []
  });

  const [uploadForExam, setUploadForExam] = useState(false);
  const [examUploadFile, setExamUploadFile] = useState(null);

  useEffect(() => {
    fetchExams();
    fetchQuestionSets();
    fetchClasses();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/teacher/exams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(response.data.data || []);
    } catch (err) {
      setError('Lỗi tải đề thi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionSets = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/student/question-sets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestionSets(response.data || []);
    } catch (err) {
      console.error('Lỗi tải bộ câu hỏi:', err);
      setQuestionSets([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/teacher/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách lớp:', err);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.questionSetId || !formData.startTime || !formData.endTime) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      let questionSetIdToUse = formData.questionSetId;

      // If user opted to upload questions specifically for this exam, create a question set with isExamScoped=true
      if (uploadForExam && !editingId) {
        if (!examUploadFile) {
          setError('Vui lòng chọn file câu hỏi để upload cho kỳ thi');
          return;
        }

        // Create question set first
        const createRes = await axios.post('http://localhost:8080/api/question-sets', {
          title: `${formData.title} (Exam Upload)` ,
          description: formData.description || '',
          visibility: 'CLASS',
          isExamScoped: true
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const createdSet = createRes.data;
        questionSetIdToUse = createdSet.id;

        // Upload file to created set
        const fd = new FormData();
        fd.append('file', examUploadFile);
        await axios.post(`http://localhost:8080/api/question-sets/${questionSetIdToUse}/upload`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }

      const payload = {
        ...formData,
        questionSetId: questionSetIdToUse,
        classIds: formData.classIds.length > 0 ? formData.classIds.map(id => parseInt(id)) : []
      };

      if (editingId) {
        // Update exam
        await axios.put(`http://localhost:8080/api/teacher/exams/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Cập nhật đề thi thành công!');
      } else {
        // Create exam
        await axios.post('http://localhost:8080/api/teacher/exams', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Tạo đề thi thành công!');
      }

      setFormData({
        title: '',
        description: '',
        questionSetId: '',
        startTime: '',
        endTime: '',
        durationMinutes: 60,
        passingScore: 50,
        numberOfQuestions: '',
        isRandom: false,
        classIds: []
      });
      setUploadForExam(false);
      setExamUploadFile(null);
      setShowForm(false);
      setEditingId(null);
      fetchExams();
    } catch (err) {
      setError('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditExam = (exam) => {
    setFormData({
      title: exam.title,
      description: exam.description || '',
      questionSetId: exam.questionSetId || '',
      startTime: exam.startTime,
      endTime: exam.endTime,
      durationMinutes: exam.durationMinutes,
      passingScore: exam.passingScore,
      numberOfQuestions: exam.numberOfQuestions || '',
      isRandom: exam.isRandom || false,
      classIds: exam.classIds || []
    });
    setEditingId(exam.id);
    setShowForm(true);
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Bạn chắc chắn muốn xóa đề thi này?')) {
      try {
        await axios.delete(`http://localhost:8080/api/teacher/exams/${examId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Xóa đề thi thành công!');
        fetchExams();
      } catch (err) {
        setError('Lỗi xóa đề thi: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handlePublishExam = async (examId) => {
    try {
      await axios.post(`http://localhost:8080/api/teacher/exams/${examId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Công bố đề thi thành công!');
      fetchExams();
    } catch (err) {
      setError('Lỗi công bố đề thi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClassSelect = (classId) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId]
    }));
  };

  const containerStyle = {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px'
  };

  const formStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ddd'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  const selectStyle = {
    ...inputStyle
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const examCardStyle = {
    backgroundColor: '#fff',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const examHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  };

  const statusBadgeStyle = (isPublished) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: isPublished ? '#4caf50' : '#ff9800',
    color: '#fff'
  });

  const errorStyle = {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px'
  };

  const successStyle = {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px'
  };

  const checkboxStyle = {
    marginRight: '8px'
  };

  const classCheckboxGroupStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px'
  };

  return (
    <div style={containerStyle}>
      <h2>Quản Lý Đề Thi Online</h2>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      <button
        onClick={() => {
          if (showForm) {
            setShowForm(false);
            setEditingId(null);
            setFormData({
              title: '',
              description: '',
              questionSetId: '',
              startTime: '',
              endTime: '',
              durationMinutes: 60,
              passingScore: 50,
              numberOfQuestions: '',
              isRandom: false,
              classIds: []
            });
          } else {
            setShowForm(true);
          }
        }}
        style={{
          ...buttonStyle,
          marginBottom: '20px'
        }}
      >
        {showForm ? '✕ Đóng' : '+ Tạo Đề Thi Mới'}
      </button>

      {showForm && (
        <form onSubmit={handleCreateExam} style={formStyle}>
          <h3>{editingId ? 'Sửa Đề Thi' : 'Tạo Đề Thi Mới'}</h3>

          <input
            type="text"
            name="title"
            placeholder="Tiêu đề đề thi"
            value={formData.title}
            onChange={handleInputChange}
            style={inputStyle}
            required
          />

          <textarea
            name="description"
            placeholder="Mô tả đề thi"
            value={formData.description}
            onChange={handleInputChange}
            style={{ ...inputStyle, minHeight: '80px' }}
          />

          <select
            name="questionSetId"
            value={formData.questionSetId}
            onChange={handleInputChange}
            style={selectStyle}
            required={!uploadForExam}
          >
            <option value="">-- Chọn Bộ Câu Hỏi --</option>
            {questionSets.map(qs => (
              <option key={qs.id} value={qs.id}>
                {qs.title} ({qs.questionCount || 0} câu)
              </option>
            ))}
          </select>

          <div style={{ margin: '10px 0' }}>
            <label style={{ marginRight: 8 }}>
              <input type="checkbox" checked={uploadForExam} onChange={(e) => setUploadForExam(e.target.checked)} />
              {' '}Tải file câu hỏi cho kỳ thi này (tạo bộ đề riêng, không cho ôn)
            </label>
          </div>

          {uploadForExam && (
            <div style={{ marginBottom: 10 }}>
              <label>File câu hỏi cho đề thi: </label>
              <input type="file" accept=".xlsx,.json,.docx" onChange={(e) => setExamUploadFile(e.target.files[0])} style={inputStyle} />
            </div>
          )}

          <input
            type="datetime-local"
            name="startTime"
            placeholder="Thời gian bắt đầu"
            value={formData.startTime}
            onChange={handleInputChange}
            style={inputStyle}
            required
          />

          <input
            type="datetime-local"
            name="endTime"
            placeholder="Thời gian kết thúc"
            value={formData.endTime}
            onChange={handleInputChange}
            style={inputStyle}
            required
          />

          <input
            type="number"
            name="durationMinutes"
            placeholder="Thời gian làm bài (phút)"
            value={formData.durationMinutes}
            onChange={handleInputChange}
            style={inputStyle}
            min="1"
            max="480"
          />

          <input
            type="number"
            name="numberOfQuestions"
            placeholder="Số câu lấy từ bộ đề (để trống = toàn bộ)"
            value={formData.numberOfQuestions}
            onChange={handleInputChange}
            style={inputStyle}
            min="1"
          />

          <div style={{ marginBottom: 10 }}>
            <label style={{ marginRight: 8 }}>
              <input type="checkbox" name="isRandom" checked={formData.isRandom} onChange={(e) => setFormData(prev => ({...prev, isRandom: e.target.checked}))} />
              {' '}Lấy câu ngẫu nhiên từ bộ đề
            </label>
          </div>

          <input
            type="number"
            name="passingScore"
            placeholder="Điểm để đạt"
            value={formData.passingScore}
            onChange={handleInputChange}
            style={inputStyle}
            min="0"
            max="100"
          />

          <label style={{ marginBottom: '10px', fontWeight: 'bold' }}>Gán Lớp:</label>
          <div style={classCheckboxGroupStyle}>
            {classes.map(cls => (
              <div key={cls.id} style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id={`class-${cls.id}`}
                  checked={formData.classIds.includes(cls.id)}
                  onChange={() => handleClassSelect(cls.id)}
                  style={checkboxStyle}
                />
                <label htmlFor={`class-${cls.id}`} style={{ cursor: 'pointer', fontSize: '14px' }}>
                  {cls.className}
                </label>
              </div>
            ))}
          </div>

          <button type="submit" style={buttonStyle}>
            ✓ {editingId ? 'Cập Nhật' : 'Tạo'} Đề Thi
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>
      ) : exams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Bạn chưa tạo đề thi nào
        </div>
      ) : (
        <div>
          {exams.map(exam => (
            <div key={exam.id} style={examCardStyle}>
              <div style={examHeaderStyle}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{exam.title}</h3>
                  <span style={statusBadgeStyle(exam.isPublished)}>
                    {exam.isPublished ? '✓ Đã Công Bố' : '○ Chưa Công Bố'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {!exam.isPublished && (
                    <button
                      onClick={() => handleEditExam(exam)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2196f3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Sửa
                    </button>
                  )}
                  {!exam.isPublished && (
                    <button
                      onClick={() => handlePublishExam(exam.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Công Bố
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {exam.description && (
                <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>
                  {exam.description}
                </p>
              )}

              <div style={{ marginTop: '10px', fontSize: '14px', color: '#555' }}>
                <div><strong>Mã Truy Cập:</strong> {exam.accessCode}</div>
                <div><strong>Thời Gian:</strong> {new Date(exam.startTime).toLocaleString('vi-VN')} - {new Date(exam.endTime).toLocaleString('vi-VN')}</div>
                <div><strong>Thời Gian Làm Bài:</strong> {exam.durationMinutes} phút</div>
                  {exam.numberOfQuestions && <div><strong>Số câu lấy:</strong> {exam.numberOfQuestions} {exam.isRandom ? '(ngẫu nhiên)' : ''}</div>}
                <div><strong>Điểm Đạt:</strong> {exam.passingScore} điểm</div>
                <div><strong>Số Lớp Gán:</strong> {exam.classIds?.length || 0} lớp</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
