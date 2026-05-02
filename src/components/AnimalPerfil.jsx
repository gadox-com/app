import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  X, Home, Syringe, DollarSign, Camera, Upload,
  Loader, ChevronDown, ChevronUp, Edit2,
  MessageSquare, Scale, AlertTriangle
} from 'lucide-react'
import ConfinamentoModal from './ConfinamentoModal'
import { registrarLog } from '../lib/log.js'
import ReproducaoModal from './ReproducaoModal'

// ── Ícone cerca ───────────────────────────────────────────────────────
const FenceIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="3" x2="4" y2="21"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="20" y1="3" x2="20" y2="21"/>
    <line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/>
    <polyline points="4,3 6,6 8,3"/><polyline points="12,3 14,6 16,3"/><polyline points="20,3 22,6"/>
  </svg>
)

// ── Datas ─────────────────────────────────────────────────────────────
const fd = (d) => {
  if (!d) return '—'
  const s = typeof d === 'string' ? d.split('T')[0] : d
  const [y, m, day] = String(s).split('-')
  return `${day}/${m}/${y}`
}
const fm = (v) => v ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'
const fmtRel = (d) => {
  if (!d) return ''
  const diff = Math.floor((new Date() - new Date(d)) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── Calcular categoria por idade ──────────────────────────────────
function calcularCategoria(nascimento, sexo) {
  if (!nascimento) return null
  const meses = Math.floor((new Date() - new Date(nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
  const isMacho = sexo === 'MACHO'
  if (meses <= 12) return isMacho ? 'BEZERRO' : 'BEZERRA'
  if (meses <= 24) return isMacho ? 'NOVILHO' : 'NOVILHA'
  if (meses <= 36) return isMacho ? 'BOI' : 'VACA'
  return isMacho ? 'TOURO' : 'VACA'
}

// ── Comprimir foto ────────────────────────────────────────────────────
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxWidth / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => resolve(new File([blob], 'foto.jpg', { type: 'image/jpeg' })), 'image/jpeg', quality)
    }
    img.src = url
  })
}

// ── Campo de exibição simples ─────────────────────────────────────────
function InfoField({ label, value, fullWidth = false }) {
  return (
    <div className={`flex flex-col gap-0.5 ${fullWidth ? 'col-span-2' : ''}`}>
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-gray-900 leading-snug">{value || <span className="text-gray-300">—</span>}</span>
    </div>
  )
}

