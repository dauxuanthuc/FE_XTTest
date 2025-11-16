import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function AdminClassManagement() {
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editClassName, setEditClassName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState({});
  const [selectedStudents, setSelectedStudents] = useState({});
  const [newStudentId, setNewStudentId] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const token = authService.getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchClasses();
    fetchUsers();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/classes`, { headers });
      setClasses(res.data);
    } catch (err) {
      showMessage('Lỗi tải danh sách lớp');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, { headers });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStudentsForClass = async (classId) => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/classes/${classId}/students`, { headers });
      setSelectedStudents(prev => ({ ...prev, [classId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  };

  const createClass = async () => {
    if (!newClassName.trim()) {
      showMessage('Tên lớp không được để trống');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/classes`, 
        { className: newClassName, description: newDescription }, 
        { headers }
      );
      setNewClassName('');
      setNewDescription('');
      fetchClasses();
      showMessage('Lớp học đã được tạo');
    } catch (err) {
      showMessage('Lỗi tạo lớp');
      console.error(err);
    }
  };

  const updateClass = async (id) => {
    try {
      await axios.put(`${API_URL}/api/admin/classes/${id}`, 
        { className: editClassName, description: editDescription }, 
        { headers }
      );
      setEditingId(null);
      fetchClasses();
      showMessage('Lớp học đã được cập nhật');
    } catch (err) {
      showMessage('Lỗi cập nhật lớp');
      console.error(err);
    }
  };

  const deleteClass = async (id) => {
    if (window.confirm('Bạn chắc chắn muốn xóa lớp này?')) {
      try {
        await axios.delete(`${API_URL}/api/admin/classes/${id}`, { headers });
        fetchClasses();
        showMessage('Lớp học đã được xóa');
      } catch (err) {
        showMessage('Lỗi xóa lớp');
        console.error(err);
      }
    }
  };

  const assignTeacher = async (classId, teacherId) => {
    if (!teacherId) {
      showMessage('Chọn giáo viên');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/classes/${classId}/teacher/${teacherId}`, {}, { headers });
      fetchClasses();
      showMessage('Giáo viên đã được gán');
    } catch (err) {
      showMessage('Lỗi gán giáo viên');
      console.error(err);
    }
  };

  const addStudent = async (classId) => {
    const studentId = newStudentId[classId];
    if (!studentId) {
      showMessage('Chọn sinh viên');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/classes/${classId}/students`, 
        { studentId }, 
        { headers }
      );
      setNewStudentId(prev => ({ ...prev, [classId]: '' }));
      getStudentsForClass(classId);
      showMessage('Sinh viên đã được thêm');
    } catch (err) {
      showMessage('Lỗi thêm sinh viên');
      console.error(err);
    }
  };

  const removeStudent = async (classId, studentId) => {
    if (window.confirm('Xóa sinh viên này khỏi lớp?')) {
      try {
        await axios.delete(`${API_URL}/api/admin/classes/${classId}/students/${studentId}`, { headers });
        getStudentsForClass(classId);
        showMessage('Sinh viên đã được xóa');
      } catch (err) {
        showMessage('Lỗi xóa sinh viên');
        console.error(err);
      }
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Đang tải...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h3>Quản Lý Lớp Học</h3>
      {message && <div style={{ marginBottom: 10, padding: 10, backgroundColor: '#e8f5e9', borderRadius: 4 }}>{message}</div>}

      {/* Form tạo lớp mới */}
      <div style={{ marginBottom: 20, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
        <h4>Tạo Lớp Học Mới</h4>
        <div style={{ marginBottom: 8 }}>
          <input 
            type="text" 
            placeholder="Tên lớp" 
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            style={{ width: '300px', padding: 5 }}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <textarea 
            placeholder="Mô tả" 
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            style={{ width: '300px', height: '60px', padding: 5 }}
          />
        </div>
        <button onClick={createClass}>Tạo Lớp</button>
      </div>

      {/* Danh sách lớp */}
      {classes.length === 0 ? (
        <p>Không có lớp nào</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Tên Lớp</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Mô Tả</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Giáo Viên</th>
              <th style={{ textAlign: 'left', padding: 8 }}>SV</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(cls => (
              <React.Fragment key={cls.id}>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>
                    {editingId === cls.id ? (
                      <input 
                        value={editClassName}
                        onChange={e => setEditClassName(e.target.value)}
                        style={{ width: '150px', padding: 5 }}
                      />
                    ) : cls.className}
                  </td>
                  <td style={{ padding: 8 }}>
                    {editingId === cls.id ? (
                      <textarea 
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        style={{ width: '150px', height: '40px', padding: 5 }}
                      />
                    ) : cls.description}
                  </td>
                  <td style={{ padding: 8 }}>
                    <select 
                      value={selectedTeacher[cls.id] || ''}
                      onChange={e => setSelectedTeacher(prev => ({ ...prev, [cls.id]: e.target.value }))}
                      style={{ padding: 5, marginRight: 5 }}
                    >
                      <option value="">Chọn GV...</option>
                      {users.filter(u => u.roles.includes('ROLE_TEACHER')).map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                    {editingId !== cls.id && (
                      <button onClick={() => assignTeacher(cls.id, selectedTeacher[cls.id])}>Gán</button>
                    )}
                  </td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{cls.studentCount}</td>
                  <td style={{ padding: 8 }}>
                    {editingId === cls.id ? (
                      <>
                        <button onClick={() => updateClass(cls.id)} style={{ marginRight: 5 }}>Lưu</button>
                        <button onClick={() => setEditingId(null)}>Hủy</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => {
                          setEditingId(cls.id);
                          setEditClassName(cls.className);
                          setEditDescription(cls.description || '');
                          getStudentsForClass(cls.id);
                        }} style={{ marginRight: 5 }}>Sửa</button>
                        <button onClick={() => deleteClass(cls.id)} style={{ color: 'red' }}>Xóa</button>
                      </>
                    )}
                  </td>
                </tr>

                {editingId === cls.id && selectedStudents[cls.id] && (
                  <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #eee' }}>
                    <td colSpan="5" style={{ padding: 15 }}>
                      <h5>Sinh Viên Trong Lớp</h5>
                      <div style={{ marginBottom: 10 }}>
                        <select 
                          value={newStudentId[cls.id] || ''}
                          onChange={e => setNewStudentId(prev => ({ ...prev, [cls.id]: e.target.value }))}
                          style={{ padding: 5, marginRight: 5 }}
                        >
                          <option value="">Chọn SV để thêm...</option>
                          {users.filter(u => u.roles.includes('ROLE_USER')).map(u => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                          ))}
                        </select>
                        <button onClick={() => addStudent(cls.id)}>Thêm SV</button>
                      </div>
                      {selectedStudents[cls.id].length === 0 ? (
                        <p>Chưa có sinh viên</p>
                      ) : (
                        <ul>
                          {selectedStudents[cls.id].map(student => (
                            <li key={student.id}>
                              {student.username}
                              <button 
                                onClick={() => removeStudent(cls.id, student.id)}
                                style={{ marginLeft: 10, color: 'red', cursor: 'pointer' }}
                              >
                                Xóa
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
