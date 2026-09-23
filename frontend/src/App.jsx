import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Trainers from './pages/Trainers';
import Classes from './pages/Classes';
import Payments from './pages/Payments';
import Attendance from './pages/Attendance';
import TrainerDashboard from './pages/TrainerDashboard';
import MemberDashboard from './pages/MemberDashboard';

import './styles/App.css';

function Layout({ children }) {
  const { role } = useAuth();
  return (
    <>
      {role && <Navbar />}
      <div className="page-content">{children}</div>
    </>
  );
}

function AppRoutes() {
  const { role, loading } = useAuth();

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={role ? <Navigate to={`/${role}`} replace /> : <Login />} />
      <Route path="/register" element={role ? <Navigate to={`/${role}`} replace /> : <Register />} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute allowedRoles={['admin']}><Members /></ProtectedRoute>} />
      <Route path="/trainers" element={<ProtectedRoute allowedRoles={['admin']}><Trainers /></ProtectedRoute>} />
      <Route path="/classes" element={<ProtectedRoute allowedRoles={['admin']}><Classes /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute allowedRoles={['admin']}><Payments /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin']}><Attendance /></ProtectedRoute>} />

      <Route path="/trainer" element={<ProtectedRoute allowedRoles={['trainer']}><TrainerDashboard /></ProtectedRoute>} />
      <Route path="/member" element={<ProtectedRoute allowedRoles={['member']}><MemberDashboard /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to={role ? `/${role}` : '/login'} replace />} />
      <Route path="*" element={<Navigate to={role ? `/${role}` : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;