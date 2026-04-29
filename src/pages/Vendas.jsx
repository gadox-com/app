import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ShoppingCart, RefreshCw, Search, TrendingUp, DollarSign } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Vendas() {
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchVendas() }, [])

  async function fetchVendas() {
    setLoading(true)
    const { data } = await supabase
      .from('animais')
      .select('*')
      .eq('status', 'VENDIDO')
      .order('saida', { ascending: false })
    setVendas(data || [])
    setLoading(false)
  }

  const filtered = vendas.filter(v => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return v.brinco?.toLowerCase().includes(q) || v.raca?.toLowerCase().includes(q) || v.categoria?.toLowerCase().includes(q)
  })

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
  const formatMoney = (v) => v ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'

  const totalArrecadado = vendas.reduce((s, v) => s + (v.preco_venda || 0), 0)
  const pesoTotal = vendas.filter(v => v.peso).reduce((s, v) => s + v.peso, 0)
  const precoMedioKg = pesoTotal > 0 && totalArrecadado > 0
    ? (totalArrecadado / pesoTotal).toFixed(2)
    : null

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{vendas.length} animais vendidos</p>
        </div>
        <button onClick={fetchVendas} className="btn-secondary p-2">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={14} className="text-orange-500" />
            <span className="text-xs text-gray-500 font-medium">Total Vendidos</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{vendas.length}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-green-600" />
            <span className="text-xs text-gray-500 font-medium">Total Arrecadado</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{formatMoney(totalArrecadado)}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-orange-500" />
            <span className="text-xs text-gray-500 font-medium">Preço Médio/kg</span>
          </div>
          <div className="text-2xl font-bold text-orange-500">
            {precoMedioKg ? `R$ ${precoMedioKg}` : '—'}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Buscar por brinco, raça ou categoria..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Brinco', 'Raça', 'Categoria', 'Data Saída', 'Peso', 'Valor Venda', 'R$/kg', 'Motivo'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">Nenhuma venda encontrada</td></tr>
                )}
                {filtered.map(v => {
                  const precoKg = v.preco_venda && v.peso
                    ? (v.preco_venda / v.peso).toFixed(2)
                    : null
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900">{v.brinco}</td>
                      <td className="px-4 py-3 text-gray-700">{v.raca}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{v.categoria}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(v.saida)}</td>
                      <td className="px-4 py-3 text-gray-700">{v.peso ? `${v.peso} kg` : '—'}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">{formatMoney(v.preco_venda)}</td>
                      <td className="px-4 py-3 text-gray-600">{precoKg ? `R$ ${precoKg}` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{v.motivo_saida || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
