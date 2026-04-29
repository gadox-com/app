import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, AlertCircle, ChevronRight, ArrowUpRight, MapPin } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimalModal from '../components/AnimalModal'

const FAZENDAS = [
  { key: 'SARANDI', label: 'Sarandi', emoji: '🌾', bg: 'bg-orange-50', accent: 'text-orange-500', border: 'border-orange-100' },
  { key: 'CASA', label: 'Casa', emoji: '🏠', bg: 'bg-blue-50', accent: 'text-blue-500', border: 'border-blue-100' },
  { key: 'CAPANEMA', label: 'Capanema', emoji: '🌿', bg: 'bg-emerald-50', accent: 'text-emerald-500', border: 'border-emerald-100' },
]

const CATEGORIAS_ORDER = ['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']

export default function Dashboard({ onNavigate }) {
  const [animais, setAnimais] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalAnimal, setModalAnimal] = useState({ open: false, data: null })

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

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

  if (loading) return <div className="p-8"><LoadingSpinner text="Carregando..." /></div>
  if (error) return (
    <div className="p-8">
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

  const formatRelative = (d) => {
    if (!d) return '—'
    const diff = Math.floor((new Date() - new Date(d)) / 1000)
    if (diff < 60) return 'agora'
    if (diff < 3600) return `${Math.floor(diff / 60)}min`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header — greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Fazenda São Brás</h1>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Atualizar">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* KPI Cards — linha 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total do Rebanho', value: animais.length, sub: 'animais cadastrados', icon: '🐄', color: 'text-gray-900', bg: 'bg-gray-900', textBg: 'text-white' },
          { label: 'Animais Ativos', value: ativos.length, sub: `${((ativos.length/animais.length)*100).toFixed(0)}% do total`, icon: '✅', color: 'text-green-600', bg: 'bg-green-500', textBg: 'text-white' },
          { label: 'Vendidos', value: vendidos.length, sub: 'saídas registradas', icon: '📦', color: 'text-gray-500', bg: 'bg-gray-100', textBg: 'text-gray-700' },
          { label: 'Total em Vendas', value: totalVendas > 0 ? `R$\u00a0${(totalVendas/1000).toFixed(0)}k` : '—', sub: 'receita total', icon: '💰', color: 'text-emerald-600', bg: 'bg-emerald-500', textBg: 'text-white' },
        ].map((kpi, i) => (
          <div key={i} className={`rounded-2xl p-5 ${i === 0 ? 'bg-gray-900 text-white' : i === 1 ? 'bg-green-500 text-white' : i === 3 ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-100 shadow-sm'}`}>
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <div className={`text-3xl font-bold leading-none mb-1 ${i === 2 ? 'text-gray-700' : 'text-white'} ${i === 2 ? '' : ''}`}
              style={i === 2 ? { color: '#374151' } : { color: 'white' }}>
              {kpi.value}
            </div>
            <div className={`text-xs font-semibold mt-1 ${i === 2 ? 'text-gray-500' : 'text-white/70'}`}>{kpi.label}</div>
            <div className={`text-xs mt-0.5 ${i === 2 ? 'text-gray-400' : 'text-white/50'}`}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* KPI Cards — linha 2: sexo + categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Sexo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">⚥ Distribuição por Sexo</p>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-4xl font-bold text-blue-600">{machos.length}</div>
              <div className="text-sm text-gray-400 mt-0.5 font-medium">🐂 Machos</div>
              <div className="text-xs text-gray-300">{ativos.length ? ((machos.length/ativos.length)*100).toFixed(0) : 0}% do rebanho</div>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: ativos.length ? `${(machos.length/ativos.length)*100}%` : '0%' }}
                />
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-pink-400 rounded-full transition-all"
                  style={{ width: ativos.length ? `${(femeas.length/ativos.length)*100}%` : '0%' }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-pink-500">{femeas.length}</div>
              <div className="text-sm text-gray-400 mt-0.5 font-medium">🐄 Fêmeas</div>
              <div className="text-xs text-gray-300">{ativos.length ? ((femeas.length/ativos.length)*100).toFixed(0) : 0}% do rebanho</div>
            </div>
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">🏷️ Por Categoria</p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Bezerros', value: bezerros.length, emoji: '🍼' },
              { label: 'Novilhos', value: novilhos.length, emoji: '📈' },
              { label: 'Vacas', value: vacas.length, emoji: '🐄' },
              { label: 'Touros', value: touros.length, emoji: '🐂' },
              { label: 'Bois', value: bois.length, emoji: '🥩' },
            ].map(c => (
              <div key={c.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                <div className="text-lg mb-0.5">{c.emoji}</div>
                <div className="text-xl font-bold text-gray-900">{c.value}</div>
                <div className="text-xs text-gray-400 leading-tight">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cards por fazenda */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">🗺️ Por Fazenda</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {FAZENDAS.map(({ key, label, emoji, bg, accent, border }) => {
            const lista = ativos.filter(a => a.local === key)
            const ultimos = [...lista]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 5)
            const cats = CATEGORIAS_ORDER
              .map(c => ({ cat: c, count: lista.filter(a => a.categoria === c).length }))
              .filter(x => x.count > 0)

            return (
              <div key={key} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${border}`}>
                {/* Header */}
                <div className={`${bg} px-5 pt-4 pb-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{emoji}</span>
                      <span className="font-bold text-gray-900">{label}</span>
                    </div>
                    <span className={`text-3xl font-bold ${accent}`}>{lista.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {cats.length === 0
                      ? <span className="text-xs text-gray-400">Nenhum ativo</span>
                      : cats.map(({ cat, count }) => (
                        <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/70 rounded-full text-xs font-semibold text-gray-700">
                          {count} <span className="font-normal text-gray-500">{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                        </span>
                      ))
                    }
                  </div>
                </div>

                {/* Lista */}
                <div className="divide-y divide-gray-50">
                  {ultimos.length === 0 ? (
                    <div className="px-5 py-5 text-center text-sm text-gray-400">Nenhum animal</div>
                  ) : ultimos.map(animal => (
                    <button
                      key={animal.id}
                      onClick={() => setModalAnimal({ open: true, data: animal })}
                      className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <span className="font-mono text-xs text-gray-300 w-6 flex-shrink-0">{animal.brinco}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800">{animal.raca}</span>
                        <span className="text-xs text-gray-400 ml-2">{animal.categoria} · {animal.sexo === 'MACHO' ? '♂' : '♀'}</span>
                      </div>
                      {animal.peso
                        ? <span className="text-xs font-bold text-gray-500">{animal.peso}kg</span>
                        : null
                      }
                      <ChevronRight size={13} className="text-gray-200 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>

                {lista.length > 5 && (
                  <button
                    onClick={() => onNavigate('animais')}
                    className={`w-full py-2.5 text-xs font-bold ${accent} hover:opacity-80 transition-opacity border-t ${border} text-center`}
                  >
                    Ver todos os {lista.length} animais →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Últimas alterações */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">🕐 Últimas Alterações</h2>
          <button onClick={() => onNavigate('animais')} className="text-xs text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1">
            Ver todos <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {recentes.map((animal, i) => (
              <button
                key={animal.id}
                onClick={() => setModalAnimal({ open: true, data: animal })}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
              >
                {/* Index */}
                <span className="text-xs font-bold text-gray-200 w-4 flex-shrink-0">{i + 1}</span>

                {/* Brinco badge */}
                <span className="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md flex-shrink-0">
                  #{animal.brinco}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{animal.raca}</span>
                    <span className="text-xs text-gray-400">{animal.categoria}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    📍 {animal.local}
                    {animal.peso ? ` · ⚖️ ${animal.peso}kg` : ''}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full ${
                    animal.status === 'ATIVO'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {animal.status === 'ATIVO' ? '● Ativo' : '○ Vendido'}
                  </span>
                  <span className="text-xs text-gray-300 w-8 text-right">
                    {formatRelative(animal.updated_at || animal.created_at)}
                  </span>
                  <ChevronRight size={14} className="text-gray-200 group-hover:text-orange-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
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
