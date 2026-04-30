import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  X, Home, Syringe, LogOut, Plus, Camera, Upload,
  Loader, ChevronDown, ChevronUp, Check, Pencil, MessageSquare, Scale
} from 'lucide-react'
import AnimalModal from './AnimalModal'
import ConfinamentoModal from './ConfinamentoModal'
import ReproducaoModal from './ReproducaoModal'

// ─── Campo editável inline ───────────────────────────────────────────
function EditableField({ label, value, onSave, type = 'text', options = null }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 50)
  }, [editing])

  async function handleSave() {
    setSaving(true)
    await onSave(val)
    setSaving(false)
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setVal(value || ''); setEditing(false) }
  }

  return (
    <div className="group flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1.5">
          {options ? (
            <select
              ref={inputRef}
              className="flex-1 text-sm font-semibold text-gray-900 border-b-2 border-orange-400 bg-transparent outline-none pb-0.5"
              value={val}
              onChange={e => setVal(e.target.value)}
            >
              {options.map(o => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input
              ref={inputRef}
              type={type}
              className="flex-1 text-sm font-semibold text-gray-900 border-b-2 border-orange-400 bg-transparent outline-none pb-0.5"
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          )}
          <button onClick={handleSave} disabled={saving} className="text-orange-500 hover:text-orange-600 transition-colors flex-shrink-0">
            {saving ? <Loader size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900 flex-1">{value || '—'}</span>
          <button
            onClick={() => { setVal(value || ''); setEditing(true) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-orange-400"
          >
            <Pencil size={11} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Modal de saída ───────────────────────────────────────────────────
function SaidaModal({ animal, onConfirm, onClose }) {
  const [tipo, setTipo] = useState('Venda')
  const [motivo, setMotivo] = useState('Morte')
  const [preco, setPreco] = useState('')
  const [peso, setPeso] = useState(animal?.peso || '')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  const isVenda = tipo === 'Venda'

  async function handleConfirm() {
    setLoading(true)
    await onConfirm({ motivo: isVenda ? 'Venda' : motivo, preco_venda: isVenda && preco ? parseFloat(preco) : null, peso: peso ? parseFloat(peso) : animal?.peso, saida: data, observacao: obs || null })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900">Registrar Saída</h3>
            <p className="text-xs text-gray-400 mt-0.5">#{animal?.brinco} — {animal?.raca}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {['Venda', 'Outra'].map(t => (
              <button key={t} onClick={() => { setTipo(t); setMotivo(t === 'Venda' ? 'Venda' : 'Morte') }}
                className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${tipo === t ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {t === 'Venda' ? '💰 Venda' : '📋 Outra'}
              </button>
            ))}
          </div>
          {!isVenda && (
            <div>
              <label className="label">Motivo</label>
              <select className="input-field" value={motivo} onChange={e => setMotivo(e.target.value)}>
                {['Morte','Abate','Descarte','Transferência','Outro'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          )}
          {isVenda && (
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Valor (R$)</label><input type="number" step="0.01" className="input-field" value={preco} onChange={e => setPreco(e.target.value)} placeholder="0,00" /></div>
              <div><label className="label">Peso (kg)</label><input type="number" step="0.1" className="input-field" value={peso} onChange={e => setPeso(e.target.value)} placeholder={animal?.peso || '0.0'} /></div>
            </div>
          )}
          {isVenda && preco && peso && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">R$/kg: <strong>R$ {(parseFloat(preco)/parseFloat(peso)).toFixed(2)}</strong></div>
          )}
          <div><label className="label">Data de Saída</label><input type="date" className="input-field" value={data} onChange={e => setData(e.target.value)} /></div>
          <div><label className="label">Observação</label><input className="input-field" value={obs} onChange={e => setObs(e.target.value)} placeholder="Comprador, destino..." /></div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={handleConfirm} disabled={loading} className="btn-primary flex-1 justify-center">
            <LogOut size={14} />{loading ? 'Salvando...' : 'Confirmar Saída'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Seção colapsável ─────────────────────────────────────────────────
function Section({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2 border-b border-gray-100 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</span>
          {count > 0 && <span className="text-xs bg-orange-100 text-orange-500 font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
        </div>
        {open ? <ChevronUp size={12} className="text-gray-300" /> : <ChevronDown size={12} className="text-gray-300" />}
      </button>
      {open && children}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────
export default function AnimalPerfil({ isOpen, onClose, animalId, onSaved }) {
  const [animal, setAnimal] = useState(null)
  const [pesos, setPesos] = useState([])
  const [observacoes, setObservacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [fotoUrl, setFotoUrl] = useState(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoError, setFotoError] = useState('')

  // Peso
  const [pesoVal, setPesoVal] = useState('')
  const [pesoData, setPesoData] = useState(new Date().toISOString().split('T')[0])
  const [pesoObs, setPesoObs] = useState('')
  const [savingPeso, setSavingPeso] = useState(false)
  const [pesoError, setPesoError] = useState('')

  // Observação
  const [obsTexto, setObsTexto] = useState('')
  const [savingObs, setSavingObs] = useState(false)

  // Modals
  const [modalConf, setModalConf] = useState(false)
  const [modalRep, setModalRep] = useState(false)
  const [modalSaida, setModalSaida] = useState(false)
  const [togglingConfinado, setTogglingConfinado] = useState(false)

  const fileInputRef = useRef(null)

  useEffect(() => { if (isOpen && animalId) fetchAll() }, [isOpen, animalId])
  useEffect(() => {
    if (!isOpen) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [isOpen])

  async function fetchAll() {
    setLoading(true)
    setFotoUrl(null)
    const [{ data: a }, { data: p }, { data: o }] = await Promise.all([
      supabase.from('animais').select('*').eq('id', animalId).single(),
      supabase.from('peso_historico').select('*').eq('animal_id', animalId).order('data_peso', { ascending: false }),
      supabase.from('observacoes_animal').select('*').eq('animal_id', animalId).order('created_at', { ascending: false }),
    ])
    setAnimal(a)
    setPesos(p || [])
    setObservacoes(o || [])
    if (a) await loadFoto(a.brinco)
    setLoading(false)
  }

  async function loadFoto(brinco) {
    for (const ext of ['jpg','jpeg','png','webp']) {
      const { data } = await supabase.storage.from('animais-fotos').createSignedUrl(`${brinco}.${ext}`, 3600)
      if (data?.signedUrl) { setFotoUrl(data.signedUrl); return }
    }
    setFotoUrl(null)
  }

  async function handleFotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoError('')
    setUploadingFoto(true)
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Foto muito grande. Máximo 5MB.')
      if (!file.type.startsWith('image/')) throw new Error('Arquivo inválido.')
      const ext = file.name.split('.').pop().toLowerCase()
      await supabase.storage.from('animais-fotos').remove(['jpg','jpeg','png','webp'].map(e => `${animal.brinco}.${e}`))
      const { error } = await supabase.storage.from('animais-fotos').upload(`${animal.brinco}.${ext}`, file, { upsert: true })
      if (error) throw error
      await loadFoto(animal.brinco)
    } catch (err) { setFotoError(err.message) }
    finally { setUploadingFoto(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  async function handleRemoverFoto() {
    if (!confirm('Remover foto?')) return
    await supabase.storage.from('animais-fotos').remove(['jpg','jpeg','png','webp'].map(e => `${animal.brinco}.${e}`))
    setFotoUrl(null)
  }

  async function saveField(field, value) {
    await supabase.from('animais').update({ [field]: value }).eq('id', animalId)
    setAnimal(a => ({ ...a, [field]: value }))
    onSaved?.()
  }

  async function toggleConfinado() {
    setTogglingConfinado(true)
    const novo = !animal.confinado
    await supabase.from('animais').update({ confinado: novo }).eq('id', animalId)
    setAnimal(a => ({ ...a, confinado: novo }))
    setTogglingConfinado(false)
    onSaved?.()
  }

  async function salvarPeso() {
    if (!pesoVal) return setPesoError('Informe o peso')
    setSavingPeso(true)
    setPesoError('')
    try {
      const { error: e1 } = await supabase.from('peso_historico').insert([{ animal_id: animalId, peso: parseFloat(pesoVal), data_peso: pesoData, observacao: pesoObs || null }])
      if (e1) throw e1
      await supabase.from('animais').update({ peso: parseFloat(pesoVal), data_peso: pesoData }).eq('id', animalId)
      setPesoVal(''); setPesoObs(''); setPesoData(new Date().toISOString().split('T')[0])
      fetchAll(); onSaved?.()
    } catch (err) { setPesoError(err.message) }
    finally { setSavingPeso(false) }
  }

  async function deletarPeso(id) {
    if (!confirm('Remover este peso?')) return
    await supabase.from('peso_historico').delete().eq('id', id)
    const restantes = pesos.filter(p => p.id !== id)
    if (restantes.length > 0) await supabase.from('animais').update({ peso: restantes[0].peso, data_peso: restantes[0].data_peso }).eq('id', animalId)
    else await supabase.from('animais').update({ peso: null, data_peso: null }).eq('id', animalId)
    fetchAll(); onSaved?.()
  }

  async function salvarObservacao() {
    if (!obsTexto.trim()) return
    setSavingObs(true)
    await supabase.from('observacoes_animal').insert([{ animal_id: animalId, texto: obsTexto.trim() }])
    setObsTexto('')
    fetchAll()
    setSavingObs(false)
  }

  async function deletarObservacao(id) {
    if (!confirm('Remover observação?')) return
    await supabase.from('observacoes_animal').delete().eq('id', id)
    fetchAll()
  }

  async function handleSaida({ motivo, preco_venda, peso, saida, observacao }) {
    await supabase.from('animais').update({ status: 'VENDIDO', local: 'VENDIDO', motivo_saida: motivo, preco_venda, peso: peso || animal.peso, data_peso: saida, saida, observacao: observacao || animal.observacao }).eq('id', animalId)
    setModalSaida(false); onSaved?.(); onClose()
  }

  const fd = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
  const fm = (v) => v ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'
  const idade = () => {
    if (!animal?.nascimento) return null
    const m = Math.floor((new Date() - new Date(animal.nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
    return m < 24 ? `${m} meses` : `${Math.floor(m / 12)} anos`
  }
  const fmtRelativo = (d) => {
    if (!d) return ''
    const diff = Math.floor((new Date() - new Date(d)) / 1000)
    if (diff < 60) return 'agora'
    if (diff < 3600) return `${Math.floor(diff/60)}min atrás`
    if (diff < 86400) return `${Math.floor(diff/3600)}h atrás`
    if (diff < 604800) return `${Math.floor(diff/86400)}d atrás`
    return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '90vh' }}>
          {loading || !animal ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-lg font-bold text-gray-900">#{animal.brinco}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${animal.status === 'ATIVO' ? 'bg-green-50 text-green-500 border-green-100' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                    {animal.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                  </span>
                  {animal.status === 'ATIVO' && (
                    <button onClick={toggleConfinado} disabled={togglingConfinado}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border-2 transition-all ${animal.confinado ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-600'}`}>
                      <Home size={11} />{animal.confinado ? 'Confinado' : 'Solto'}
                    </button>
                  )}
                  <span className="text-sm text-gray-400 hidden sm:inline">{animal.raca} · {animal.categoria} · {animal.sexo}</span>
                </div>
                <div className="flex items-center gap-1">
                  {animal.sexo === 'FÊMEA' && (
                    <button onClick={() => setModalRep(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Reprodução"><Syringe size={15} /></button>
                  )}
                  <button onClick={() => setModalConf(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Confinamento"><Home size={15} /></button>
                  {animal.status === 'ATIVO' && (
                    <button onClick={() => setModalSaida(true)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Registrar Saída"><LogOut size={15} /></button>
                  )}
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
                </div>
              </div>

              {/* BODY */}
              <div className="flex flex-1 overflow-hidden">

                {/* ESQUERDA — info editável */}
                <div className="w-1/2 border-r border-gray-100 overflow-y-auto">
                  <div className="px-6 py-5 space-y-6">

                    {/* Dados principais */}
                    <Section title="Informações" count={0} defaultOpen={true}>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <EditableField label="Brinco" value={animal.brinco} onSave={v => saveField('brinco', v)} />
                        <EditableField label="Sexo" value={animal.sexo} options={['MACHO','FÊMEA']} onSave={v => saveField('sexo', v)} />
                        <EditableField label="Raça" value={animal.raca} onSave={v => saveField('raca', v)} />
                        <EditableField label="Categoria" value={animal.categoria} options={['BEZERRO','BEZERRA','NOVILHO','NOVILHA','VACA','TOURO','BOI']} onSave={v => saveField('categoria', v)} />
                        <EditableField label="Local" value={animal.local} options={['SARANDI','CASA','CAPANEMA']} onSave={v => saveField('local', v)} />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-400 font-medium">Confinado</span>
                          <span className="text-sm font-semibold text-gray-900">{animal.confinado ? 'Sim' : 'Não'}</span>
                        </div>
                        <EditableField label="Nascimento" value={animal.nascimento} type="date" onSave={v => saveField('nascimento', v)} />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-400 font-medium">Idade</span>
                          <span className="text-sm font-semibold text-gray-900">{idade() || '—'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-400 font-medium">Último Peso</span>
                          <span className="text-sm font-semibold text-gray-900">{animal.peso ? `${animal.peso} kg` : '—'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-400 font-medium">Data do Peso</span>
                          <span className="text-sm font-semibold text-gray-900">{fd(animal.data_peso)}</span>
                        </div>
                        <div className="col-span-2">
                          <EditableField label="Observação Geral" value={animal.observacao} onSave={v => saveField('observacao', v)} />
                        </div>
                      </div>
                    </Section>

                    {animal.status === 'VENDIDO' && (
                      <Section title="Saída" count={0} defaultOpen={true}>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                          <div className="flex flex-col gap-0.5"><span className="text-xs text-gray-400 font-medium">Data</span><span className="text-sm font-semibold text-gray-900">{fd(animal.saida)}</span></div>
                          <div className="flex flex-col gap-0.5"><span className="text-xs text-gray-400 font-medium">Motivo</span><span className="text-sm font-semibold text-gray-900">{animal.motivo_saida || '—'}</span></div>
                          <div className="flex flex-col gap-0.5"><span className="text-xs text-gray-400 font-medium">Valor</span><span className="text-sm font-semibold text-gray-900">{fm(animal.preco_venda)}</span></div>
                          {animal.preco_venda && animal.peso && (
                            <div className="flex flex-col gap-0.5"><span className="text-xs text-gray-400 font-medium">R$/kg</span><span className="text-sm font-semibold text-gray-900">R$ {(animal.preco_venda/animal.peso).toFixed(2)}</span></div>
                          )}
                        </div>
                      </Section>
                    )}

                    {/* Registrar Observação */}
                    <Section title="Registrar Observação" count={observacoes.length} defaultOpen={true}>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <MessageSquare size={13} className="text-gray-300 flex-shrink-0" />
                        <input
                          className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                          placeholder="Ex: vacinado contra aftosa, vermifugado..."
                          value={obsTexto}
                          onChange={e => setObsTexto(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') salvarObservacao() }}
                        />
                        <button
                          onClick={salvarObservacao}
                          disabled={savingObs || !obsTexto.trim()}
                          className="flex-shrink-0 text-gray-400 hover:text-orange-500 disabled:opacity-30 transition-colors"
                          title="Salvar observação (Enter)"
                        >
                          {savingObs ? <Loader size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
                        </button>
                      </div>
                      {/* Histórico observações */}
                      {observacoes.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {observacoes.map(o => (
                            <div key={o.id} className="group flex items-start justify-between gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 leading-snug">{o.texto}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{fmtRelativo(o.created_at)}</p>
                              </div>
                              <button onClick={() => deletarObservacao(o.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>

                    {/* Registrar Peso */}
                    <Section title="Registrar Pesagem" count={pesos.length} defaultOpen={true}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                          <Scale size={13} className="text-gray-300 flex-shrink-0" />
                          <input
                            type="number" step="0.1"
                            className="w-24 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400 font-mono"
                            placeholder="0.0 kg"
                            value={pesoVal}
                            onChange={e => setPesoVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') salvarPeso() }}
                          />
                          <input
                            type="date"
                            className="flex-1 text-sm bg-transparent outline-none text-gray-500"
                            value={pesoData}
                            onChange={e => setPesoData(e.target.value)}
                          />
                          <button
                            onClick={salvarPeso}
                            disabled={savingPeso || !pesoVal}
                            className="flex-shrink-0 text-gray-400 hover:text-orange-500 disabled:opacity-30 transition-colors"
                            title="Salvar peso (Enter)"
                          >
                            {savingPeso ? <Loader size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                          <MessageSquare size={11} className="text-gray-300 flex-shrink-0" />
                          <input
                            className="flex-1 text-xs bg-transparent outline-none text-gray-500 placeholder-gray-300"
                            placeholder="Observação opcional (ex: mangueira, vacinação...)"
                            value={pesoObs}
                            onChange={e => setPesoObs(e.target.value)}
                          />
                        </div>
                        {pesoError && <p className="text-xs text-red-500 px-3">{pesoError}</p>}
                      </div>
                    </Section>

                  </div>
                </div>

                {/* DIREITA */}
                <div className="w-1/2 flex flex-col overflow-hidden">

                  {/* Foto — metade superior */}
                  <div className="h-1/2 border-b border-gray-100 flex flex-col p-4 overflow-hidden">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex-shrink-0">Foto</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                    <div className="flex-1 min-h-0">
                      {fotoUrl ? (
                        <div className="relative group h-full rounded-xl overflow-hidden">
                          <img src={fotoUrl} alt={`Animal ${animal.brinco}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFoto} className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Camera size={12} /> Trocar</button>
                            <button onClick={handleRemoverFoto} className="bg-white text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg">Remover</button>
                          </div>
                          {uploadingFoto && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader size={20} className="text-orange-500 animate-spin" /></div>}
                        </div>
                      ) : (
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFoto}
                          className="w-full h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center gap-2 group">
                          {uploadingFoto
                            ? <><Loader size={22} className="text-orange-400 animate-spin" /><span className="text-xs text-gray-400">Enviando...</span></>
                            : <><Upload size={22} className="text-gray-300 group-hover:text-orange-400 transition-colors" /><span className="text-xs font-semibold text-gray-400 group-hover:text-orange-500">Adicionar foto</span><span className="text-xs text-gray-300">JPG, PNG até 5MB</span></>
                          }
                        </button>
                      )}
                    </div>
                    {fotoError && <p className="text-xs text-red-500 mt-2">{fotoError}</p>}
                  </div>

                  {/* Histórico de pesos — metade inferior */}
                  <div className="h-1/2 overflow-y-auto p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Histórico de Pesagens</p>
                    {pesos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-20 text-gray-300">
                        <Scale size={22} className="mb-2" />
                        <p className="text-xs">Nenhuma pesagem registrada</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {pesos.map((p, i) => {
                          const anterior = pesos[i + 1]
                          const ganho = anterior ? (p.peso - anterior.peso).toFixed(1) : null
                          return (
                            <div key={p.id} className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-900 font-mono w-16">{p.peso} kg</span>
                                <div>
                                  <span className="text-xs text-gray-400">{fd(p.data_peso)}</span>
                                  {p.observacao && <p className="text-xs text-gray-400 italic">{p.observacao}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {ganho !== null && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-500' : parseFloat(ganho) < 0 ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-400'}`}>
                                    {parseFloat(ganho) > 0 ? '+' : ''}{ganho}kg
                                  </span>
                                )}
                                <button onClick={() => deletarPeso(p.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400">
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {modalSaida && animal && <SaidaModal animal={animal} onConfirm={handleSaida} onClose={() => setModalSaida(false)} />}
      {animal && (
        <>
          <ConfinamentoModal isOpen={modalConf} onClose={() => { setModalConf(false); fetchAll() }} animal={animal} />
          <ReproducaoModal isOpen={modalRep} onClose={() => { setModalRep(false); fetchAll() }} animal={animal} />
        </>
      )}
    </>
  )
}
