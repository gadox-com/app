import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Home, TrendingUp, RefreshCw, Search } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfinamentoModal from '../components/ConfinamentoModal'

export default function Confinamento() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, animal: null })

  useEffect(() => { fetchDados() }, [])

  async function fetchDados() {
    setLoading(true)
    const { data, error } = await supabase
      .from('confinamento_historico')
      .select(`
        *,
        animais (id, brinco, raca, categoria, status)
      `)
      .order('data_confinamento', { ascending: false })

    if (!error) setDados(data || [])
    setLoading(false)
  }

  const filtered = dados.filter(d => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return d.animais?.brinco?.toLowerCase().includes(q) ||
      d.animais?.raca?.toLowerCase().includes(q)
  })

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

  const gainColor = (g) => {
    if (!g && g !== 0) return ''
    if (g > 0) return 'text-green-600 font-semibold'
    if (g < 0) return 'text-red-500 font-semibold'
    return 'text-gray-500'
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Confinamento</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} registros</p>
        </div>
        <button onClick={fetchDados} className="btn-secondary p-2">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Registros', value: dados.length, icon: Home },
          {
            label: 'Ganho Médio (kg)',
            value: (() => {
              const c = dados.filter(d => d.peso && d.peso_inicial)
              if (!c.length) return '—'
              const avg = c.reduce((s, d) => s + (d.peso - d.peso_inicial), 0) / c.length
              return avg.toFixed(1)
            })(),
            icon: TrendingUp
          },
        ].map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={15} className="text-orange-500" />
                <span className="text-xs text-gray-500 font-medium">{m.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{m.value}</div>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="card p-4 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Buscar por brinco ou raça..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Brinco', 'Raça', 'Categoria', 'Entrada', 'Peso Inicial', 'Peso Atual', 'Data Peso', 'Ganho', 'Obs'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">Nenhum registro encontrado</td></tr>
                )}
                {filtered.map(d => {
                  const ganho = d.peso && d.peso_inicial ? (d.peso - d.peso_inicial) : null
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => d.animais && setModal({ open: true, animal: d.animais })}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900">{d.animais?.brinco || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{d.animais?.raca || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{d.animais?.categoria || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(d.data_confinamento)}</td>
                      <td className="px-4 py-3 text-gray-700">{d.peso_inicial ? `${d.peso_inicial} kg` : '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{d.peso ? `${d.peso} kg` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(d.data_peso)}</td>
                      <td className={`px-4 py-3 ${gainColor(ganho)}`}>
                        {ganho !== null ? `${ganho > 0 ? '+' : ''}${ganho.toFixed(1)} kg` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-32 truncate">{d.observacao || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfinamentoModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, animal: null })}
        animal={modal.animal}
      />
    </div>
  )
}
