// HRSystemRoutes.jsx
import { Route, Routes } from "react-router-dom"
import { HRSystemLayout } from "../layout/HRSystemLayout"
import { Announcement } from "../pages/Announcement"
import { Departament } from "../pages/Departament"
import { Employee } from "../pages/Employee"
import { Position } from "../pages/Position"
import { Subdepartment } from "../pages/Subdepartment"
import { Question } from "../pages/Question"
import { TestManager } from "../pages/Test"
import { Answer } from "../pages/Answer"
import { TestSession } from "../pages/TestSession"
import { EmployeeDashboard } from "../pages/EmployeeDashboard"
import { EmployeeSelector } from "../pages/EmployeeSelector" 

export const HRSystemRoutes = () => {
  return (
    <Routes>
      {/* Главный маршрут с Layout */}
      <Route path="/" element={<HRSystemLayout />}>
        <Route path="/announcement" element={<Announcement />} />
        <Route path="/reply" element={<Answer/>} />
        <Route path="/department" element={<Departament />} />
        <Route path="/position" element={<Position />} />
        <Route path="/employee" element={<Employee />} />
        <Route path="/question" element={<Question />} />
        <Route path="/test" element={<TestManager />} />
        <Route path="/test taking" element={<TestSession />} />
        <Route path="/subdepartment" element={<Subdepartment />} />
      </Route>
      
      {/* Публичные маршруты (без Layout) */}
      <Route path="/select-employee" element={<EmployeeSelector />} />
      <Route path="/employee/:id/dashboard" element={<EmployeeDashboard />} />
    </Routes>
  )
}