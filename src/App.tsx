import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Equipment from './pages/Equipment';
import Spareparts from './pages/Spareparts';
import Tools from './pages/Tools';
import Consumables from './pages/Consumables';
import PM from './pages/PM';
import Troubleshooting from './pages/Troubleshooting';
import AuditLogs from './pages/AuditLogs';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      if (location.pathname === '/' || location.pathname === '/login') {
        navigate('/dashboard');
      }
    } else if (location.pathname !== '/' && location.pathname !== '/login') {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate, location.pathname]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Login setUser={setUser} />} />
      <Route path="/login" element={<Login setUser={setUser} />} />
      {user && (
        <Route path="/dashboard" element={<Layout user={user} setUser={setUser} />}>
          <Route index element={<Dashboard />} />
          {user.role === 'Super Admin' && <Route path="users" element={<Users />} />}
          <Route path="equipment" element={<Equipment />} />
          <Route path="spareparts" element={<Spareparts />} />
          <Route path="tools" element={<Tools />} />
          <Route path="consumables" element={<Consumables />} />
          <Route path="pm" element={<PM />} />
          <Route path="troubleshooting" element={<Troubleshooting />} />
          {user.role === 'Super Admin' && <Route path="audit-logs" element={<AuditLogs />} />}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
