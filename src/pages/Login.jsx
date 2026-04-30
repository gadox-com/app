import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_BASE64 } from '../assets/logo.js'
import { FAZENDA_BG } from '../assets/fazenda_bg.js'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      onLogin()
    } catch (err) {
      setError('Email ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ESQUERDA — foto da fazenda */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        {/* Foto */}
        <img
          src={FAZENDA_BG}
          alt="Fazenda São Brás"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.82 }}
        />
        {/* Overlay preto para escurecer */}
        <div className="absolute inset-0 bg-black/40" />
        {/* Gradiente sutil na borda direita para transição suave */}
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-black/20" />
      </div>

      {/* DIREITA — formulário */}
      <div className="w-full lg:w-[440px] flex-shrink-0 flex flex-col items-center justify-center bg-white px-10 py-12 shadow-2xl relative z-10">
        <div className="w-full max-w-xs">

          {/* Logo grande */}
          <div className="mb-10">
            <img
              src={LOGO_BASE64}
              alt="Fazenda São Brás"
              className="w-full h-auto object-contain"
              style={{ maxHeight: '90px' }}
            />
            <div className="w-10 h-px bg-gray-200 mt-5 mb-0" />
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
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
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
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <LogIn size={16} />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-gray-300 text-xs mt-10">
            © {new Date().getFullYear()} Fazenda São Brás
          </p>
        </div>
      </div>
    </div>
  )
}
