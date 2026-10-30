import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';

import Login from './pages/auth/Login';

import AdminDashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import AddEmployee from './pages/admin/AddEmployee';
import EditEmployee from './pages/admin/EditEmployee';
import EmployeeDetails from './pages/admin/EmployeeDetails';
import Departments from './pages/admin/Departments';
import Attendance from './pages/admin/Attendance';
import LeaveRequests from './pages/admin/LeaveRequests';
import Reports from './pages/admin/Reports';
import AdminSettings from './pages/employee/Settings';

import EmployeeDashboard from './pages/employee/Dashboard';
import MyProfile from './pages/employee/MyProfile';
import MyAttendance from './pages/employee/MyAttendance';
import MyLeave from './pages/employee/MyLeave';
import Holidays from './pages/employee/Holidays';
import Settings from './pages/employee/Settings';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} /> : <Login />}
        />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/add" element={<AddEmployee />} />
        <Route path="employees/edit/:id" element={<EditEmployee />} />
        <Route path="employees/:id" element={<EmployeeDetails />} />
        <Route path="departments" element={<Departments />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<LeaveRequests />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeDashboard />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="leaves" element={<MyLeave />} />
        <Route path="holidays" element={<Holidays />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/employee') : '/login'} />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
