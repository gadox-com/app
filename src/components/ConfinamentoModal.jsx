import { useState, useEffect } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'
import { Save, Plus, Home, AlertCircle } from 'lucide-react'

export default function ConfinamentoModal({ isOpen, onClose, animal }) {
  const [form, setForm] = useState({
    data_confinamento: new Date().toISOString().split('T')[0],
    peso_inicial: '',
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
    if (isOpen && animal?.id) {
      fetchHistorico()
    }
  }, [isOpen, animal])

  async function fetchHistorico() {
    setLoadingHist(true)
    const { data, error } = await supabase
      .from('confinamento_historico')
      .select('*')
      .eq('animal_id', animal.id)
      .order('data_confinamento', { ascending: false })
    if (!error) setHistorico(data || [])
    setLoadingHist(false)
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.data_confinamento) return setError('Data de entrada é obrigatória')
    setLoading(true)
    try {
      const { error } = await supabase.from('confinamento_historico').insert([{
        animal_id: animal.id,
        data_confinamento: form.data_confinamento,
        peso_inicial: form.peso_inicial ? parseFloat(form.peso_inicial) : null,
        peso: form.peso ? parseFloat(form.peso) : null,
        data_peso: form.data_peso || null,
        observacao: form.observacao || null,
      }])
      if (error) throw error
      setForm({ data_confinamento: new Date().toISOString().split('T')[0], peso_inicial: '', peso: '', data_peso: new Date().toISOString().split('T')[0], observacao: '' })
      setShowForm(false)
      fetchHistorico()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Confinamento — Brinco ${animal?.brinco}`} size="lg">
      <div className="space-y-4">
        {/* Histórico */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Home size={15} className="text-orange-500" />
              <span className="font-semibold text-gray-900 text-sm">Histórico de Confinamento</span>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary py-1.5 text-xs">
              <Plus size={13} /> Novo Registro
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Novo Registro</h4>
              {error && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg text-red-700 text-xs">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data de Entrada *</label>
                  <input type="date" className="input-field text-sm" value={form.data_confinamento} onChange={e => set('data_confinamento', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Peso Inicial (kg)</label>
                  <input type="number" step="0.1" className="input-field text-sm" value={form.peso_inicial} onChange={e => set('peso_inicial', e.target.value)} placeholder="0.0" />
                </div>
                <div>
                  <label className="label">Peso Atual (kg)</label>
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
            <div className="text-center py-6 text-sm text-gray-400">Carregando histórico...</div>
          ) : historico.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl">
              Nenhum registro de confinamento ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map((h) => {
                const ganho = h.peso && h.peso_inicial ? (h.peso - h.peso_inicial).toFixed(1) : null
                return (
                  <div key={h.id} className="bg-gray-50 rounded-xl p-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500">Entrada:</span>
                        <span className="text-sm font-medium text-gray-900">{formatDate(h.data_confinamento)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        {h.peso_inicial && <span>Peso inicial: <strong>{h.peso_inicial} kg</strong></span>}
                        {h.peso && <span>Peso atual: <strong>{h.peso} kg</strong></span>}
                        {h.data_peso && <span>Data: <strong>{formatDate(h.data_peso)}</strong></span>}
                      </div>
                      {h.observacao && <p className="text-xs text-gray-400 mt-1">{h.observacao}</p>}
                    </div>
                    {ganho !== null && (
                      <div className={`text-sm font-bold px-2.5 py-1 rounded-lg ${parseFloat(ganho) >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {parseFloat(ganho) >= 0 ? '+' : ''}{ganho} kg
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="btn-secondary">Fechar</button>
        </div>
      </div>
    </Modal>
  )
}
