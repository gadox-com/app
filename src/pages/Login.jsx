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
    <div className="min-h-screen flex items-center justify-center p-6" style={{
      backgroundImage: 'linear-gradient(135deg, #1E5A09 0%, #58C734 60%, #2d7a10 100%), repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,0.06) 28px, rgba(255,255,255,0.06) 29px)',
      position: 'relative',
    }}>
      {/* Brilho suave no canto superior direito */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.10) 0%, transparent 55%)',
      }} />
      {/* Brilho suave no canto inferior esquerdo */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 15% 90%, rgba(30,90,9,0.5) 0%, transparent 50%)',
      }} />
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden flex shadow-2xl" style={{ minHeight: '520px' }}>

        {/* ESQUERDA — foto */}
        <div className="hidden lg:block flex-1 relative overflow-hidden">
          <img
            src={FAZENDA_BG}
            alt="GadoX"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(30,90,9,0.3), rgba(0,0,0,0.1))' }} />
          {/* Badge sobre a foto */}
          <div className="absolute bottom-8 left-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <span className="text-white text-sm font-semibold">Controle de Rebanho</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            </div>
          </div>
        </div>

        {/* DIREITA — formulário */}
        <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col justify-center px-10 py-12">

          {/* Logo */}
          <div className="mb-10">
            <img src={LOGO_BASE64} alt="GadoX" className="h-16 w-auto object-contain" />
            <div className="w-10 h-0.5 mt-5 rounded-full" style={{ background: '#58C734' }} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo</h2>
          <p className="text-sm text-gray-400 mb-8">Entre com sua conta para continuar</p>

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
                required autoFocus autoComplete="email"
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
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg, #58C734, #45a827)' }}>
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