import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MapPin, RefreshCw, AlertCircle, ChevronRight, Clock } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimalModal from '../components/AnimalModal'

const FAZENDAS = [
  { key: 'SARANDI', label: 'Sarandi', emoji: '🌾' },
  { key: 'CASA', label: 'Casa', emoji: '🏠' },
  { key: 'CAPANEMA', label: 'Capanema', emoji: '🌿' },
]

const CATEGORIAS_ORDER = ['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']

function StatBox({ label, value, color = 'text-gray-900', size = 'normal' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-3 py-2">
      <div className={`font-bold leading-tight ${size === 'large' ? 'text-3xl' : 'text-xl'} ${color}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400 font-medium mt-0.5 whitespace-nowrap">{label}</div>
    </div>
  )
}

function Divider() {
  return <div className="w-px bg-gray-100 self-stretch my-1" />
}

export default function Dashboard({ onNavigate }) {
  const [animais, setAnimais] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalAnimal, setModalAnimal] = useState({ open: false, data: null })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      let all = []
      let from = 0
      while (true) {
        const { data, error } = await supabase.from('animais').select('*').range(from, from + 999)
        if (error) throw error
        all = [...all, ...(data || [])]
        if (!data || data.length < 1000) break
        from += 1000
      }
      setAnimais(all)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6 lg:p-8"><LoadingSpinner text="Carregando..." /></div>
  if (error) return (
    <div className="p-6 lg:p-8">
      <div className="card p-8 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="font-semibold text-gray-900">{error}</p>
      </div>
    </div>
  )

  const ativos = animais.filter(a => a.status === 'ATIVO')
  const vendidos = animais.filter(a => a.status === 'VENDIDO')
  const machos = ativos.filter(a => a.sexo === 'MACHO')
  const femeas = ativos.filter(a => a.sexo === 'FÊMEA')
  const bezerros = ativos.filter(a => ['BEZERRO', 'BEZERRA'].includes(a.categoria))
  const novilhos = ativos.filter(a => ['NOVILHO', 'NOVILHA'].includes(a.categoria))
  const vacas = ativos.filter(a => a.categoria === 'VACA')
  const touros = ativos.filter(a => a.categoria === 'TOURO')
  const bois = ativos.filter(a => a.categoria === 'BOI')
  const totalVendas = vendidos.reduce((s, a) => s + (a.preco_venda || 0), 0)

  const recentes = [...animais]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 8)

  const formatDate = (d) => {
    if (!d) return '—'
    const date = new Date(d)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'agora'
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <div className="p-6 lg:p-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral do rebanho</p>
        </div>
        <button onClick={fetchData} className="btn-secondary p-2" title="Atualizar">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* BLOCO 1 — Totais gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Total / Ativos / Vendidos */}
        <div className="card p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">🐄 Rebanho</div>
          <div className="flex items-stretch divide-x divide-gray-100">
            <StatBox label="Total" value={animais.length} color="text-gray-900" size="large" />
            <StatBox label="Ativos" value={ativos.length} color="text-green-600" size="large" />
            <StatBox label="Vendidos" value={vendidos.length} color="text-gray-400" />
          </div>
          {totalVendas > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <div className="text-xs text-gray-400 mb-0.5">💰 Total em Vendas</div>
              <div className="text-base font-bold text-green-700">
                R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </div>
            </div>
          )}
        </div>

        {/* Machos / Fêmeas */}
        <div className="card p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">⚥ Sexo</div>
          <div className="flex items-stretch divide-x divide-gray-100">
            <StatBox label="🐂 Machos" value={machos.length} color="text-blue-600" size="large" />
            <StatBox label="🐄 Fêmeas" value={femeas.length} color="text-pink-500" size="large" />
          </div>
        </div>

        {/* Categorias */}
        <div className="card p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">🏷️ Categorias</div>
          <div className="grid grid-cols-3 gap-y-3">
            {[
              { label: '🍼 Bezerros', value: bezerros.length },
              { label: '📈 Novilhos', value: novilhos.length },
              { label: '🐄 Vacas', value: vacas.length },
              { label: '🐂 Touros', value: touros.length },
              { label: '🥩 Bois', value: bois.length },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="text-lg font-bold text-gray-700">{item.value}</div>
                <div className="text-xs text-gray-400 leading-tight">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BLOCO 2 — Cards por fazenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {FAZENDAS.map(({ key, label, emoji }) => {
          const lista = ativos.filter(a => a.local === key)
          const ultimos = [...lista]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)

          // Contagem por categoria
          const cats = CATEGORIAS_ORDER
            .map(c => ({ cat: c, count: lista.filter(a => a.categoria === c).length }))
            .filter(x => x.count > 0)

          return (
            <div key={key} className="card flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{emoji}</span>
                    <span className="font-bold text-gray-900">{label}</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-500">{lista.length}</span>
                </div>
                {/* Categorias em chips */}
                <div className="flex flex-wrap gap-1.5">
                  {cats.length === 0 ? (
                    <span className="text-xs text-gray-400">Nenhum ativo</span>
                  ) : cats.map(({ cat, count }) => (
                    <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                      <span className="font-bold text-gray-900">{count}</span>
                      <span>{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Lista prévia */}
              <div className="flex-1 divide-y divide-gray-50">
                {ultimos.length === 0 ? (
                  <div className="px-5 py-6 text-center text-sm text-gray-400">
                    Nenhum animal nesta fazenda
                  </div>
                ) : (
                  ultimos.map(animal => (
                    <button
                      key={animal.id}
                      onClick={() => setModalAnimal({ open: true, data: animal })}
                      className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <span className="font-mono text-xs font-bold text-gray-300 w-7 flex-shrink-0">
                        {animal.brinco}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{animal.raca}</div>
                        <div className="text-xs text-gray-400">
                          {animal.categoria} · {animal.sexo === 'MACHO' ? '♂' : '♀'}
                          {animal.peso ? ` · ${animal.peso}kg` : ''}
                        </div>
                      </div>
                      <ChevronRight size={13} className="text-gray-200 group-hover:text-orange-400 flex-shrink-0 transition-colors" />
                    </button>
                  ))
                )}
              </div>

              {lista.length > 5 && (
                <button
                  onClick={() => onNavigate('animais')}
                  className="px-5 py-2.5 border-t border-gray-100 text-xs font-semibold text-orange-500 hover:bg-orange-50 transition-colors text-center"
                >
                  + {lista.length - 5} animais — ver todos →
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* BLOCO 3 — Últimas alterações */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-orange-500" />
            <span className="font-bold text-gray-900 text-sm">Últimas Alterações</span>
          </div>
          <button onClick={() => onNavigate('animais')} className="text-xs text-orange-500 hover:text-orange-600 font-semibold">
            Ver todos →
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {recentes.map(animal => (
            <button
              key={animal.id}
              onClick={() => setModalAnimal({ open: true, data: animal })}
              className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors text-left group"
            >
              {/* Brinco */}
              <span className="font-mono text-xs font-bold text-gray-400 w-8 flex-shrink-0">
                #{animal.brinco}
              </span>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">{animal.raca}</span>
                  <span className="text-xs text-gray-400 hidden sm:inline">·</span>
                  <span className="text-xs text-gray-500 hidden sm:inline">{animal.categoria}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{animal.local}</span>
                  {animal.peso && <>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-500 font-medium">{animal.peso} kg</span>
                  </>}
                </div>
              </div>

              {/* Status + tempo */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full hidden sm:inline-block ${
                  animal.status === 'ATIVO' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {animal.status === 'ATIVO' ? '● Ativo' : '○ Vendido'}
                </span>
                <span className="text-xs text-gray-400 w-16 text-right">
                  {formatDate(animal.updated_at || animal.created_at)}
                </span>
                <ChevronRight size={14} className="text-gray-200 group-hover:text-orange-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <AnimalModal
        isOpen={modalAnimal.open}
        onClose={() => setModalAnimal({ open: false, data: null })}
        animal={modalAnimal.data}
        onSaved={fetchData}
      />
    </div>
  )
}
