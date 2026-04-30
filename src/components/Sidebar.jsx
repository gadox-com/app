import {
  LayoutDashboard,
  Home,
  Syringe,
  ShoppingCart,
  BarChart3,
  Menu,
  Beef,
  LogOut,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

import { LOGO_BASE64 } from '../assets/logo.js'
import { FAVICON_BASE64 } from '../assets/favicon.js'
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'animais', label: 'Animais', icon: Beef },
  { id: 'confinamento', label: 'Confinamento', icon: Home },
  { id: 'reproducao', label: 'Reprodução', icon: Syringe },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
]

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle, user }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          flex flex-col bg-white border-r border-gray-100
          transition-all duration-200 ease-in-out
          ${isOpen ? 'w-60' : 'w-16'}
          h-screen flex-shrink-0
        `}
      >
        {/* Header */}
        <div className="border-b border-gray-100 min-h-[72px] flex flex-col justify-center">
          {isOpen ? (
            <div className="px-5 py-4 flex items-center justify-between gap-3">
              <img
                src={LOGO_BASE64}
                alt="Fazenda São Brás"
                className="w-full max-w-[148px] h-auto object-contain"
                style={{ filter: 'brightness(0) saturate(100%) invert(15%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(85%)' }}
              />
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0"
              >
                <Menu size={15} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 gap-2">
              <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <Menu size={15} />
              </button>
              <img
                src={FAVICON_BASE64}
                alt="São Brás"
                className="w-24 h-24 object-contain"
              />
            </div>
          )}
        </div>

        {!isOpen && (
          <button
            onClick={onToggle}
            className="p-3 flex justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${!isOpen ? 'justify-center' : ''}
                `}
                title={!isOpen ? item.label : ''}
              >
                <Icon size={18} className="flex-shrink-0" />
                {isOpen && <span className="truncate">{item.label}</span>}
                {isOpen && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          {isOpen ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-700 truncate">{user?.email?.split('@')[0]}</div>
                <div className="text-xs text-gray-400 truncate">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                title="Sair"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
