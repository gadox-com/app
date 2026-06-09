import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Home, Loader } from 'lucide-react'

const fd = (d) => {
  if (!d) return '—'
  const [y, m, day] = String(d).split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

export default function ConfinamentoModal({ isOpen, onClose, animal }) {
  const [racoes, setRacoes] = useState([])
  const [form, setForm] = useState({
    data_confinamento: new Date().toISOString().split('T')[0],
    racao_id: '',
    peso_entrada: '',
  })
  const [saving, setSaving] = useState(false)
  const [raçaoNome, setRaçaoNome] = useState('')

  useEffect(() => {
    if (!isOpen) return
    supabase.from('racoes').select('id, nome').order('data_compra', { ascending: false })
      .then(({ data }) => setRacoes(data || []))
    // Se já confinado, buscar nome da ração
    if (animal?.racao_id) {
      supabase.from('racoes').select('nome').eq('id', animal.racao_id).single()
        .then(({ data }) => setRaçaoNome(data?.nome || ''))
    }
  }, [isOpen, animal])

  async function confinar() {
    if (!form.data_confinamento) return
    setSaving(true)
    await supabase.from('animais').update({
      confinado: true,
      data_confinamento: form.data_confinamento,
      racao_id: form.racao_id || null,
      racao_data_inicio: form.data_confinamento,
      peso_inicio_dieta: form.peso_entrada ? parseFloat(form.peso_entrada) : (animal?.peso || null),
      peso: form.peso_entrada ? parseFloat(form.peso_entrada) : animal?.peso,
      data_peso: form.peso_entrada ? form.data_confinamento : animal?.data_peso,
    }).eq('id', animal.id)
    // Registrar pesagem de entrada
    if (form.peso_entrada) {
      const { data: uf } = await supabase.from('usuario_fazenda').select('fazenda_id').single()
      await supabase.from('peso_historico').insert([{
        animal_id: animal.id,
        fazenda_id: uf?.fazenda_id,
        peso: parseFloat(form.peso_entrada),
        data_peso: form.data_confinamento,
        observacao: 'Entrada no confinamento',
      }])
    }
    setSaving(false)
    onClose()
  }

  if (!isOpen || !animal) return null

  const jaConfinado = animal.confinado

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Home size={15} className="text-blue-500" /> Confinamento
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">#{animal.brinco} — {animal.raca}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
        </div>

        {jaConfinado ? (
          /* VISUALIZAÇÃO — já confinado */
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Entrada</span>
                <span className="text-sm font-bold text-blue-900">{fd(animal.data_confinamento)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Peso de entrada</span>
                <span className="text-sm font-bold text-blue-900">{animal.peso_inicio_dieta ? `${animal.peso_inicio_dieta} kg` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Dieta</span>
                <span className="text-sm font-bold text-blue-900">{raçaoNome || '—'}</span>
              </div>
              {animal.peso && animal.peso_inicio_dieta && (
                <div className="border-t border-blue-100 pt-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Ganho até agora</span>
                  <span className={`text-sm font-bold ${(animal.peso - animal.peso_inicio_dieta) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {(animal.peso - animal.peso_inicio_dieta) >= 0 ? '+' : ''}{(parseFloat(animal.peso) - parseFloat(animal.peso_inicio_dieta)).toFixed(1)} kg
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center">Use a aba Pesagens no perfil para registrar novos pesos.</p>
            <button onClick={onClose} className="w-full py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">Fechar</button>
          </div>
        ) : (
          /* FORMULÁRIO — não confinado */
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Data de entrada *</label>
              <input type="date" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                value={form.data_confinamento} onChange={e => setForm(f => ({ ...f, data_confinamento: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Peso de entrada (kg)</label>
              <input type="number" step="0.1" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                placeholder={animal.peso ? `Atual: ${animal.peso} kg` : '0'}
                value={form.peso_entrada} onChange={e => setForm(f => ({ ...f, peso_entrada: e.target.value }))} />
              {animal.peso && !form.peso_entrada && <p className="text-xs text-gray-400 mt-1">Deixe em branco para usar o peso atual ({animal.peso} kg)</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Dieta / Ração</label>
              <select className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                value={form.racao_id} onChange={e => setForm(f => ({ ...f, racao_id: e.target.value }))}>
                <option value="">Sem dieta definida</option>
                {racoes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
              {racoes.length === 0 && <p className="text-xs text-gray-400 mt-1">Cadastre rações em <strong>Alimentação</strong> no menu.</p>}
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={onClose} className="flex-1 py-2 px-4 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={confinar} disabled={saving || !form.data_confinamento}
                className={`flex-1 py-2 px-4 rounded-xl text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 ${form.data_confinamento ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {saving ? <Loader size={13} className="animate-spin" /> : <Home size={13} />}
                {saving ? 'Salvando...' : 'Confinar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
