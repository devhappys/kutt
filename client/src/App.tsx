import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import HomePage from '@/pages/HomePage'
import Dashboard from '@/pages/Dashboard'
import LinksPage from '@/pages/LinksPage'
import TagsPage from '@/pages/TagsPage'
import StatsPage from '@/pages/StatsPage'
import SecurityPage from '@/pages/SecurityPage'
import SettingsPage from '@/pages/SettingsPage'
import LoginPage from '@/pages/LoginPage'
import Layout from '@/components/Layout'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/app"
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<Dashboard />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="links/:linkId/stats" element={<StatsPage />} />
        <Route path="links/:linkId/security" element={<SecurityPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
