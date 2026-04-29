import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
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
  const [currentPage, setCurrentPage] = useState('dashboard')
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={session.user}
      />
      <main className="flex-1 overflow-auto">
        <PageComponent onNavigate={setCurrentPage} />
      </main>
    </div>
  )
}
