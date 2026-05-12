import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { X, Home, Syringe, DollarSign, Camera, Upload, Loader, Edit2, MessageSquare, Scale, AlertTriangle } from 'lucide-react'
import { registrarLog } from '../lib/log.js'
import { useRole } from '../lib/role.jsx'
import ConfinamentoModal from './ConfinamentoModal'
import ReproducaoModal from './ReproducaoModal'

// ── Utilitários ───────────────────────────────────────────────────────
const fd = (d) => {
  if (!d) return '—'
  const s = String(d).split('T')[0]
  const [y, m, day] = s.split('-')
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

function calcularCategoria(nascimento, sexo) {
  if (!nascimento) return null
  const meses = Math.floor((new Date() - new Date(nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
  const m = sexo === 'MACHO'
  if (meses <= 12) return m ? 'BEZERRO' : 'BEZERRA'
  if (meses <= 24) return m ? 'NOVILHO' : 'NOVILHA'
  if (meses <= 36) return m ? 'BOI' : 'VACA'
  return m ? 'TOURO' : 'VACA'
}

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, 1200 / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => resolve(new File([blob], 'foto.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.8)
    }
    img.src = url
  })
}

// ── Save icon ─────────────────────────────────────────────────────────
const SaveIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
)

// ── Fence icon ────────────────────────────────────────────────────────
const FenceIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="3" x2="4" y2="21"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="20" y1="3" x2="20" y2="21"/>
    <line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/>
    <polyline points="4,3 6,6 8,3"/><polyline points="12,3 14,6 16,3"/>
  </svg>
)

