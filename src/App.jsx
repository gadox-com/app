import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import { RoleProvider } from './lib/role.jsx'
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('ERROR:', error, info) }
  render() {
    if (this.state.error) return (
      <div style={{padding:32,fontFamily:'monospace'}}>
        <h2 style={{color:'red'}}>Erro capturado:</h2>
        <pre style={{background:'#f5f5f5',padding:16,borderRadius:8,overflow:'auto'}}>
          {this.state.error.toString()}
        </pre>
        <button onClick={() => this.setState({error:null})} style={{marginTop:16,padding:'8px 16px'}}>Tentar novamente</button>
      </div>
    )
    return this.props.children
  }
}
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Animais from './pages/Animais'
import Confinamento from './pages/Confinamento'
import Reproducao from './pages/Reproducao'
import Vendas from './pages/Vendas'
import Relatorios from './pages/Relatorios'

const PAGES = {
  dashboard: Dashboard,
  animais: Animais,
  confinamento: Confinamento,
  reproducao: Reproducao,
  vendas: Vendas,
  relatorios: Relatorios,
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(() => localStorage.getItem('currentPage') || 'dashboard')
  const navigate = (page) => { setCurrentPage(page); localStorage.setItem('currentPage', page) }
  const [sidebarOpen, setSidebarOpen] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <Login onLogin={() => {}} />
  }

  const PageComponent = PAGES[currentPage] || Dashboard

  return (
    <RoleProvider>
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={session.user}
      />
      {/* pb-16 on mobile to account for bottom nav height */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0 min-w-0">
        <ErrorBoundary key={currentPage}>
          <PageComponent onNavigate={navigate} />
        </ErrorBoundary>
      </main>
    </div>
    </RoleProvider>
  )
}