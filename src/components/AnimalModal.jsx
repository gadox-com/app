import { useState, useEffect, useCallback } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'
import { Save, AlertCircle } from 'lucide-react'
import { registrarLog } from '../lib/log.js'

const CATEGORIAS = ['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']
const LOCAIS = ['SARANDI', 'CASA', 'CAPANEMA']
const RACAS = ['Nelore', 'Angus', 'Girolando', 'Brahman', 'Hereford', 'Senepol', 'Brangus', 'Simmental', 'Limousin', 'Mestiço', 'Outro']

export default function AnimalModal({ isOpen, onClose, animal, onSaved }) {
  const isEdit = !!animal?.id
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (animal) {
      setForm({
        brinco: animal.brinco || '',
        sexo: animal.sexo || 'MACHO',
        raca: animal.raca || 'Nelore',
        categoria: animal.categoria || 'NOVILHO',
        local: animal.local || 'CASA',
        nascimento: animal.nascimento || '',
        peso: animal.peso || '',
        data_peso: animal.data_peso || '',
        observacao: animal.observacao || '',
        usuario: animal.usuario || '',
      })
    } else {
      setForm({
        brinco: '', sexo: 'MACHO', raca: 'Nelore', categoria: 'NOVILHO',
        local: 'CASA', nascimento: '', peso: '', data_peso: '', observacao: '', usuario: ''
      })
    }
    setError('')
  }, [animal, isOpen])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  // Normaliza brinco: remove zeros à esquerda para comparar (2 == 002 == 02)
  const normalizeBrinco = (b) => String(parseInt(b, 10) || b.trim().toLowerCase())

  const [brincoStatus, setBrincoStatus] = useState(null) // null | 'checking' | 'ok' | 'duplicado' | { brinco, id }

  async function checkBrinco(valor) {
    if (!valor.trim()) { setBrincoStatus(null); return }
    setBrincoStatus('checking')
    const { data } = await supabase.from('animais').select('id, brinco, raca, categoria, status')
    if (!data) { setBrincoStatus('ok'); return }
    const normalAtual = normalizeBrinco(valor)
    const match = data.find(a => {
      if (isEdit && a.id === animal.id) return false // ignora o próprio ao editar
      return normalizeBrinco(a.brinco) === normalAtual
    })
    setBrincoStatus(match ? match : 'ok')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.brinco.trim()) return setError('Brinco é obrigatório')
    if (brincoStatus && brincoStatus !== 'ok' && brincoStatus !== 'checking') {
      return setError(`Brinco já cadastrado: animal ${brincoStatus.brinco} (${brincoStatus.raca} · ${brincoStatus.categoria} · ${brincoStatus.status})`)
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        peso: form.peso ? parseFloat(form.peso) : null,
        data_peso: form.data_peso || null,
        nascimento: form.nascimento || null,
      }

      let err
      if (isEdit) {
        ;({ error: err } = await supabase.from('animais').update(payload).eq('id', animal.id))
      } else {
        ;({ error: err } = await supabase.from('animais').insert([{ ...payload, status: 'ATIVO' }]))
      }
      if (err) throw err
      await registrarLog(
        isEdit ? 'Editou cadastro' : 'Cadastrou animal',
        `Brinco ${form.brinco} — ${form.raca} ${form.categoria}`,
        null,
        form.brinco
      )
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Editar Animal — ${animal?.brinco}` : 'Cadastrar Animal'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Brinco *</label>
            <div className="relative">
              <input
                className={`input-field font-mono pr-8 ${brincoStatus && brincoStatus !== 'ok' && brincoStatus !== 'checking' && brincoStatus !== null ? 'border-red-300 focus:ring-red-400' : brincoStatus === 'ok' ? 'border-green-300 focus:ring-green-400' : ''}`}
                value={form.brinco}
                onChange={e => { set('brinco', e.target.value); checkBrinco(e.target.value) }}
                placeholder="Ex: 001"
                required
              />
              {brincoStatus === 'checking' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">⏳</span>
              )}
              {brincoStatus === 'ok' && form.brinco && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs">✓</span>
              )}
              {brincoStatus && brincoStatus !== 'ok' && brincoStatus !== 'checking' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs">✗</span>
              )}
            </div>
            {brincoStatus && brincoStatus !== 'ok' && brincoStatus !== 'checking' && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={11} />
                Já existe: brinco <strong>{brincoStatus.brinco}</strong> ({brincoStatus.raca} · {brincoStatus.categoria} · {brincoStatus.status})
              </p>
            )}
          </div>
          <div>
            <label className="label">Sexo</label>
            <select className="input-field" value={form.sexo} onChange={e => set('sexo', e.target.value)}>
              <option value="MACHO">MACHO</option>
              <option value="FÊMEA">FÊMEA</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Raça</label>
            <select className="input-field" value={form.raca} onChange={e => set('raca', e.target.value)}>
              {RACAS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Categoria</label>
            <select className="input-field" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Local</label>
            <select className="input-field" value={form.local} onChange={e => set('local', e.target.value)}>
              {LOCAIS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Data de Nascimento</label>
            <input type="date" className="input-field" value={form.nascimento} onChange={e => set('nascimento', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Peso (kg)</label>
            <input type="number" step="0.1" className="input-field" value={form.peso} onChange={e => set('peso', e.target.value)} placeholder="0.0" />
          </div>
          <div>
            <label className="label">Data do Peso</label>
            <input type="date" className="input-field" value={form.data_peso} onChange={e => set('data_peso', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Observação</label>
          <textarea className="input-field" rows={2} value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Notas adicionais..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            <Save size={15} />
            {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