// ── Info row estilo iOS ───────────────────────────────────────────────
function InfoRow({ label, value, mono = false }) {
  if (!value || value === '—') return (
    <div className="flex items-center justify-between py-2.5 px-3.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-300">—</span>
    </div>
  )
  return (
    <div className="flex items-center justify-between py-2.5 px-3.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

// ── Modal baixa ───────────────────────────────────────────────────────
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
          <div><h3 className="font-bold text-gray-900">Desativar Animal</h3><p className="text-xs text-gray-400 mt-0.5">#{animal?.brinco} — {animal?.raca}</p></div>
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

// ── Modal venda ───────────────────────────────────────────────────────
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
          <div><h3 className="font-bold text-gray-900">Registrar Venda</h3><p className="text-xs text-gray-400 mt-0.5">#{animal?.brinco} — {animal?.raca}</p></div>
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

// ── Principal ─────────────────────────────────────────────────────────
export default function AnimalPerfil({ isOpen, onClose, animalId, onSaved, onRequestEdit }) {
  const { isViewer } = useRole()
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
  const [activeModal, setActiveModal] = useState(null)
  const [filhos, setFilhos] = useState([])
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
    // Buscar filhos: animais cuja matriz == brinco deste animal
    if (a) {
      const { data: f } = await supabase
        .from('animais')
        .select('id, brinco, raca, categoria, sexo, nascimento, peso, status')
        .eq('matriz', a.brinco)
        .order('nascimento', { ascending: false })
      setFilhos(f || [])
      await loadFoto(a.brinco)
    }
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
      await supabase.storage.from('animais-fotos').remove(['jpg','jpeg','png','webp'].map(ext => `${animal.brinco}.${ext}`))
      const { error } = await supabase.storage.from('animais-fotos').upload(`${animal.brinco}.jpg`, compressed, { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error
      await loadFoto(animal.brinco)
    } catch (err) { setFotoError(err.message) }
    finally { setUploadingFoto(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  async function handleRemoverFoto() {
    if (!confirm('Remover foto?')) return
    await supabase.storage.from('animais-fotos').remove(['jpg','jpeg','png','webp'].map(ext => `${animal.brinco}.${ext}`))
    setFotoUrl(null)
  }

  async function toggleStatus() {
    setTogglingStatus(true)
    if (animal.status !== 'ATIVO') {
      await supabase.from('animais').update({ status: 'ATIVO', local: 'CASA', saida: null, motivo_saida: null }).eq('id', animalId)
      setAnimal(a => ({ ...a, status: 'ATIVO', local: 'CASA' }))
      await registrarLog('Reativou animal', null, animalId, animal?.brinco)
      onSaved?.()
    } else {
      setActiveModal('baixa')
    }
    setTogglingStatus(false)
  }

  async function toggleConfinado() {
    setTogglingConfinado(true)
    const novo = !animal.confinado
    await supabase.from('animais').update({ confinado: novo }).eq('id', animalId)
    setAnimal(a => ({ ...a, confinado: novo }))
    setTogglingConfinado(false); onSaved?.()
  }

  async function salvarPeso() {
    if (!pesoVal) return setPesoError('Informe o peso')
    setSavingPeso(true); setPesoError('')
    try {
      await supabase.from('peso_historico').insert([{ animal_id: animalId, peso: parseFloat(pesoVal), data_peso: pesoData }])
      await supabase.from('animais').update({ peso: parseFloat(pesoVal), data_peso: pesoData }).eq('id', animalId)
      await registrarLog('Registrou peso', `${pesoVal} kg`, animalId, animal?.brinco)
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
    await supabase.from('animais').update({ status: 'VENDIDO', local: 'VENDIDO', motivo_saida: motivo, saida: data, observacao: obs || animal.observacao }).eq('id', animalId)
    await registrarLog('Desativou animal', `Motivo: ${motivo}`, animalId, animal?.brinco)
    setActiveModal(null); fetchAll(); onSaved?.()
  }

  async function handleVenda({ preco, peso, data, obs }) {
    await supabase.from('animais').update({ status: 'VENDIDO', local: 'VENDIDO', motivo_saida: 'Venda', preco_venda: preco ? parseFloat(preco) : null, peso: peso ? parseFloat(peso) : animal.peso, data_peso: data, saida: data, observacao: obs || animal.observacao }).eq('id', animalId)
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
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '88vh', maxHeight: '780px' }}>

          {loading || !animal ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── HEADER ── */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  <span className="font-mono text-xl font-black text-gray-900 tracking-tight">{animal.brinco}</span>
                  <button onClick={isViewer ? undefined : toggleStatus} disabled={togglingStatus || isViewer}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${animal.status === 'ATIVO' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}>
                    {togglingStatus ? '...' : animal.status === 'ATIVO' ? '● Ativo' : '○ Inativo'}
                  </button>
                  {animal.status === 'ATIVO' && (
                    <button onClick={isViewer ? undefined : toggleConfinado} disabled={togglingConfinado || isViewer}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${animal.confinado ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
                      <FenceIcon />{animal.confinado ? 'Confinado' : 'Solto'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {!isViewer && (
                    <button onClick={() => onRequestEdit && onRequestEdit(animal)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                      <Edit2 size={12} /> Editar
                    </button>
                  )}
                  {!isViewer && animal.status === 'ATIVO' && (
                    <button onClick={() => setActiveModal('venda')}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200">
                      <DollarSign size={12} /> Venda
                    </button>
                  )}
                  {animal.sexo === 'FÊMEA' && (
                    <button onClick={() => setActiveModal('rep')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Reprodução">
                      <Syringe size={15} />
                    </button>
                  )}
                  <button onClick={() => setActiveModal('conf')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Confinamento">
                    <Home size={15} />
                  </button>
                  {isViewer && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">Visualização</span>
                  )}
                  <div className="w-px h-4 bg-gray-200 mx-0.5" />
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* ── BODY ── */}
              <div className="flex flex-1 overflow-hidden">

                {/* ESQUERDA */}
                <div className="w-1/2 border-r border-gray-100 flex flex-col overflow-hidden">

                  {/* Hero — 4 campos em destaque */}
                  <div className="px-5 py-4 flex-shrink-0" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #ffffff 60%)' }}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {[
                        { label: 'Raça', value: animal.raca },
                        { label: 'Categoria', value: calcularCategoria(animal.nascimento, animal.sexo) || animal.categoria },
                        { label: 'Sexo', value: animal.sexo },
                        { label: 'Local', value: animal.local },
                      ].map(f => (
                        <div key={f.label}>
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{f.label}</div>
                          <div className="text-base font-bold text-gray-900">{f.value || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lista detalhes estilo iOS */}
                  <div className="px-5 py-3 flex-shrink-0">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Detalhes</div>
                    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                      <InfoRow label="Nascimento" value={fd(animal.nascimento)} />
                      <InfoRow label="Idade" value={idade()} />
                      <InfoRow label="Último Peso" value={animal.peso ? `${animal.peso} kg` : null} />
                      <InfoRow label="Data do Peso" value={fd(animal.data_peso)} />
                      {animal.matriz && <InfoRow label="Matriz" value={animal.matriz} mono />}
                      <InfoRow label="Confinado" value={animal.confinado ? 'Sim' : 'Não'} />
                      {animal.status === 'VENDIDO' && <>
                        <InfoRow label="Data de Saída" value={fd(animal.saida)} />
                        <InfoRow label="Motivo" value={animal.motivo_saida} />
                        {animal.preco_venda && <>
                          <InfoRow label="Valor" value={fm(animal.preco_venda)} />
                          <InfoRow label="R$/kg" value={animal.peso ? `R$ ${(animal.preco_venda/animal.peso).toFixed(2)}` : null} />
                        </>}
                      </>}
                      {animal.observacao && <InfoRow label="Observação" value={animal.observacao} />}
                    </div>
                  </div>

                  {/* Filhos da matriz */}
                  {filhos.length > 0 && (
                    <div className="px-5 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Filhos</span>
                        <span className="bg-orange-100 text-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{filhos.length}</span>
                      </div>
                      {/* Último em destaque */}
                      <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 mb-2 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Mais recente</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filhos[0].status === 'ATIVO' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {filhos[0].status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-gray-900 text-base">#{filhos[0].brinco}</span>
                            <span className="text-xs text-gray-500">{filhos[0].raca} · {filhos[0].categoria}</span>
                          </div>
                          {filhos[0].nascimento && <div className="text-[10px] text-gray-400 mt-0.5">{fd(filhos[0].nascimento)}</div>}
                        </div>
                        {filhos[0].peso && <span className="text-sm font-bold text-gray-700 flex-shrink-0">{filhos[0].peso} kg</span>}
                      </div>
                      {/* Demais filhos */}
                      {filhos.slice(1).map(f => (
                        <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-gray-800">#{f.brinco}</span>
                            <span className="text-xs text-gray-400">{f.raca} · {f.categoria}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {f.peso && <span className="text-xs text-gray-400">{f.peso} kg</span>}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${f.status === 'ATIVO' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {f.status === 'ATIVO' ? '● Ativo' : '○'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Observações */}
                  <div className="px-5 py-3 flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Observações</span>
                      {observacoes.length > 0 && <span className="bg-orange-100 text-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{observacoes.length}</span>}
                    </div>
                    {!isViewer && <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-2 flex-shrink-0">
                      <MessageSquare size={12} className="text-gray-400 flex-shrink-0" />
                      <input className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                        placeholder="Ex: vacinado contra aftosa..."
                        value={obsTexto} onChange={e => setObsTexto(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') salvarObservacao() }} />
                      <button onClick={salvarObservacao} disabled={savingObs || !obsTexto.trim()}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${obsTexto.trim() ? 'bg-orange-500 hover:bg-orange-600 shadow-sm' : 'bg-gray-200'}`}>
                        {savingObs ? <Loader size={10} className="animate-spin text-white" /> : <SaveIcon />}
                      </button>
                    </div>}
                    <div className="flex-1 overflow-y-auto space-y-0.5">
                      {observacoes.length === 0
                        ? <p className="text-xs text-gray-400 text-center py-3">Nenhuma observação</p>
                        : observacoes.map(o => (
                          <div key={o.id} className="group flex items-start justify-between gap-2 px-1 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 leading-snug">{o.texto}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{fmtRel(o.created_at)}</p>
                            </div>
                            <button onClick={() => deletarObservacao(o.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5"><X size={11} /></button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>

                {/* DIREITA */}
                <div className="w-1/2 flex flex-col">

                  {/* Foto */}
                  <div className="flex flex-col px-5 py-4 border-b border-gray-100" style={{ height: '52%' }}>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex-shrink-0">Foto</div>
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
                          className="w-full h-full bg-orange-50/40 rounded-xl border-2 border-dashed border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all flex flex-col items-center justify-center gap-2 group">
                          {uploadingFoto
                            ? <><Loader size={20} className="text-orange-400 animate-spin" /><span className="text-xs text-gray-400">Enviando...</span></>
                            : <><Upload size={20} className="text-orange-300 group-hover:text-orange-500 transition-colors" /><span className="text-xs font-semibold text-orange-400 group-hover:text-orange-600">Adicionar foto</span><span className="text-xs text-gray-300">Comprimida automaticamente</span></>
                          }
                        </button>
                      )}
                    </div>
                    {fotoError && <p className="text-xs text-red-500 mt-1.5 flex-shrink-0">{fotoError}</p>}
                  </div>

                  {/* Pesagens */}
                  <div className="flex flex-col px-5 py-4 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2.5 flex-shrink-0">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pesagens</span>
                      {pesos.length > 0 && <span className="bg-orange-100 text-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pesos.length}</span>}
                    </div>
                    {!isViewer && <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-2.5 flex-shrink-0">
                      <Scale size={12} className="text-gray-400 flex-shrink-0" />
                      <input type="number" step="0.1"
                        className="w-20 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 font-mono font-semibold"
                        placeholder="0.0 kg" value={pesoVal}
                        onChange={e => setPesoVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') salvarPeso() }} />
                      <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
                      <input type="date" className="flex-1 text-sm bg-transparent outline-none text-gray-600"
                        value={pesoData} onChange={e => setPesoData(e.target.value)} />
                      <button onClick={salvarPeso} disabled={savingPeso || !pesoVal}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${pesoVal ? 'bg-orange-500 hover:bg-orange-600 shadow-sm' : 'bg-gray-200'}`}>
                        {savingPeso ? <Loader size={10} className="animate-spin text-white" /> : <SaveIcon />}
                      </button>
                    </div>}
                    {pesoError && <p className="text-xs text-red-500 mb-1 flex-shrink-0">{pesoError}</p>}
                    <div className="flex-1 overflow-y-auto">
                      {pesos.length === 0
                        ? <div className="flex flex-col items-center justify-center h-16 text-gray-300"><Scale size={18} className="mb-1" /><p className="text-xs text-gray-400">Nenhuma pesagem registrada</p></div>
                        : pesos.map((p, i) => {
                          const ant = pesos[i + 1]
                          const ganho = ant ? (p.peso - ant.peso).toFixed(1) : null
                          return (
                            <div key={p.id} className="group flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                              <div>
                                <div className="text-base font-bold text-gray-900 font-mono leading-tight">{p.peso} kg</div>
                                <div className="text-xs text-gray-400 mt-0.5">{fd(p.data_peso)}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {ganho !== null && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-500' : parseFloat(ganho) < 0 ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-400'}`}>
                                    {parseFloat(ganho) > 0 ? '+' : ''}{ganho} kg
                                  </span>
                                )}
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

              {/* FOOTER */}
              <div className="flex justify-end px-5 py-2.5 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <button onClick={onClose} className="px-6 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-colors tracking-wide">OK</button>
              </div>
            </>
          )}
        </div>
      </div>

      {activeModal === 'baixa' && animal && <BaixaModal animal={animal} onConfirm={handleBaixa} onClose={() => setActiveModal(null)} />}
      {activeModal === 'venda' && animal && <VendaModal animal={animal} onConfirm={handleVenda} onClose={() => setActiveModal(null)} />}
      {animal && (
        <>
          <ConfinamentoModal isOpen={activeModal === 'conf'} onClose={() => { setActiveModal(null); fetchAll() }} animal={animal} />
          <ReproducaoModal isOpen={activeModal === 'rep'} onClose={() => { setActiveModal(null); fetchAll() }} animal={animal} />
        </>
      )}
    </>
  )
}