// ── Modal de baixa / desativar ────────────────────────────────────────
function BaixaModal({ animal, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('Morte')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900">Desativar Animal</h3>
            <p className="text-xs text-gray-400 mt-0.5">#{animal?.brinco} — {animal?.raca}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Motivo</label>
            <div className="grid grid-cols-3 gap-2">
              {['Morte','Transferência','Descarte','Abate','Outro'].map(m => (
                <button key={m} onClick={() => setMotivo(m)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all ${motivo === m ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div><label className="label">Data</label><input type="date" className="input-field" value={data} onChange={e => setData(e.target.value)} /></div>
          <div><label className="label">Observação</label><input className="input-field" value={obs} onChange={e => setObs(e.target.value)} placeholder="Detalhes..." /></div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={async () => { setLoading(true); await onConfirm({ motivo, data, obs }); setLoading(false) }}
            disabled={loading}
            className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
            <AlertTriangle size={14} />{loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de venda ────────────────────────────────────────────────────
function VendaModal({ animal, onConfirm, onClose }) {
  const [preco, setPreco] = useState('')
  const [peso, setPeso] = useState(animal?.peso || '')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900">Registrar Venda</h3>
            <p className="text-xs text-gray-400 mt-0.5">#{animal?.brinco} — {animal?.raca}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Valor (R$)</label><input type="number" step="0.01" className="input-field" value={preco} onChange={e => setPreco(e.target.value)} placeholder="0,00" /></div>
            <div><label className="label">Peso (kg)</label><input type="number" step="0.1" className="input-field" value={peso} onChange={e => setPeso(e.target.value)} /></div>
          </div>
          {preco && peso && <div className="text-xs text-gray-500 bg-purple-50 rounded-lg px-3 py-2">R$/kg: <strong className="text-purple-700">R$ {(parseFloat(preco)/parseFloat(peso)).toFixed(2)}</strong></div>}
          <div><label className="label">Data de Saída</label><input type="date" className="input-field" value={data} onChange={e => setData(e.target.value)} /></div>
          <div><label className="label">Observação</label><input className="input-field" value={obs} onChange={e => setObs(e.target.value)} placeholder="Comprador, destino..." /></div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={async () => { setLoading(true); await onConfirm({ preco, peso, data, obs }); setLoading(false) }}
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
            <DollarSign size={14} />{loading ? 'Salvando...' : 'Confirmar Venda'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Seção colapsável ──────────────────────────────────────────────────
function Section({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2 border-b border-gray-100 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
          {count > 0 && <span className="text-[10px] bg-orange-100 text-orange-500 font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
        </div>
        {open ? <ChevronUp size={11} className="text-gray-300" /> : <ChevronDown size={11} className="text-gray-300" />}
      </button>
      {open && children}
    </div>
  )
}

// ── Principal ─────────────────────────────────────────────────────────
export default function AnimalPerfil({ isOpen, onClose, animalId, onSaved }) {
  const [animal, setAnimal] = useState(null)
  const [pesos, setPesos] = useState([])
  const [observacoes, setObservacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [fotoUrl, setFotoUrl] = useState(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoError, setFotoError] = useState('')
  const [pesoVal, setPesoVal] = useState('')
  const [pesoData, setPesoData] = useState(new Date().toISOString().split('T')[0])
  const [savingPeso, setSavingPeso] = useState(false)
  const [pesoError, setPesoError] = useState('')
  const [obsTexto, setObsTexto] = useState('')
  const [savingObs, setSavingObs] = useState(false)
  // Modals — apenas um ativo por vez
  const [activeModal, setActiveModal] = useState(null) // null | 'conf' | 'rep' | 'venda' | 'baixa'
  const [togglingConfinado, setTogglingConfinado] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { if (isOpen && animalId) fetchAll() }, [isOpen, animalId])
  useEffect(() => {
    if (!isOpen) return
    const h = (e) => { if (e.key === 'Escape') { if (activeModal) setActiveModal(null); else onClose() } }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [isOpen, activeModal])

  async function fetchAll() {
    setLoading(true); setFotoUrl(null)
    const [{ data: a }, { data: p }, { data: o }] = await Promise.all([
      supabase.from('animais').select('*').eq('id', animalId).single(),
      supabase.from('peso_historico').select('*').eq('animal_id', animalId).order('data_peso', { ascending: false }),
      supabase.from('observacoes_animal').select('*').eq('animal_id', animalId).order('created_at', { ascending: false }),
    ])
    setAnimal(a); setPesos(p || []); setObservacoes(o || [])
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
    setFotoError(''); setUploadingFoto(true)
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('Arquivo muito grande. Máximo 20MB.')
      if (!file.type.startsWith('image/')) throw new Error('Arquivo inválido.')
      const compressed = await compressImage(file)
      await supabase.storage.from('animais-fotos').remove(['jpg','jpeg','png','webp'].map(e => `${animal.brinco}.${e}`))
      const { error } = await supabase.storage.from('animais-fotos').upload(`${animal.brinco}.jpg`, compressed, { upsert: true, contentType: 'image/jpeg' })
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



  async function toggleStatus() {
    setTogglingStatus(true)
    const novo = animal.status === 'ATIVO' ? 'VENDIDO' : 'ATIVO'
    // Se vai reativar, apenas muda status e local
    if (novo === 'ATIVO') {
      await supabase.from('animais').update({ status: 'ATIVO', local: 'CASA', saida: null, motivo_saida: null }).eq('id', animalId)
      setAnimal(a => ({ ...a, status: 'ATIVO', local: 'CASA' }))
      await registrarLog('Reativou animal', null, animalId, animal?.brinco)
      onSaved?.()
    } else {
      // Se vai desativar, abre o modal de baixa
      setActiveModal('baixa')
    }
    setTogglingStatus(false)
  }

  async function toggleConfinado() {
    setTogglingConfinado(true)
    const novo = !animal.confinado
    await supabase.from('animais').update({ confinado: novo }).eq('id', animalId)
    setAnimal(a => ({ ...a, confinado: novo })); setTogglingConfinado(false); onSaved?.()
  }

  async function salvarPeso() {
    if (!pesoVal) return setPesoError('Informe o peso')
    setSavingPeso(true); setPesoError('')
    try {
      await supabase.from('peso_historico').insert([{ animal_id: animalId, peso: parseFloat(pesoVal), data_peso: pesoData }])
      await supabase.from('animais').update({ peso: parseFloat(pesoVal), data_peso: pesoData }).eq('id', animalId)
      await registrarLog('Registrou peso', `${pesoVal} kg em ${pesoData}`, animalId, animal?.brinco)
      setPesoVal(''); setPesoData(new Date().toISOString().split('T')[0])
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
    await registrarLog('Adicionou observação', obsTexto.trim(), animalId, animal?.brinco)
    setObsTexto(''); fetchAll(); setSavingObs(false)
  }

  async function deletarObservacao(id) {
    await supabase.from('observacoes_animal').delete().eq('id', id); fetchAll()
  }

  async function handleBaixa({ motivo, data, obs }) {
    await supabase.from('animais').update({
      status: 'VENDIDO', local: 'VENDIDO',
      motivo_saida: motivo, saida: data,
      observacao: obs || animal.observacao
    }).eq('id', animalId)
    await registrarLog('Desativou animal', `Motivo: ${motivo}`, animalId, animal?.brinco)
    setActiveModal(null); fetchAll(); onSaved?.()
  }

  async function handleVenda({ preco, peso, data, obs }) {
    await supabase.from('animais').update({
      status: 'VENDIDO', local: 'VENDIDO', motivo_saida: 'Venda',
      preco_venda: preco ? parseFloat(preco) : null,
      peso: peso ? parseFloat(peso) : animal.peso,
      data_peso: data, saida: data,
      observacao: obs || animal.observacao
    }).eq('id', animalId)
    await registrarLog('Registrou venda', preco ? `R$ ${parseFloat(preco).toLocaleString('pt-BR')}` : null, animalId, animal?.brinco)
    setActiveModal(null); fetchAll(); onSaved?.()
  }

  const idade = () => {
    if (!animal?.nascimento) return null
    const m = Math.floor((new Date() - new Date(animal.nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
    return m < 24 ? `${m} meses` : `${Math.floor(m / 12)} anos`
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
              {/* ── HEADER ─────────────────────────────────────────────── */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    <span className="font-mono text-xl font-bold text-gray-900">#{animal.brinco}</span>
                  </div>

                  {/* Status clicável */}
                  <button
                    onClick={toggleStatus}
                    disabled={togglingStatus}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      animal.status === 'ATIVO'
                        ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                    }`}
                    title={animal.status === 'ATIVO' ? 'Clique para desativar' : 'Clique para reativar'}
                  >
                    {togglingStatus ? '...' : animal.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                  </button>

                  {/* Confinado */}
                  {animal.status === 'ATIVO' && (
                    <button
                      onClick={toggleConfinado}
                      disabled={togglingConfinado}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        animal.confinado
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-blue-50 text-blue-500 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      <FenceIcon />{animal.confinado ? 'Confinado' : 'Solto'}
                    </button>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5">
                  {/* Editar */}
                  <button
                    onClick={() => onRequestEdit && onRequestEdit(animal)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    title="Editar animal"
                  >
                    <Edit2 size={13} />
                    Editar
                  </button>
                  {/* Venda — cinza com ícone roxo */}
                  {animal.status === 'ATIVO' && (
                    <button
                      onClick={() => setActiveModal('venda')}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200"
                    >
                      <DollarSign size={13} className="text-purple-500" />
                      Venda
                    </button>
                  )}
                  {/* Reprodução */}
                  {animal.sexo === 'FÊMEA' && (
                    <button onClick={() => setActiveModal('rep')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Reprodução">
                      <Syringe size={15} />
                    </button>
                  )}
                  {/* Confinamento */}
                  <button onClick={() => setActiveModal('conf')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Registrar Confinamento">
                    <Home size={15} />
                  </button>
                  <div className="w-px h-4 bg-gray-200 mx-0.5" />
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* ── BODY — 4 quadrantes ─────────────────────────────────── */}
              <div className="flex flex-1 overflow-hidden">

                {/* COLUNA ESQUERDA */}
                <div className="w-1/2 flex flex-col border-r border-gray-100">

                  {/* Q1 — Informações (sem scroll) */}
                  <div className="h-1/2 border-b border-gray-100 px-5 py-4 flex flex-col">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex-shrink-0">Informações</p>
                    <div className="flex-1 overflow-y-auto space-y-0 pr-1">

                      {/* Grid 2 colunas — campos normais */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">

                        {/* Brinco */}
                        <div className="flex items-start gap-2 group">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-3 flex-shrink-0"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                          <EditField label="Brinco" value={animal.brinco} onSave={v => saveField('brinco', v)} />
                        </div>

                        {/* Sexo */}
                        <div className="flex items-start gap-2 group">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>
                          <EditField label="Sexo" value={animal.sexo} options={['MACHO','FÊMEA']} onSave={v => saveField('sexo', v)} />
                        </div>

                        {/* Raça */}
                        <div className="flex items-start gap-2 group">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><ellipse cx="12" cy="13" rx="8" ry="5"/><path d="M12 8 Q10 4 8 5"/><path d="M12 8 Q14 4 16 5"/></svg>
                          <EditField label="Raça" value={animal.raca} onSave={v => saveField('raca', v)} />
                        </div>

                        {/* Categoria */}
                        <div className="flex items-start gap-2 group">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                          <EditField label="Categoria" value={animal.categoria} options={['BEZERRO','BEZERRA','NOVILHO','NOVILHA','VACA','TOURO','BOI']} onSave={v => saveField('categoria', v)} />
                        </div>

                        {/* Local */}
                        <div className="flex items-start gap-2 group">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <EditField label="Local" value={animal.local} options={['SARANDI','CASA','CAPANEMA']} onSave={v => saveField('local', v)} />
                        </div>

                        {/* Nascimento */}
                        <div className="flex items-start gap-2 group">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <EditField label="Nascimento" value={animal.nascimento} type="date" onSave={v => saveField('nascimento', v)} displayValue={fd(animal.nascimento)} />
                        </div>

                        {/* Idade */}
                        <div className="flex items-start gap-2">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Idade</span>
                            <span className="text-sm font-medium text-gray-900">{idade() || '—'}</span>
                          </div>
                        </div>

                        {/* Peso */}
                        <div className="flex items-start gap-2">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><path d="M6 3h12l3 7H3z"/><path d="M3 10v11h18V10"/><line x1="12" y1="10" x2="12" y2="21"/></svg>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Último Peso</span>
                            <span className="text-sm font-medium text-gray-900">{animal.peso ? `${animal.peso} kg` : '—'}</span>
                          </div>
                        </div>

                        {/* Data peso */}
                        <div className="flex items-start gap-2">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Data Peso</span>
                            <span className="text-sm font-medium text-gray-900">{fd(animal.data_peso)}</span>
                          </div>
                        </div>

                        {animal.status === 'VENDIDO' && <>
                          <div className="flex items-start gap-2">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><path d="M9 14l6-6m0 0H9m6 0v6"/><circle cx="12" cy="12" r="10"/></svg>
                            <div className="flex flex-col gap-0.5"><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Saída</span><span className="text-sm font-medium text-gray-900">{fd(animal.saida)}</span></div>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <div className="flex flex-col gap-0.5"><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Motivo</span><span className="text-sm font-medium text-gray-900">{animal.motivo_saida || '—'}</span></div>
                          </div>
                          {animal.preco_venda && <>
                            <div className="flex items-start gap-2">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                              <div className="flex flex-col gap-0.5"><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Valor</span><span className="text-sm font-medium text-gray-900">{fm(animal.preco_venda)}</span></div>
                            </div>
                            <div className="flex items-start gap-2">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                              <div className="flex flex-col gap-0.5"><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">R$/kg</span><span className="text-sm font-medium text-gray-900">{animal.peso ? `R$ ${(animal.preco_venda/animal.peso).toFixed(2)}` : '—'}</span></div>
                            </div>
                          </>}
                        </>}
                      </div>

                      {/* Observação */}
                      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-100 group">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" className="mt-3 flex-shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <EditField label="Observação" value={animal.observacao} onSave={v => saveField('observacao', v)} fullWidth />
                      </div>

                    </div>
                  </div>

                  {/* Q3 — Observações */}
                  <div className="h-1/2 flex flex-col px-5 py-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2.5 flex-shrink-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Observações</p>
                      {observacoes.length > 0 && <span className="text-[10px] bg-orange-100 text-orange-500 font-bold px-1.5 py-0.5 rounded-full">{observacoes.length}</span>}
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl mb-2.5 flex-shrink-0">
                      <MessageSquare size={12} className="text-gray-300 flex-shrink-0" />
                      <input className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-300" placeholder="Ex: vacinado contra aftosa..." value={obsTexto} onChange={e => setObsTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') salvarObservacao() }} />
                      <button onClick={salvarObservacao} disabled={savingObs || !obsTexto.trim()}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${obsTexto.trim() ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-300'}`}>
                        {savingObs ? <Loader size={10} className="animate-spin" /> : <Check size={10} strokeWidth={3} />}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-0.5">
                      {observacoes.length === 0
                        ? <p className="text-xs text-gray-300 text-center py-3">Nenhuma observação</p>
                        : observacoes.map(o => (
                          <div key={o.id} className="group flex items-start justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 leading-snug">{o.texto}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{fmtRel(o.created_at)}</p>
                            </div>
                            <button onClick={() => deletarObservacao(o.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5"><X size={11} /></button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA */}
                <div className="w-1/2 flex flex-col">

                  {/* Q2 — Foto */}
                  <div className="h-1/2 border-b border-gray-100 flex flex-col px-5 py-4 overflow-hidden">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex-shrink-0">Foto</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                    <div className="flex-1 min-h-0">
                      {fotoUrl ? (
                        <div className="relative group h-full rounded-xl overflow-hidden">
                          <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFoto} className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Camera size={12} /> Trocar</button>
                            <button onClick={handleRemoverFoto} className="bg-white text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg">Remover</button>
                          </div>
                          {uploadingFoto && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader size={20} className="text-orange-500 animate-spin" /></div>}
                        </div>
                      ) : (
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFoto}
                          className="w-full h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center gap-2 group">
                          {uploadingFoto ? <><Loader size={20} className="text-orange-400 animate-spin" /><span className="text-xs text-gray-400">Enviando...</span></>
                            : <><Upload size={20} className="text-gray-300 group-hover:text-orange-400 transition-colors" /><span className="text-xs font-medium text-gray-400 group-hover:text-orange-500">Adicionar foto</span><span className="text-xs text-gray-300">Comprimida automaticamente</span></>
                          }
                        </button>
                      )}
                    </div>
                    {fotoError && <p className="text-xs text-red-500 mt-1.5 flex-shrink-0">{fotoError}</p>}
                  </div>

                  {/* Q4 — Pesagens */}
                  <div className="h-1/2 flex flex-col px-5 py-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2.5 flex-shrink-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pesagens</p>
                      {pesos.length > 0 && <span className="text-[10px] bg-orange-100 text-orange-500 font-bold px-1.5 py-0.5 rounded-full">{pesos.length}</span>}
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl mb-2 flex-shrink-0">
                      <Scale size={12} className="text-gray-300 flex-shrink-0" />
                      <input type="number" step="0.1" className="w-20 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-300 font-mono" placeholder="0.0 kg" value={pesoVal} onChange={e => setPesoVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') salvarPeso() }} />
                      <input type="date" className="flex-1 text-sm bg-transparent outline-none text-gray-500" value={pesoData} onChange={e => setPesoData(e.target.value)} />
                      <button onClick={salvarPeso} disabled={savingPeso || !pesoVal}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${pesoVal ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-300'}`}>
                        {savingPeso ? <Loader size={10} className="animate-spin" /> : <Check size={10} strokeWidth={3} />}
                      </button>
                    </div>
                    {pesoError && <p className="text-xs text-red-500 mb-1 flex-shrink-0">{pesoError}</p>}
                    <div className="flex-1 overflow-y-auto space-y-0.5">
                      {pesos.length === 0
                        ? <div className="flex flex-col items-center justify-center h-16 text-gray-300"><Scale size={18} className="mb-1" /><p className="text-xs">Nenhuma pesagem</p></div>
                        : pesos.map((p, i) => {
                          const ant = pesos[i + 1]
                          const ganho = ant ? (p.peso - ant.peso).toFixed(1) : null
                          return (
                            <div key={p.id} className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm font-bold text-gray-900 font-mono w-14">{p.peso}kg</span>
                                <span className="text-xs text-gray-400">{fd(p.data_peso)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {ganho !== null && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-500' : parseFloat(ganho) < 0 ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-400'}`}>{parseFloat(ganho) > 0 ? '+' : ''}{ganho}kg</span>}
                                <button onClick={() => deletarPeso(p.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"><X size={12} /></button>
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                </div>
              </div>
              {/* ── FOOTER ──────────────────────────────────────────────── */}
              <div className="flex justify-end px-5 py-2.5 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <button
                  onClick={onClose}
                  className="px-5 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  OK
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modais — renderizados FORA do modal principal para não sobrepor */}
      {activeModal === 'baixa' && animal && (
        <BaixaModal animal={animal} onConfirm={handleBaixa} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'venda' && animal && (
        <VendaModal animal={animal} onConfirm={handleVenda} onClose={() => setActiveModal(null)} />
      )}
      {animal && (
        <>
          <ConfinamentoModal isOpen={activeModal === 'conf'} onClose={() => { setActiveModal(null); fetchAll() }} animal={animal} />
          <ReproducaoModal isOpen={activeModal === 'rep'} onClose={() => { setActiveModal(null); fetchAll() }} animal={animal} />
        </>
      )}
    </>
  )
}
}