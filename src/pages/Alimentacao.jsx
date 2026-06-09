import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Package, TrendingUp, DollarSign, Scale, Loader, ChevronDown, ChevronUp } from 'lucide-react'

const fd = (d) => {
  if (!d) return '—'
  const [y, m, day] = String(d).split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

const diffDias = (d) => {
  if (!d) return 0
  return Math.max(0, Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60 * 24)))
}

export default function Alimentacao() {
  const [racoes, setRacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandida, setExpandida] = useState(null)
  const [form, setForm] = useState({
    nome: '', tipo: '', quantidade_kg: '', preco_total: '', data_compra: new Date().toISOString().split('T')[0], observacao: ''
  })
  const [saving, setSaving] = useState(false)
  const [animaisPorRacao, setAnimaisPorRacao] = useState({})

  useEffect(() => { fetchRacoes() }, [])

  async function fetchRacoes() {
    setLoading(true)
    const { data } = await supabase.from('racoes').select('*').order('data_compra', { ascending: false })
    setRacoes(data || [])
    // Buscar animais por ração
    if (data?.length) {
      const ids = data.map(r => r.id)
      const { data: animais } = await supabase
        .from('animais')
        .select('id, brinco, raca, categoria, peso, racao_id, racao_data_inicio, peso_inicio_dieta')
        .in('racao_id', ids)
        .eq('status', 'ATIVO')
      const mapa = {}
      ids.forEach(id => { mapa[id] = (animais || []).filter(a => a.racao_id === id) })
      setAnimaisPorRacao(mapa)
    }
    setLoading(false)
  }

  async function salvar() {
    if (!form.nome.trim() || !form.data_compra) return
    setSaving(true)
    const { data: uf } = await supabase.from('usuario_fazenda').select('fazenda_id').single()
    await supabase.from('racoes').insert([{ ...form, fazenda_id: uf?.fazenda_id,
      quantidade_kg: form.quantidade_kg ? parseFloat(form.quantidade_kg) : null,
      preco_total: form.preco_total ? parseFloat(form.preco_total) : null,
    }])
    setForm({ nome: '', tipo: '', quantidade_kg: '', preco_total: '', data_compra: new Date().toISOString().split('T')[0], observacao: '' })
    setShowForm(false); setSaving(false); fetchRacoes()
  }

  async function excluir(id) {
    if (!confirm('Excluir esta ração? Os animais vinculados serão desvinculados.')) return
    await supabase.from('animais').update({ racao_id: null, racao_data_inicio: null, peso_inicio_dieta: null }).eq('racao_id', id)
    await supabase.from('racoes').delete().eq('id', id)
    fetchRacoes()
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alimentação</h1>
          <p className="text-sm text-gray-500 mt-0.5">Rações, dietas e custo por kg ganho</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={15} /> Nova ração
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900">Registrar ração / dieta</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Nome da ração / dieta *</label>
              <input className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                placeholder="Ex: Ração Confinamento Fase 2, Silagem de milho..."
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Tipo</label>
              <select className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="">Selecionar...</option>
                <option>Ração concentrada</option>
                <option>Silagem</option>
                <option>Feno</option>
                <option>Pastagem</option>
                <option>Sal mineral</option>
                <option>Mistura</option>
                <option>Outro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Data da compra *</label>
              <input type="date" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                value={form.data_compra} onChange={e => setForm(f => ({ ...f, data_compra: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Quantidade (kg)</label>
              <input type="number" step="0.01" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                placeholder="0" value={form.quantidade_kg} onChange={e => setForm(f => ({ ...f, quantidade_kg: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Valor total (R$)</label>
              <input type="number" step="0.01" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                placeholder="0,00" value={form.preco_total} onChange={e => setForm(f => ({ ...f, preco_total: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Observação</label>
              <input className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                placeholder="Fornecedor, lote, composição..." value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
            </div>
          </div>
          <button onClick={salvar} disabled={saving || !form.nome.trim()}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${form.nome.trim() ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            {saving ? 'Salvando...' : 'Registrar ração'}
          </button>
        </div>
      )}

      {/* Lista de rações */}
      {racoes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">Nenhuma ração registrada</p>
          <p className="text-sm text-gray-400 mt-1">Registre a primeira compra de ração para começar a acompanhar o custo por animal</p>
        </div>
      ) : racoes.map(r => {
        const animais = animaisPorRacao[r.id] || []
        const dias = diffDias(r.data_compra)
        // Ganho total de peso: soma (peso_atual - peso_inicio_dieta) dos animais com ambos
        const ganhoTotal = animais.reduce((s, a) => {
          if (a.peso && a.peso_inicio_dieta) return s + (parseFloat(a.peso) - parseFloat(a.peso_inicio_dieta))
          return s
        }, 0)
        const gmdMedio = animais.length && dias > 0
          ? animais.filter(a => a.peso && a.peso_inicio_dieta).reduce((s, a) => {
              return s + (parseFloat(a.peso) - parseFloat(a.peso_inicio_dieta)) / dias
            }, 0) / Math.max(1, animais.filter(a => a.peso && a.peso_inicio_dieta).length)
          : 0
        const custoPorKgGanho = ganhoTotal > 0 && r.preco_total ? (r.preco_total / ganhoTotal).toFixed(2) : null
        const aberta = expandida === r.id

        return (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header da ração */}
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{r.nome}</h3>
                    {r.tipo && <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{r.tipo}</span>}
                  </div>
                  <p className="text-sm text-gray-500">Comprada em {fd(r.data_compra)} · {dias} dias atrás</p>
                  {r.observacao && <p className="text-xs text-gray-400 mt-0.5">{r.observacao}</p>}
                </div>
                <button onClick={() => excluir(r.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"><X size={16} /></button>
              </div>

              {/* KPIs da ração */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-gray-900">{animais.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Animais</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-gray-900">{r.quantidade_kg ? `${Number(r.quantidade_kg).toLocaleString('pt-BR')}` : '—'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">kg comprados</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-orange-600">{ganhoTotal > 0 ? `+${ganhoTotal.toFixed(0)}` : '—'}</div>
                  <div className="text-xs text-orange-400 mt-0.5">kg ganhos</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-gray-900">{gmdMedio > 0 ? gmdMedio.toFixed(3) : '—'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">GMD médio</div>
                </div>
              </div>

              {/* Linha custo */}
              {r.preco_total && (
                <div className="flex items-center gap-4 mt-3 px-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign size={13} className="text-gray-400" />
                    <span className="text-gray-500">Investimento:</span>
                    <span className="font-bold text-gray-900">R$ {Number(r.preco_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {custoPorKgGanho && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <TrendingUp size={13} className="text-green-500" />
                      <span className="text-gray-500">Custo/kg ganho:</span>
                      <span className="font-bold text-green-700">R$ {custoPorKgGanho}</span>
                    </div>
                  )}
                  {r.preco_total && animais.length > 0 && (
                    <div className="flex items-center gap-1.5 text-sm ml-auto">
                      <span className="text-gray-400 text-xs">R$/animal: <strong className="text-gray-700">R$ {(r.preco_total / animais.length).toFixed(2)}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Toggle animais */}
            {animais.length > 0 && (
              <>
                <button onClick={() => setExpandida(aberta ? null : r.id)}
                  className="w-full flex items-center justify-between px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                  <span>Ver {animais.length} animal{animais.length !== 1 ? 'is' : ''} nesta dieta</span>
                  {aberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {aberta && (
                  <div className="divide-y divide-gray-50">
                    {animais.map(a => {
                      const ganho = a.peso && a.peso_inicio_dieta ? (parseFloat(a.peso) - parseFloat(a.peso_inicio_dieta)).toFixed(1) : null
                      const gmd = ganho && dias > 0 ? (parseFloat(ganho) / dias).toFixed(3) : null
                      return (
                        <div key={a.id} className="flex items-center gap-4 px-5 py-3">
                          <span className="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">#{a.brinco}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-gray-900">{a.raca}</span>
                            <span className="text-xs text-gray-500 ml-2">{a.categoria}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {a.peso_inicio_dieta && <span>Início: <strong className="text-gray-700">{a.peso_inicio_dieta} kg</strong></span>}
                            {a.peso && <span>Atual: <strong className="text-gray-700">{a.peso} kg</strong></span>}
                            {ganho && <span className={`font-bold px-2 py-0.5 rounded-lg ${parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-400'}`}>{parseFloat(ganho) > 0 ? '+' : ''}{ganho} kg</span>}
                            {gmd && <span className="bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-lg">GMD {gmd}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
