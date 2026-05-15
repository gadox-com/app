import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_BASE64 } from '../assets/logo.js'
import { FAZENDA_BG } from '../assets/fazenda_bg.js'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const email = usuario.trim().toLowerCase().includes('@')
    ? usuario.trim().toLowerCase()
    : `${usuario.trim().toLowerCase()}@saobras.com`

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!usuario.trim()) return setError('Informe o usuário')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      onLogin()
    } catch {
      setError('Usuário ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ESQUERDA — foto da fazenda */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img src={FAZENDA_BG} alt="Fazenda" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.82 }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-black/20" />

        {/* Badge GadoX sobre a foto */}
        <div className="absolute bottom-10 left-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
            <span className="text-white text-sm font-semibold">Controle de Rebanho</span>
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* DIREITA — formulário */}
      <div className="w-full lg:w-[440px] flex-shrink-0 flex flex-col items-center justify-center bg-white px-10 py-12 shadow-2xl relative z-10">
        <div className="w-full max-w-xs">

          {/* Logo GadoX */}
          <div className="mb-10 flex flex-col items-start">
            <img
              src={LOGO_BASE64}
              alt="GadoX"
              className="h-12 w-auto object-contain"
            />
            <div className="w-10 h-0.5 bg-orange-500 mt-5 rounded-full" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Bem-vindo</h2>
          <p className="text-sm text-gray-400 mb-7">Entre com sua conta para continuar</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Usuário</label>
              <div className="flex items-center input-field p-0 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 outline-none bg-transparent text-sm"
                  placeholder="seu nome"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  required autoFocus autoComplete="username" autoCapitalize="none"
                />
                <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-l border-gray-200 select-none whitespace-nowrap">
                  @saobras.com
                </span>
              </div>
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
              <LogIn size={16} />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-gray-300 text-xs mt-10">
            © {new Date().getFullYear()} GadoX · Controle de Rebanho
          </p>
        </div>
      </div>
    </div>
  )
}