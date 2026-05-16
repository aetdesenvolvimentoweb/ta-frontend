import { Navigate, Outlet } from 'react-router-dom'

export function ProtectedRoute() {
  const token = sessionStorage.getItem('jwt')
  if (!token) return <Navigate to="/artista/login" replace />
  return <Outlet />
}
