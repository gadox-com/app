import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Package, TrendingUp, DollarSign, ChevronDown, ChevronUp, Loader, ShoppingCart } from 'lucide-react'

const fd = (d) => {
  if (!d) return '—'
  const [y, m, day] = String(d).split('T')[0].split('-')
  return `${day}/${m}/${y}`
}
const diffDias = (d) => d ? Math.max(0, Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60 * 24))) : 0

export default function Alimentacao() {
  const [racoes, setRacoes] = useState([])
  const [compras, setCompras] = useState({}) // racao_id → [compras]
  const [animaisPorRacao, setAnimaisPorRacao] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandida, setExpandida] = useState(null)
  const [addingCompra, setAddingCompra] = useState(null) // racao_id
  const [fazendaId, setFazendaId] = useState(null)

  const [form, setForm] = useState({ nome: '', tipo: '', data_inicio: new Date().toISOString().split('T')[0], observacao: '' })
  const [compraForm, setCompraForm] = useState({ data_compra: new Date().toISOString().split('T')[0], quantidade_kg: '', preco_total: '', observacao: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('usuario_fazenda').select('fazenda_id').single().then(({ data }) => {
      if (data) { setFazendaId(data.fazenda_id); fetchAll(data.fazenda_id) }
    })
  }, [])

  async function fetchAll(fid) {
    setLoading(true)
    const fazId = fid || fazendaId
    const [{ data: r }, { data: c }, { data: a }] = await Promise.all([
      supabase.from('racoes').select('*').order('created_at', { ascending: false }),
      supabase.from('compras_racao').select('*').order('data_compra', { ascending: true }),
      supabase.from('animais').select('id, brinco, raca, categoria, peso, racao_id, peso_inicio_dieta, data_confinamento').eq('status', 'ATIVO').not('racao_id', 'is', null),
    ])
    setRacoes(r || [])
    // Agrupar compras por racao_id
    const cMap = {}
    ;(c || []).forEach(x => { if (!cMap[x.racao_id]) cMap[x.racao_id] = []; cMap[x.racao_id].push(x) })
    setCompras(cMap)
    // Agrupar animais por racao_id
    const aMap = {}
    ;(a || []).forEach(x => { if (!aMap[x.racao_id]) aMap[x.racao_id] = []; aMap[x.racao_id].push(x) })
    setAnimaisPorRacao(aMap)
    setLoading(false)
  }

  async function criarDieta() {
    if (!form.nome.trim()) return
    setSaving(true)
    await supabase.from('racoes').insert([{ nome: form.nome.trim(), tipo: form.tipo || null, observacao: form.observacao || null, data_compra: form.data_inicio, fazenda_id: fazendaId }])
    setForm({ nome: '', tipo: '', data_inicio: new Date().toISOString().split('T')[0], observacao: '' })
    setShowForm(false); setSaving(false); fetchAll()
  }

  async function adicionarCompra(racaoId) {
    if (!compraForm.data_compra) return
    setSaving(true)
    await supabase.from('compras_racao').insert([{
      racao_id: racaoId, fazenda_id: fazendaId,
      data_compra: compraForm.data_compra,
      quantidade_kg: compraForm.quantidade_kg ? parseFloat(compraForm.quantidade_kg) : null,
      preco_total: compraForm.preco_total ? parseFloat(compraForm.preco_total) : null,
      observacao: compraForm.observacao || null,
    }])
    setCompraForm({ data_compra: new Date().toISOString().split('T')[0], quantidade_kg: '', preco_total: '', observacao: '' })
    setAddingCompra(null); setSaving(false); fetchAll()
  }

  async function excluirRacao(id) {
    if (!confirm('Excluir esta dieta e todas as compras vinculadas? Os animais serão desvinculados.')) return
    await supabase.from('animais').update({ racao_id: null, racao_data_inicio: null, peso_inicio_dieta: null }).eq('racao_id', id)
    await supabase.from('racoes').delete().eq('id', id)
    fetchAll()
  }

  async function excluirCompra(id) {
    await supabase.from('compras_racao').delete().eq('id', id)
    fetchAll()
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alimentação</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dietas, compras de ração e custo por kg ganho</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={15} /> Nova dieta
        </button>
      </div>

      {/* Form nova dieta */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Nova dieta</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          </div>
          <p className="text-xs text-gray-400">Crie a dieta/ração. Depois adicione as compras (pode ter várias compras na mesma dieta).</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Nome da dieta *</label>
              <input className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                placeholder="Ex: Confinamento Fase 1, Silagem verão..."
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Tipo</label>
              <select className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="">Selecionar...</option>
                {['Ração concentrada','Silagem','Feno','Pastagem','Sal mineral','Mistura','Outro'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Data de início</label>
              <input type="date" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Observação</label>
              <input className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                placeholder="Composição, fornecedor..." value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
            </div>
          </div>
          <button onClick={criarDieta} disabled={saving || !form.nome.trim()}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${form.nome.trim() ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            {saving ? 'Salvando...' : 'Criar dieta'}
          </button>
        </div>
      )}

      {/* Lista de dietas */}
      {racoes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">Nenhuma dieta cadastrada</p>
          <p className="text-sm text-gray-400 mt-1">Crie uma dieta e adicione compras para acompanhar o custo por kg ganho</p>
        </div>
      ) : racoes.map(r => {
        const listaCompras = compras[r.id] || []
        const animais = animaisPorRacao[r.id] || []
        const dias = diffDias(r.data_compra)
        const totalKg = listaCompras.reduce((s, c) => s + (parseFloat(c.quantidade_kg) || 0), 0)
        const totalReais = listaCompras.reduce((s, c) => s + (parseFloat(c.preco_total) || 0), 0)
        const ganhoTotal = animais.reduce((s, a) => a.peso && a.peso_inicio_dieta ? s + (parseFloat(a.peso) - parseFloat(a.peso_inicio_dieta)) : s, 0)
        const animaisComGanho = animais.filter(a => a.peso && a.peso_inicio_dieta)
        const gmdMedio = animaisComGanho.length && dias > 0
          ? animaisComGanho.reduce((s, a) => s + (parseFloat(a.peso) - parseFloat(a.peso_inicio_dieta)) / dias, 0) / animaisComGanho.length
          : 0
        const custoPorKg = ganhoTotal > 0 && totalReais > 0 ? (totalReais / ganhoTotal).toFixed(2) : null
        const aberta = expandida === r.id

        return (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-900 text-lg">{r.nome}</h3>
                    {r.tipo && <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{r.tipo}</span>}
                  </div>
                  <p className="text-xs text-gray-400">Iniciada em {fd(r.data_compra)} · {dias} dias · {animais.length} animal{animais.length !== 1 ? 'is' : ''}</p>
                </div>
                <button onClick={() => excluirRacao(r.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-1"><X size={15} /></button>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-black text-gray-900">{totalKg > 0 ? `${totalKg.toLocaleString('pt-BR')}` : '—'}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">kg comprados</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-black text-gray-900">{totalReais > 0 ? `R$${(totalReais/1000).toFixed(1)}k` : '—'}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">investido</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-black text-orange-600">{ganhoTotal > 0 ? `+${ganhoTotal.toFixed(0)}` : '—'}</div>
                  <div className="text-[10px] text-orange-400 mt-0.5">kg ganhos</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-black text-green-700">{gmdMedio > 0 ? gmdMedio.toFixed(3) : '—'}</div>
                  <div className="text-[10px] text-green-500 mt-0.5">GMD médio</div>
                </div>
              </div>

              {custoPorKg && (
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp size={13} className="text-green-500" />
                  <span className="text-gray-500">Custo por kg ganho:</span>
                  <span className="font-bold text-green-700">R$ {custoPorKg}</span>
                  {totalReais > 0 && animais.length > 0 && <span className="text-gray-400 text-xs ml-auto">R$ {(totalReais/animais.length).toFixed(2)}/animal</span>}
                </div>
              )}
            </div>

            {/* Compras */}
            <div className="border-t border-gray-100">
              <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50">
                <span className="text-xs font-bold text-gray-500">
                  {listaCompras.length === 0 ? 'Nenhuma compra registrada' : `${listaCompras.length} compra${listaCompras.length !== 1 ? 's' : ''}`}
                  {totalKg > 0 && ` · ${totalKg.toLocaleString('pt-BR')} kg`}
                  {totalReais > 0 && ` · R$ ${totalReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
                <button onClick={() => setAddingCompra(addingCompra === r.id ? null : r.id)}
                  className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-700 transition-colors">
                  <ShoppingCart size={12} /> Adicionar compra
                </button>
              </div>

              {/* Form nova compra */}
              {addingCompra === r.id && (
                <div className="px-5 py-3 bg-orange-50/50 border-t border-orange-100 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Data *</label>
                      <input type="date" className="w-full border-2 border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-orange-400"
                        value={compraForm.data_compra} onChange={e => setCompraForm(f => ({ ...f, data_compra: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Qtd (kg)</label>
                      <input type="number" step="0.01" className="w-full border-2 border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-orange-400"
                        placeholder="0" value={compraForm.quantidade_kg} onChange={e => setCompraForm(f => ({ ...f, quantidade_kg: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Valor (R$)</label>
                      <input type="number" step="0.01" className="w-full border-2 border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-orange-400"
                        placeholder="0,00" value={compraForm.preco_total} onChange={e => setCompraForm(f => ({ ...f, preco_total: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input className="flex-1 border-2 border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-orange-400"
                      placeholder="Observação (opcional)" value={compraForm.observacao} onChange={e => setCompraForm(f => ({ ...f, observacao: e.target.value }))} />
                    <button onClick={() => adicionarCompra(r.id)} disabled={saving}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5">
                      {saving ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />} Registrar
                    </button>
                    <button onClick={() => setAddingCompra(null)} className="px-3 py-1.5 rounded-lg border-2 border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">✕</button>
                  </div>
                </div>
              )}

              {/* Lista de compras */}
              {listaCompras.length > 0 && (
                <div className="divide-y divide-gray-50">
                  {listaCompras.map(c => (
                    <div key={c.id} className="group flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50">
                      <span className="text-xs text-gray-500 flex-shrink-0 w-20">{fd(c.data_compra)}</span>
                      <div className="flex items-center gap-3 flex-1 text-xs text-gray-700">
                        {c.quantidade_kg && <span><strong>{Number(c.quantidade_kg).toLocaleString('pt-BR')} kg</strong></span>}
                        {c.preco_total && <span>R$ <strong>{Number(c.preco_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>}
                        {c.quantidade_kg && c.preco_total && <span className="text-gray-400">→ R$ {(c.preco_total/c.quantidade_kg).toFixed(2)}/kg</span>}
                        {c.observacao && <span className="text-gray-400">{c.observacao}</span>}
                      </div>
                      <button onClick={() => excluirCompra(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Animais nesta dieta */}
            {animais.length > 0 && (
              <>
                <button onClick={() => setExpandida(aberta ? null : r.id)}
                  className="w-full flex items-center justify-between px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                  <span>Ver {animais.length} animal{animais.length !== 1 ? 'is' : ''} nesta dieta</span>
                  {aberta ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {aberta && (
                  <div className="divide-y divide-gray-50">
                    {animais.map(a => {
                      const ganho = a.peso && a.peso_inicio_dieta ? (parseFloat(a.peso) - parseFloat(a.peso_inicio_dieta)).toFixed(1) : null
                      const gmd = ganho && dias > 0 ? (parseFloat(ganho) / dias).toFixed(3) : null
                      return (
                        <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                          <span className="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">#{a.brinco}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-gray-900">{a.raca}</span>
                            <span className="text-xs text-gray-400 ml-2">{a.categoria}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {a.peso_inicio_dieta && <span className="text-gray-500">Entrada: <strong>{a.peso_inicio_dieta} kg</strong></span>}
                            {a.peso && <span className="text-gray-500">Atual: <strong>{a.peso} kg</strong></span>}
                            {ganho && <span className={`font-bold px-2 py-0.5 rounded-lg ${parseFloat(ganho) >= 0 ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-400'}`}>{parseFloat(ganho) >= 0 ? '+' : ''}{ganho} kg</span>}
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
