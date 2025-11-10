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
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import Layout from '@/components/Layout'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const apiKey = useAuthStore((state) => state.apiKey)

  // Debug: log authentication state in development
  if (import.meta.env.DEV) {
    console.log('Auth state:', { isAuthenticated, hasApiKey: !!apiKey })
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/app"
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
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
