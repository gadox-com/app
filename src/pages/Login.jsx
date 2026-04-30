import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_BASE64 } from '../assets/logo.js'
import { Eye, EyeOff, LogIn } from 'lucide-react'

const CATTLE_PATTERN = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><g stroke='%23bbbbbb' stroke-width='0.7' fill='none'><ellipse cx='80' cy='88' rx='30' ry='17'/><ellipse cx='50' cy='76' rx='11' ry='9'/><line x1='61' y1='76' x2='70' y2='82'/><ellipse cx='40' cy='78' rx='6' ry='4'/><path d='M44,68 Q39,59 34,61'/><path d='M52,67 Q52,58 57,59'/><path d='M42,72 Q35,67 37,73'/><line x1='68' y1='103' x2='66' y2='122'/><line x1='76' y1='104' x2='75' y2='123'/><line x1='96' y1='103' x2='94' y2='122'/><line x1='104' y1='102' x2='104' y2='121'/><path d='M112,84 Q122,77 120,88 Q125,91 120,96'/><path d='M70,103 Q80,112 104,103'/><path d='M70,72 Q80,67 96,72'/></g></svg>`

const patternUrl = `url("data:image/svg+xml,${CATTLE_PATTERN}")`

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

      {/* ESQUERDA — pattern + logo */}
      <div
        className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: '#EBEBEB',
          backgroundImage: patternUrl,
          backgroundSize: '160px 160px',
        }}
      >
        {/* vinheta suave nas bordas */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #EBEBEB 100%)' }}
        />

        <div className="relative z-10 flex flex-col items-center px-16 text-center">
          {/* Logo preto — 4x grande */}
          <img
            src={LOGO_BASE64}
            alt="Fazenda São Brás"
            style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
          />
          <div className="w-8 h-px bg-gray-400 mt-6 mb-5 opacity-40" />
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-400">
            Controle de Gado
          </p>
        </div>
      </div>

      {/* DIREITA — formulário branco */}
      <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col items-center justify-center bg-white px-10 py-12 shadow-2xl">

        {/* Logo mobile */}
        <div className="lg:hidden mb-10 text-center">
          <img
            src={LOGO_BASE64}
            alt="Fazenda São Brás"
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
            className="mx-auto"
          />
        </div>

        <div className="w-full max-w-xs">
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
