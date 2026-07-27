// Routes/HRSystemRoutes.jsx
import { Route, Routes, Navigate } from "react-router-dom";
import { HRSystemLayout } from "../layout/HRSystemLayout";
import { useState } from "react";
import { SurveyManager } from "../pages/SurveyManager";
import { Announcement } from "../pages/Announcement";
import { Departament } from "../pages/Departament";
import { Employee } from "../pages/Employee";
import { Position } from "../pages/Position";
import { Subdepartment } from "../pages/Subdepartment";
import { Question } from "../pages/Question";
import { TestManager } from "../pages/Test";
import { Answer } from "../pages/Answer";
import { TestSession } from "../pages/TestSession";
import { EmployeeDashboard } from "../pages/EmployeeDashboard";
import { EmployeeSelector } from "../pages/EmployeeSelector";
import { VideoLesson } from "../pages/VideoLesson";
import { Documentation } from "../pages/Documentation";
import Login from "../pages/Login";
import Register from "../pages/Register";

// 🔐 simple guard
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

export const HRSystemRoutes = () => {
  // ===== СОСТОЯНИЕ ДЛЯ ТЕСТА =====
  const [testData, setTestData] = useState(null);
  const [showTestSession, setShowTestSession] = useState(false);

  const handleStartTest = (data) => {
    setTestData(data);
    setShowTestSession(true);
  };

  const handleCloseTestSession = () => {
    setShowTestSession(false);
    setTestData(null);
  };

  // ===== ЕСЛИ ТЕСТ АКТИВЕН - ПОКАЗЫВАЕМ ЕГО ПОВЕРХ ВСЕГО =====
  if (showTestSession) {
    return <TestSession testData={testData} onClose={handleCloseTestSession} />;
  }

  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PROTECTED LAYOUT */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <HRSystemLayout />
          </PrivateRoute>
        }
      >
        <Route path="announcement" element={<Announcement />} />
        <Route path="reply" element={<Answer />} />
        <Route path="department" element={<Departament />} />
        <Route path="position" element={<Position />} />
        <Route path="employee" element={<Employee />} />
        <Route path="question" element={<Question />} />
        
        {/* ===== ПЕРЕДАЕМ onStartTest В TestManager ===== */}
        <Route 
          path="test" 
          element={<TestManager onStartTest={handleStartTest} />} 
        />
        <Route path="test-taking" element={<TestSession />} />
        <Route path="subdepartment" element={<Subdepartment />} />
        <Route path="video-lessons" element={<VideoLesson />} />
        <Route path="documentation" element={<Documentation />} />
        
        {/* ===== ОПРОСЫ - ВНУТРИ ЗАЩИЩЕННОГО LAYOUT ===== */}
        <Route path="surveys" element={<SurveyManager />} />
      </Route>

      {/* PUBLIC EXTRA */}
      <Route path="/select-employee" element={<EmployeeSelector />} />
      <Route path="/employee/:id/dashboard" element={<EmployeeDashboard />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};