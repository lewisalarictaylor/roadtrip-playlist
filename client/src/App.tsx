import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.ts'
import { useEffect } from 'react'
import { HomePage }      from './pages/HomePage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { JobPage }       from './pages/JobPage.tsx'
import { PrivacyPage }   from './pages/PrivacyPage.tsx'

export default function App() {
  const { user, loading, fetchMe } = useAuthStore()

  useEffect(() => { fetchMe() }, [fetchMe])

  if (loading) return null

  return (
    <Routes>
      <Route path="/"          element={<HomePage />} />
      <Route path="/privacy"   element={<PrivacyPage />} />
      <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/" />} />
      <Route path="/job/:id"   element={user ? <JobPage />       : <Navigate to="/" />} />
    </Routes>
  )
}
