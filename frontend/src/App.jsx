import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LeadershipPage from './pages/LeadershipPage'
import GalleryPage from './pages/GalleryPage'
import MembershipPage from './pages/MembershipPage'
import SponsorshipsPage from './pages/SponsorshipsPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
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
          <Route path="/dashboard" element={<MemberDashboard />} />
          <Route path="/admin"     element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
