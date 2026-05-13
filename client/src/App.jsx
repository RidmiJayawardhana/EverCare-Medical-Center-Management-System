import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard layouts
import AdminLayout from './components/layout/AdminLayout';
import DoctorLayout from './components/layout/DoctorLayout';
import PatientLayout from './components/layout/PatientLayout';
import ReceptionistLayout from './components/layout/ReceptionistLayout';
import AccountantLayout from './components/layout/AccountantLayout';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminDoctors from './pages/admin/Doctors';
import AdminAppointments from './pages/admin/Appointments';
import AdminFeedback from './pages/admin/Feedback';

// Doctor pages
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorProfile from './pages/doctor/Profile';
import DoctorSchedule from './pages/doctor/Schedule';

// Patient pages
import PatientDashboard from './pages/patient/Dashboard';
import PatientBooking from './pages/patient/BookAppointment';
import PatientAppointments from './pages/patient/Appointments';
import PatientDoctors from './pages/patient/Doctors';

// Receptionist pages
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import ReceptionistAppointments from './pages/receptionist/Appointments';
import ReceptionistBooking from './pages/receptionist/BookAppointment';

// Accountant pages
import AccountantDashboard from './pages/accountant/Dashboard';
import AccountantPayments from './pages/accountant/Payments';
import AccountantReports from './pages/accountant/Reports';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', background: '#1A2E35', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' } }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="doctors" element={<AdminDoctors />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="feedback" element={<AdminFeedback />} />
          </Route>

          {/* Doctor */}
          <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DoctorLayout /></ProtectedRoute>}>
            <Route index element={<DoctorDashboard />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="schedule" element={<DoctorSchedule />} />
            <Route path="profile" element={<DoctorProfile />} />
          </Route>

          {/* Patient */}
          <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientLayout /></ProtectedRoute>}>
            <Route index element={<PatientDashboard />} />
            <Route path="doctors" element={<PatientDoctors />} />
            <Route path="book" element={<PatientBooking />} />
            <Route path="appointments" element={<PatientAppointments />} />
          </Route>

          {/* Receptionist */}
          <Route path="/receptionist" element={<ProtectedRoute roles={['receptionist']}><ReceptionistLayout /></ProtectedRoute>}>
            <Route index element={<ReceptionistDashboard />} />
            <Route path="appointments" element={<ReceptionistAppointments />} />
            <Route path="book" element={<ReceptionistBooking />} />
          </Route>

          {/* Accountant */}
          <Route path="/accountant" element={<ProtectedRoute roles={['accountant']}><AccountantLayout /></ProtectedRoute>}>
            <Route index element={<AccountantDashboard />} />
            <Route path="payments" element={<AccountantPayments />} />
            <Route path="reports" element={<AccountantReports />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
