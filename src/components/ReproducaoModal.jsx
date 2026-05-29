import { useState, useEffect } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'
import { Save, Plus, Syringe, AlertCircle } from 'lucide-react'

export default function ReproducaoModal({ isOpen, onClose, animal }) {
  const [form, setForm] = useState({
    data_protocolo: '',
    data_inseminacao: new Date().toISOString().split('T')[0],
    touro: '',
    resultado: 'AGUARDANDO',
    peso: '',
    data_peso: new Date().toISOString().split('T')[0],
    observacao: '',
  })
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingHist, setLoadingHist] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (isOpen && animal?.id) fetchHistorico()
  }, [isOpen, animal])

  async function fetchHistorico() {
    setLoadingHist(true)
    const { data } = await supabase
      .from('reproducao')
      .select('*')
      .eq('animal_id', animal.id)
      .order('created_at', { ascending: false })
    setHistorico(data || [])
    setLoadingHist(false)
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.from('reproducao').insert([{
        animal_id: animal.id,
        data_protocolo: form.data_protocolo || null,
        data_inseminacao: form.data_inseminacao || null,
        touro: form.touro || null,
        resultado: form.resultado,
        peso: form.peso ? parseFloat(form.peso) : null,
        data_peso: form.data_peso || null,
        observacao: form.observacao || null,
      }])
      if (error) throw error
      setShowForm(false)
      fetchHistorico()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
  const resultadoBadge = (r) => {
    const map = {
      POSITIVO: 'bg-green-50 text-green-700',
      NEGATIVO: 'bg-red-50 text-red-600',
      AGUARDANDO: 'bg-yellow-50 text-yellow-700',
    }
    return map[r] || 'bg-gray-50 text-gray-600'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reprodução — Brinco ${animal?.brinco}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Syringe size={15} className="text-orange-500" />
            <span className="font-semibold text-gray-900 text-sm">Histórico Reprodutivo</span>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary py-1.5 text-xs">
            <Plus size={13} /> Nova Inseminação
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg text-red-700 text-xs">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Data do Protocolo</label>
                <input type="date" className="input-field text-sm" value={form.data_protocolo} onChange={e => set('data_protocolo', e.target.value)} />
              </div>
              <div>
                <label className="label">Data da Inseminação</label>
                <input type="date" className="input-field text-sm" value={form.data_inseminacao} onChange={e => set('data_inseminacao', e.target.value)} />
              </div>
              <div>
                <label className="label">Touro / Sêmen</label>
                <input className="input-field text-sm" value={form.touro} onChange={e => set('touro', e.target.value)} placeholder="Nome ou código" />
              </div>
              <div>
                <label className="label">Resultado</label>
                <select className="input-field text-sm" value={form.resultado} onChange={e => set('resultado', e.target.value)}>
                  <option>AGUARDANDO</option>
                  <option>POSITIVO</option>
                  <option>NEGATIVO</option>
                </select>
              </div>
              <div>
                <label className="label">Peso (kg)</label>
                <input type="number" step="0.1" className="input-field text-sm" value={form.peso} onChange={e => set('peso', e.target.value)} placeholder="0.0" />
              </div>
              <div>
                <label className="label">Data do Peso</label>
                <input type="date" className="input-field text-sm" value={form.data_peso} onChange={e => set('data_peso', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Observação</label>
              <input className="input-field text-sm" value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Notas..." />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-1.5 text-xs">Cancelar</button>
              <button type="submit" className="btn-primary py-1.5 text-xs" disabled={loading}>
                <Save size={13} /> {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {loadingHist ? (
          <div className="text-center py-6 text-sm text-gray-400">Carregando...</div>
        ) : historico.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl">
            Nenhum registro reprodutivo ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {historico.map((h) => (
              <div key={h.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs text-gray-500">Inseminação: <strong className="text-gray-900">{formatDate(h.data_inseminacao)}</strong></div>
                    {h.data_protocolo && <div className="text-xs text-gray-500">Protocolo: <strong>{formatDate(h.data_protocolo)}</strong></div>}
                    {h.touro && <div className="text-xs text-gray-500">Touro: <strong>{h.touro}</strong></div>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${resultadoBadge(h.resultado)}`}>
                    {h.resultado}
                  </span>
                </div>
                {(h.peso || h.data_peso) && (
                  <div className="flex gap-3 text-xs text-gray-500">
                    {h.peso && <span>Peso: <strong>{h.peso} kg</strong></span>}
                    {h.data_peso && <span>Data: <strong>{formatDate(h.data_peso)}</strong></span>}
                  </div>
                )}
                {h.observacao && <p className="text-xs text-gray-400 mt-1">{h.observacao}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="btn-secondary">Fechar</button>
        </div>
      </div>
    </Modal>
  )
}
