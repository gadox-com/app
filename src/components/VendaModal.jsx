import { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react'

export default function VendaModal({ isOpen, onClose, animal, onSaved }) {
  const [form, setForm] = useState({
    preco_venda: '',
    peso: '',
    saida: new Date().toISOString().split('T')[0],
    motivo_saida: 'Venda',
    observacao: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const precoKg = form.preco_venda && form.peso
    ? (parseFloat(form.preco_venda) / parseFloat(form.peso)).toFixed(2)
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.preco_venda) return setError('Valor da venda é obrigatório')
    setLoading(true)
    try {
      const { error } = await supabase.from('animais').update({
        status: 'VENDIDO',
        local: 'VENDIDO',
        saida: form.saida,
        preco_venda: parseFloat(form.preco_venda),
        peso: form.peso ? parseFloat(form.peso) : animal.peso,
        data_peso: form.saida,
        motivo_saida: form.motivo_saida,
        observacao: form.observacao || animal.observacao,
      }).eq('id', animal.id)
      if (error) throw error
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Venda — Brinco ${animal?.brinco}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="bg-orange-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-orange-500" />
            <span className="font-semibold text-orange-800 text-sm">Confirmar Venda</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-orange-700">
            <span>Animal: <strong>{animal?.brinco} — {animal?.raca}</strong></span>
            <span>Categoria: <strong>{animal?.categoria}</strong></span>
            {animal?.peso && <span>Último peso: <strong>{animal.peso} kg</strong></span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Valor da Venda (R$) *</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              value={form.preco_venda}
              onChange={e => set('preco_venda', e.target.value)}
              placeholder="0,00"
              required
            />
          </div>
          <div>
            <label className="label">Peso na Venda (kg)</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              value={form.peso}
              onChange={e => set('peso', e.target.value)}
              placeholder={animal?.peso || '0.0'}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Data de Saída</label>
            <input type="date" className="input-field" value={form.saida} onChange={e => set('saida', e.target.value)} />
          </div>
          <div>
            <label className="label">Motivo</label>
            <select className="input-field" value={form.motivo_saida} onChange={e => set('motivo_saida', e.target.value)}>
              <option>Venda</option>
              <option>Abate</option>
              <option>Descarte</option>
              <option>Morte</option>
              <option>Transferência</option>
            </select>
          </div>
        </div>

        {precoKg && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle size={15} className="text-green-600" />
            <span className="text-sm text-green-700">
              Preço por kg: <strong>R$ {precoKg}</strong>
            </span>
          </div>
        )}

        <div>
          <label className="label">Observação</label>
          <input className="input-field" value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Comprador, destino, notas..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary bg-green-600 hover:bg-green-700" disabled={loading}>
            <DollarSign size={15} />
            {loading ? 'Registrando...' : 'Confirmar Venda'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
