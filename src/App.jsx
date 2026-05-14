import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import AddEmployee from './pages/AddEmployee'
import Departments from './pages/Departments'
import AddDepartment from './pages/AddDepartment'
import LeaveRequests from './pages/LeaveRequests'
import LeaveBalance from './pages/LeaveBalance'
import AddLeaveBalance from './pages/AddLeaveBalance'
import LeaveTypes from './pages/LeaveTypes'
import Login from './pages/Login'
import Notifications from './pages/Notifications'
import CreateLeaveRequest from './pages/CreateLeaveRequest'
import ProtectedRoute from './components/ProtectedRoute'
import AttendanceUpload from './pages/AttendanceUpload'
import AttendanceRecords from './pages/AttendanceRecords'
import AttendanceRegister from './pages/AttendanceRegister'
import Payroll from './pages/Payroll'
import PayrollSettings from './pages/PayrollSettings'
import Shifts from './pages/Shifts'
import Holidays from './pages/Holidays'
import AtsApplications from './pages/ats/ATSApplications'
import AtsScreening from './pages/ats/Screening'
import AtsInterviews from './pages/ats/Interviews'
import AtsEvaluation from './pages/ats/Evaluation'
import AtsOffers from './pages/ats/Offers'
import AtsPreOnboarding from './pages/ats/PreOnboarding'
import AtsOnboarding from './pages/ats/Onboarding'
import AtsPostOnboarding from './pages/ats/PostOnboarding'
import AtsDocuments from './pages/ats/Documents'
import AtsAuditLogs from './pages/ats/AuditLogs'
import AtsReports from './pages/ats/Reports'
import RecruitmentScreeningInterview from './pages/recruitment/ScreeningInterviewPipeline'
import RecruitmentEvaluation from './pages/recruitment/EvaluationPipeline'
import RecruitmentOfferOnboarding from './pages/recruitment/OfferOnboardingDocuments'
// import Roster from './pages/Roster'

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true",
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(localStorage.getItem("isAuthenticated") === "true");
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleStorageChange);
    };
  }, []);

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="add-employee" element={<AddEmployee />} />
        <Route path="edit-employee/:id" element={<AddEmployee />} />
        <Route path="departments" element={<Departments />} />
        <Route path="add-department" element={<AddDepartment />} />
        <Route path="edit-department/:id" element={<AddDepartment />} />
        <Route path="leave-requests" element={<LeaveRequests />} />
        <Route path="create-leave-request" element={<CreateLeaveRequest />} />
        <Route path="leave-balance" element={<LeaveBalance />} />
        <Route path="add-leave" element={<AddLeaveBalance />} />
        <Route path="edit-leave/:empId" element={<AddLeaveBalance />} />
        <Route path="leave-types" element={<LeaveTypes />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="attendance-upload" element={<AttendanceUpload />} />
        <Route path="attendance-records" element={<AttendanceRecords />} />
        <Route path="attendance-register" element={<AttendanceRegister />} />
        <Route path="shifts" element={<Shifts />} />
        <Route path="holidays" element={<Holidays />} />
        {/* <Route path="roster" element={<Roster />} /> */}
        <Route path="payroll" element={<Payroll />} />
        <Route path="payroll-settings" element={<PayrollSettings />} />
        {/* ATS / Recruitment */}
        <Route path="ats/applications" element={<AtsApplications />} />
        {/* <Route path="ats/screening" element={<AtsScreening />} />
        <Route path="ats/interviews" element={<AtsInterviews />} />
        <Route path="ats/evaluation" element={<AtsEvaluation />} />
        <Route path="ats/offers" element={<AtsOffers />} />
        <Route path="ats/pre-onboarding" element={<AtsPreOnboarding />} />
        <Route path="ats/onboarding" element={<AtsOnboarding />} />
        <Route path="ats/post-onboarding" element={<AtsPostOnboarding />} />
        <Route path="ats/documents" element={<AtsDocuments />} />
        <Route path="ats/audit-logs" element={<AtsAuditLogs />} /> */}
        <Route path="ats/reports" element={<AtsReports />} />
        {/* Recruitment pipeline (consolidated screens) */}
        <Route path="ats/pipeline/screening-interview" element={<RecruitmentScreeningInterview />} />
        <Route path="ats/pipeline/evaluation" element={<RecruitmentEvaluation />} />
        <Route path="ats/pipeline/offer-onboarding" element={<RecruitmentOfferOnboarding />} />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
