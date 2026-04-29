import { useState } from 'react'
import Sidebar from './components/Sidebar'
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
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const PageComponent = PAGES[currentPage] || Dashboard

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`flex-1 overflow-auto transition-all duration-200 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
        <PageComponent onNavigate={setCurrentPage} />
      </main>
    </div>
  )
}
