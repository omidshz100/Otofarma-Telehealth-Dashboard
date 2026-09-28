import { Navigate, Route, Routes } from 'react-router-dom'
import { token } from './api'
import { Shell } from './layout'
import { AppEditor } from './pages/AppEditor'
import { AppsPage } from './pages/AppsPage'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { UserEditor } from './pages/UserEditor'
import { UsersPage } from './pages/UsersPage'
import type { ReactNode } from 'react'

function Private({ children }: { children: ReactNode }) {
  if (!token()) return <Navigate to="/login" replace />
  return <Shell>{children}</Shell>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Private><Home /></Private>} />
      <Route path="/apps" element={<Private><AppsPage /></Private>} />
      <Route path="/apps/new" element={<Private><AppEditor /></Private>} />
      <Route path="/apps/:id" element={<Private><AppEditor /></Private>} />
      <Route path="/users" element={<Private><UsersPage /></Private>} />
      <Route path="/users/new" element={<Private><UserEditor /></Private>} />
      <Route path="/users/:id" element={<Private><UserEditor /></Private>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
