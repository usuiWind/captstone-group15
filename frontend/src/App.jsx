import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

function RequireAdmin({ children }) {
  const { user, loading, refetch } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { refetch(); }, [refetch]);

  if (loading) return <div style={{ minHeight: "100vh", background: "#f8f7f5" }} />;
  if (!user || user.role !== 'ADMIN') {
    navigate('/login', { replace: true });
    return null;
  }
  return children;
}

function RequireDashboard() {
  const { user, loading, refetch } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { refetch(); }, [refetch]);
  if (loading) return <div style={{ minHeight: "100vh", background: "#f8f7f5" }} />;
  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }
  if (user.role === 'ADMIN') {
    navigate('/admin', { replace: true });
    return null;
  }
  return <MemberDashboard />;
}
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LeadershipPage from './pages/LeadershipPage'
import GalleryPage from './pages/GalleryPage'
import MembershipPage from './pages/MembershipPage'
import SponsorshipsPage from './pages/SponsorshipsPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MemberDashboard from './pages/MemberDashboard'
import AdminDashboard  from './pages/AdminDashboard'


export default function App() {
  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/officers" element={<LeadershipPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/sponsorships" element={<SponsorshipsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<RequireDashboard />} />
          <Route path="/admin"        element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/manage" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
