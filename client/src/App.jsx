import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AstrologerDetail from './pages/AstrologerDetail';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';

import AdminDashboard from './pages/AdminDashboard';
import AstrologerDashboard from './pages/AstrologerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import VideoCall from './pages/VideoCall';
import Chat from './pages/Chat';

// Placeholder Dashboards
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;

  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'astrologer') return <AstrologerDashboard />;
  return <ClientDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white font-sans text-gray-900">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/astrologer/:id" element={<AstrologerDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/astrologer-dashboard" element={<AstrologerDashboard />} />
            <Route path="/call/:id" element={<VideoCall />} />
            <Route path="/chat/:id" element={<Chat />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
