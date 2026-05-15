import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_BASE64 } from '../assets/logo.js'
import { FAZENDA_BG } from '../assets/fazenda_bg.js'
import { Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Informe o email')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (error) throw error
      onLogin()
    } catch {
      setError('Email ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ESQUERDA — imagem */}
      <div className="hidden lg:block w-[45%] flex-shrink-0 relative overflow-hidden rounded-r-3xl">
        <img
          src={FAZENDA_BG}
          alt="GadoX"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />

        {/* Badge inferior */}
        <div className="absolute bottom-10 left-10">
          <div className="inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-2.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
            <span className="text-white text-sm font-semibold">Gestão de Gado</span>
          </div>
        </div>
      </div>

      {/* DIREITA — formulário */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="mb-8">
            <img src={LOGO_BASE64} alt="GadoX" style={{ height: 84, width: 'auto' }} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Acesse sua conta</h2>
          <p className="text-sm text-gray-400 mb-8">Entre com suas credenciais para continuar</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required autoFocus autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12 bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-2">
              {loading ? 'Entrando...' : 'Acessar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-8">
            Primeira vez por aqui?{' '}
            <a
              href="https://wa.me/5500000000000?text=Olá! Quero contratar o GadoX."
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
            >
              Fale com nosso suporte
            </a>
          </p>

          <p className="text-center text-gray-300 text-xs mt-6">
            © {new Date().getFullYear()} GadoX · Controle de Rebanho
          </p>
        </div>
      </div>
    </div>
  )
}
