import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminPage from './pages/AdminPage';
import AdminNotifications from './pages/AdminNotifications';
import TeacherPage from './pages/TeacherPage';
import UserPage from './pages/UserPage';
import JoinClass from './pages/JoinClass';
import StudyPractice from './pages/StudyPractice';
import TakeExam from './pages/TakeExam';
import ExamHistory from './pages/ExamHistory';
import authService from './services/auth.service';

function RequireAuth({ children, roles }) {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && roles.length > 0) {
    const ok = roles.some(r => user.roles.includes(r));
    if (!ok) return <div style={{ padding: 20 }}>Access denied</div>;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/admin" element={
          <RequireAuth roles={["ROLE_ADMIN"]}>
            <AdminPage />
          </RequireAuth>
        } />

        <Route path="/admin/notifications" element={
          <RequireAuth roles={["ROLE_ADMIN"]}>
            <AdminNotifications />
          </RequireAuth>
        } />

        <Route path="/teacher" element={
          <RequireAuth roles={["ROLE_TEACHER"]}>
            <TeacherPage />
          </RequireAuth>
        } />

        <Route path="/user" element={
          <RequireAuth>
            <UserPage />
          </RequireAuth>
        } />

        <Route path="/student/join" element={
          <RequireAuth>
            <JoinClass />
          </RequireAuth>
        } />

        <Route path="/student/practice" element={<StudyPractice />} />

        <Route path="/student/exam" element={
          <RequireAuth>
            <TakeExam />
          </RequireAuth>
        } />

        <Route path="/student/history" element={
          <RequireAuth>
            <ExamHistory />
          </RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
