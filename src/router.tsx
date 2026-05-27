import { createBrowserRouter } from 'react-router-dom'
import { AdminRoute } from '@/components/AdminRoute'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminPage from '@/pages/admin/AdminPage'
import CadastroPage from '@/pages/artista/CadastroPage'
import DashboardPage from '@/pages/artista/DashboardPage'
import EsqueciSenhaPage from '@/pages/artista/EsqueciSenhaPage'
import HistoricoPage from '@/pages/artista/HistoricoPage'
import LoginPage from '@/pages/artista/LoginPage'
import NovoShowPage from '@/pages/artista/NovoShowPage'
import PerfilPage from '@/pages/artista/PerfilPage'
import RedefinirSenhaPage from '@/pages/artista/RedefinirSenhaPage'
import RepertorioPage from '@/pages/artista/RepertorioPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ShowPage from '@/pages/public/ShowPage'
import RootPage from '@/pages/RootPage'

export const router = createBrowserRouter([
  { path: '/', element: <RootPage /> },
  { path: '/show/:showId', element: <ShowPage /> },
  { path: '/artista/login', element: <LoginPage /> },
  { path: '/artista/cadastro', element: <CadastroPage /> },
  { path: '/artista/esqueci-senha', element: <EsqueciSenhaPage /> },
  { path: '/artista/redefinir-senha', element: <RedefinirSenhaPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/artista/dashboard', element: <DashboardPage /> },
      { path: '/artista/repertorio', element: <RepertorioPage /> },
      { path: '/artista/historico', element: <HistoricoPage /> },
      { path: '/artista/show/novo', element: <NovoShowPage /> },
      { path: '/artista/perfil', element: <PerfilPage /> },
    ],
  },
  {
    element: <AdminRoute />,
    children: [{ path: '/admin', element: <AdminPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
])
