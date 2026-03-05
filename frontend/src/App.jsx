import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LeadershipPage from './pages/LeadershipPage'
import MembershipPage from './pages/MembershipPage'
import SponsorshipsPage from './pages/SponsorshipsPage'
import ContactPage from './pages/ContactPage'

export default function App() {
  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/officers" element={<LeadershipPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/sponsorships" element={<SponsorshipsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}