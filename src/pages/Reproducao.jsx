import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Syringe, RefreshCw, Search } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ReproducaoModal from '../components/ReproducaoModal'

export default function Reproducao() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroResultado, setFiltroResultado] = useState('Todos')
  const [modal, setModal] = useState({ open: false, animal: null })

  useEffect(() => { fetchDados() }, [])

  async function fetchDados() {
    setLoading(true)
    const { data } = await supabase
      .from('reproducao')
      .select(`*, animais (id, brinco, raca, categoria, status)`)
      .order('created_at', { ascending: false })
    setDados(data || [])
    setLoading(false)
  }

  const filtered = dados.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q || d.animais?.brinco?.toLowerCase().includes(q) || d.animais?.raca?.toLowerCase().includes(q)
    const matchResult = filtroResultado === 'Todos' || d.resultado === filtroResultado
    return matchSearch && matchResult
  })

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

  const resultadoBadge = (r) => {
    const map = {
      POSITIVO: 'bg-green-50 text-green-700',
      NEGATIVO: 'bg-red-50 text-red-600',
      AGUARDANDO: 'bg-yellow-50 text-yellow-600',
    }
    return `px-2 py-0.5 rounded-full text-xs font-medium ${map[r] || 'bg-gray-100 text-gray-600'}`
  }

  const stats = {
    total: dados.length,
    positivos: dados.filter(d => d.resultado === 'POSITIVO').length,
    aguardando: dados.filter(d => d.resultado === 'AGUARDANDO').length,
    taxa: dados.length ? ((dados.filter(d => d.resultado === 'POSITIVO').length / dados.filter(d => d.resultado !== 'AGUARDANDO').length) * 100 || 0).toFixed(0) : 0,
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reprodução</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} registros</p>
        </div>
        <button onClick={fetchDados} className="btn-secondary p-2">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Inseminações', value: stats.total },
          { label: 'Positivos', value: stats.positivos, color: 'text-green-600' },
          { label: 'Aguardando', value: stats.aguardando, color: 'text-yellow-600' },
          { label: 'Taxa de Prenhez', value: `${stats.taxa}%`, color: 'text-orange-500' },
        ].map(m => (
          <div key={m.label} className="card p-4">
            <div className="text-xs text-gray-500 font-medium mb-1">{m.label}</div>
            <div className={`text-2xl font-bold ${m.color || 'text-gray-900'}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Buscar por brinco ou raça..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-40" value={filtroResultado} onChange={e => setFiltroResultado(e.target.value)}>
          {['Todos', 'POSITIVO', 'NEGATIVO', 'AGUARDANDO'].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Brinco', 'Raça', 'Protocolo', 'Inseminação', 'Touro', 'Peso', 'Resultado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">Nenhum registro encontrado</td></tr>
                )}
                {filtered.map(d => (
                  <tr
                    key={d.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => d.animais && setModal({ open: true, animal: d.animais })}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900">{d.animais?.brinco || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{d.animais?.raca || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(d.data_protocolo)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(d.data_inseminacao)}</td>
                    <td className="px-4 py-3 text-gray-600">{d.touro || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{d.peso ? `${d.peso} kg` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={resultadoBadge(d.resultado)}>{d.resultado || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ReproducaoModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, animal: null })}
        animal={modal.animal}
      />
    </div>
  )
}
