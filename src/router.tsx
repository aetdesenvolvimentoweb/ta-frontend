import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import RootPage from '@/pages/RootPage'
import ShowPage from '@/pages/public/ShowPage'
import LoginPage from '@/pages/artista/LoginPage'
import CadastroPage from '@/pages/artista/CadastroPage'
import DashboardPage from '@/pages/artista/DashboardPage'
import RepertorioPage from '@/pages/artista/RepertorioPage'
import NovoShowPage from '@/pages/artista/NovoShowPage'
import PerfilPage from '@/pages/artista/PerfilPage'
import AdminPage from '@/pages/admin/AdminPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <RootPage /> },
  { path: '/show/:showId', element: <ShowPage /> },
  { path: '/artista/login', element: <LoginPage /> },
  { path: '/artista/cadastro', element: <CadastroPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/artista/dashboard', element: <DashboardPage /> },
      { path: '/artista/repertorio', element: <RepertorioPage /> },
      { path: '/artista/show/novo', element: <NovoShowPage /> },
      { path: '/artista/perfil', element: <PerfilPage /> },
    ],
  },
  { path: '/admin', element: <AdminPage /> },
  { path: '*', element: <NotFoundPage /> },
])
