import { useEffect, Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import { RoleProvider } from './lib/role.jsx'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Animais from './pages/Animais'
import Confinamento from './pages/Confinamento'
import Reproducao from './pages/Reproducao'
import Vendas from './pages/Vendas'
import Relatorios from './pages/Relatorios'
import BuscaRapida from './pages/BuscaRapida'
import Fazendas from './pages/Fazendas'
import Alimentacao from './pages/Alimentacao'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('ERROR:', error, info) }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 32, fontFamily: 'monospace' }}>
        <h2 style={{ color: 'red' }}>Erro capturado:</h2>
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto' }}>
          {this.state.error.toString()}
        </pre>
        <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: '8px 16px' }}>Tentar novamente</button>
      </div>
    )
    return this.props.children
  }
}

// Map routes to page ids for sidebar active state
const ROUTE_TO_PAGE = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/busca-rapida': 'busca',
  '/animais': 'animais',
  '/confinamento': 'confinamento',
  '/reproducao': 'reproducao',
  '/vendas': 'vendas',
  '/relatorios': 'relatorios',
  '/fazendas': 'fazendas',
  '/alimentacao': 'alimentacao',
}

const PAGE_TO_ROUTE = {
  dashboard: '/dashboard',
  busca: '/busca-rapida',
  animais: '/animais',
  confinamento: '/confinamento',
  reproducao: '/reproducao',
  vendas: '/vendas',
  relatorios: '/relatorios',
  fazendas: '/fazendas',
  alimentacao: '/alimentacao',
}

function AppInner({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const currentPage = ROUTE_TO_PAGE[location.pathname] || 'dashboard'

  function handleNavigate(page) {
    const route = PAGE_TO_ROUTE[page] || '/dashboard'
    navigate(route)
  }

  return (
    <RoleProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          user={session.user}
        />
        <main className="flex-1 overflow-auto pb-16 lg:pb-0 min-w-0">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ErrorBoundary key="dashboard"><Dashboard onNavigate={handleNavigate} /></ErrorBoundary>} />
            <Route path="/busca-rapida" element={<ErrorBoundary key="busca"><BuscaRapida onNavigate={handleNavigate} /></ErrorBoundary>} />
            <Route path="/animais" element={<ErrorBoundary key="animais"><Animais onNavigate={handleNavigate} /></ErrorBoundary>} />
            <Route path="/confinamento" element={<ErrorBoundary key="confinamento"><Confinamento onNavigate={handleNavigate} /></ErrorBoundary>} />
            <Route path="/reproducao" element={<ErrorBoundary key="reproducao"><Reproducao onNavigate={handleNavigate} /></ErrorBoundary>} />
            <Route path="/vendas" element={<ErrorBoundary key="vendas"><Vendas onNavigate={handleNavigate} /></ErrorBoundary>} />
            <Route path="/relatorios" element={<ErrorBoundary key="relatorios"><Relatorios onNavigate={handleNavigate} /></ErrorBoundary>} />
            <Route path="/fazendas" element={<ErrorBoundary key="fazendas"><Fazendas /></ErrorBoundary>} />
              <Route path="/alimentacao" element={<ErrorBoundary key="alimentacao"><Alimentacao /></ErrorBoundary>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </RoleProvider>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) return (
    <BrowserRouter>
      <Login onLogin={() => {}} />
    </BrowserRouter>
  )

  return (
    <BrowserRouter>
      <AppInner session={session} />
    </BrowserRouter>
  )
}
