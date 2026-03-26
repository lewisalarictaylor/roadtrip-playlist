import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.ts'
import { useEffect } from 'react'
import { HomePage }      from './pages/HomePage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { JobPage }       from './pages/JobPage.tsx'

export default function App() {
  const { user, loading, fetchMe } = useAuthStore()

  useEffect(() => { fetchMe() }, [fetchMe])

  // Don't evaluate protected routes until the session check has completed.
  // Without this, user is null for the brief moment fetchMe() is in-flight,
  // and the <Navigate> guard fires before we know if they're logged in.
  if (loading) return null

  return (
    <Routes>
      <Route path="/"          element={<HomePage />} />
      <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/" />} />
      <Route path="/job/:id"   element={user ? <JobPage />       : <Navigate to="/" />} />
    </Routes>
  )
}
