import {
  LayoutDashboard, Home, Syringe, ShoppingCart,
  BarChart3, Menu, Beef, LogOut, Search,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LOGO_BASE64 } from '../assets/logo.js'
import { FAVICON_BASE64 } from '../assets/favicon.js'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'busca',     label: 'Busca Rápida', icon: Search },
  { id: 'animais',   label: 'Animais',   icon: Beef },
  { id: 'confinamento', label: 'Confinamento', icon: Home },
  { id: 'reproducao',  label: 'Reprodução',   icon: Syringe },
  { id: 'vendas',      label: 'Vendas',        icon: ShoppingCart },
  { id: 'relatorios',  label: 'Relatórios',    icon: BarChart3 },
]

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle, user }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────── */}
      <aside className={`
        hidden lg:flex flex-col bg-white border-r border-gray-100
        transition-all duration-200 ease-in-out flex-shrink-0
        ${isOpen ? 'w-60' : 'w-16'} h-screen
      `}>
        {/* Logo */}
        <div className="border-b border-gray-100 min-h-[80px] flex flex-col justify-center">
          {isOpen ? (
            <div className="px-4 py-4 flex items-center justify-between gap-3">
              <img
                src={LOGO_BASE64}
                alt="GadoX"
                className="h-14 w-auto object-contain"
              />
              <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0">
                <Menu size={15} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 gap-2">
              <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <Menu size={15} />
              </button>
              <img src={FAVICON_BASE64} alt="GadoX" className="w-8 h-8 object-contain" />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={!isOpen ? item.label : ''}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                  ${!isOpen ? 'justify-center' : ''}
                `}
              >
                <Icon size={18} className="flex-shrink-0" />
                {isOpen && <span className="truncate">{item.label}</span>}
                {isOpen && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          {isOpen ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-700 truncate">{user?.email?.split('@')[0]}</div>
                <div className="text-xs text-gray-400 truncate">{user?.email}</div>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2" title="Sair">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Sair">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-pb">
        <div className="flex items-stretch">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-w-0
                  transition-colors duration-150 relative
                  ${isActive ? 'text-orange-500' : 'text-gray-400'}
                `}
              >
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full" />}
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className={`text-[9px] font-semibold truncate w-full text-center px-0.5 ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
          <button onClick={handleLogout} className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400 hover:text-red-400 transition-colors">
            <LogOut size={20} strokeWidth={1.8} />
            <span className="text-[9px] font-semibold">Sair</span>
          </button>
        </div>
      </nav>
    </>
  )
}
