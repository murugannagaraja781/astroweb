import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { lazy, Suspense, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import AuthContext from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

// Eager load critical components (above the fold)
import MobileNav from './components/mobile/MobileNav.jsx';
import DesktopSidebar from './components/desktop/DesktopSidebar';
import DesktopHeader from './components/desktop/DesktopHeader.jsx';
import MobileHeader from './components/mobile/MobileHeader.jsx';
import Home from './pages/Home';
import HoroscopeDetail from './pages/HoroscopeDetail';

// Lazy load route components for code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AstrologerDetail = lazy(() => import('./pages/AstrologerDetail'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AstrologerDashboard = lazy(() => import('./pages/AstrologerDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const VideoCall = lazy(() => import('./pages/AgoraVideoCall'));
const Chat = lazy(() => import('./pages/Chat'));
const AstrologyDashboard = lazy(() => import('./pages/AstrologyDashboard'));
const PhonePeTest = lazy(() => import('./pages/PhonePeTest'));
const HealthTest = lazy(() => import('./pages/HealthTest'));
const AstrologerListChat = lazy(() => import('./pages/AstrologerListChat'));
const AstrologerListCalls = lazy(() => import('./pages/AstrologerListCalls'));

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white text-sm">Loading...</p>
    </div>
  </div>
);

// Dashboard Router
const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" />;

  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'astrologer') return <AstrologerDashboard />;
  return <ClientDashboard />;
};

// Role-protected wrapper for AstrologyDashboard
const ProtectedAstrology = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" />;

  if (user.role === 'admin' || user.role === 'astrologer') {
    return <AstrologyDashboard />;
  }
  return <Navigate to="/" />;
};

const AppLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Hide global layout for admin dashboard
  const isAdminPage = location.pathname === '/admin-dashboard' ||
                      (location.pathname === '/dashboard' && user?.role === 'admin');

  // Home page - show mobile nav only, no desktop elements
  const isHomePage = location.pathname === '/';

  // Hide all navigation on astrologer detail page
  const isAstrologerDetailPage = location.pathname.startsWith('/astrologer/');

  // Hide all navigation on auth pages (login, register)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Hide mobile nav on chat pages
  const isChatPage = location.pathname.startsWith('/chat/');

  // Hide mobile nav on astrologer dashboard
  const isAstrologerDashboard = location.pathname === '/astrologer-dashboard';

  // Hide mobile nav on astrology dashboard
  const isAstrologyDashboard = location.pathname === '/astrology';

  // Home page - mobile nav only
  if (isHomePage) {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900">
        {/* Desktop Header for desktop view */}
        <div className="hidden md:block">
          <DesktopHeader />
        </div>
        {children}
        {/* Mobile Nav only for mobile devices */}
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    );
  }

  if (isAdminPage) {
    return <>{children}</>;
  }

  if (isAstrologerDetailPage) {
    return <>{children}</>;
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (isChatPage) {
    return <>{children}</>;
  }

  // Astrologer dashboard - no mobile nav
  if (isAstrologerDashboard) {
    return <>{children}</>;
  }

  // Astrology dashboard - no mobile nav
  if (isAstrologyDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <DesktopHeader />
      <MobileHeader />
      {/* Desktop Sidebar removed globally for desktop */}
      {/* <DesktopSidebar /> */}
      <div className="desktop-main-content">
        {children}
      </div>
      {/* Mobile Nav only visible on mobile devices */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeProvider>
          <Router>
            <AppLayout>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/horoscope/:sign" element={<HoroscopeDetail />} />
                  <Route path="/astrologer/:id" element={<AstrologerDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/astrologer-dashboard" element={<AstrologerDashboard />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/call/:id" element={<VideoCall />} />
                  <Route path="/chat/:id" element={<Chat />} />
                  <Route path="/astrology" element={<ProtectedAstrology />} />
                  <Route path="/astrologers/chat" element={<AstrologerListChat />} />
                  <Route path="/astrologers/calls" element={<AstrologerListCalls />} />
                  <Route path="/phonepe-test" element={<PhonePeTest />} />
                  <Route path="/health-test" element={<HealthTest />} />
                </Routes>
              </Suspense>
            </AppLayout>
          </Router>
        </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
