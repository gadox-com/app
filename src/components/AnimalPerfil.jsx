import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { X, Home, Syringe, DollarSign, Camera, Upload, Loader, Edit2, MessageSquare, Scale, AlertTriangle, Flag, CheckCircle2, ChevronRight, Bell, Trash2 } from 'lucide-react'
import { registrarLog } from '../lib/log.js'
import { useRole } from '../lib/role.jsx'
import ConfinamentoModal from './ConfinamentoModal'
import ReproducaoModal from './ReproducaoModal'
import { formatDate as fd, formatMoney as fm, calcularCategoria, mesesDeVida } from '../lib/format'

const fmtRel = (d) => {
  if (!d) return ''
  const diff = Math.floor((new Date() - new Date(d)) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
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

const SaveIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
)

function InfoRow({ label, value, mono = false }) {
  if (!value || value === '—') return (
    <div className="flex items-center justify-between py-2.5 px-3.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-500">—</span>
    </div>
  )
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-3.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-gray-900 text-right break-words min-w-0 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

// Linha do painel de manejo: ícone neutro, título e o estado atual alinhado
// à direita, para dar pra varrer a coluna toda de cima a baixo.
function LinhaManejo({ icone, titulo, valor, ativo = false, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-gray-50 transition-colors">
      <span className={`flex-shrink-0 ${ativo ? 'text-gray-700' : 'text-gray-400'}`}>{icone}</span>
      <span className="flex-1 min-w-0 text-sm font-semibold text-gray-800">{titulo}</span>
      <span className="flex items-center gap-1.5 flex-shrink-0">
        {ativo && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
        <span className={`text-xs ${ativo ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{valor}</span>
      </span>
      <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
    </button>
  )
}

// Descarte alterna na hora, então usa interruptor em vez de seta: a forma
// do controle avisa que não abre nada.
function LinhaToggle({ icone, titulo, descricao, ligado, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} role="switch" aria-checked={ligado}
      className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-60">
      <span className={`flex-shrink-0 ${ligado ? 'text-red-500' : 'text-gray-400'}`}>{icone}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-gray-800 leading-tight">{titulo}</span>
        <span className="block text-xs text-gray-500 mt-0.5 leading-snug">{descricao}</span>
      </span>
      <span className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${ligado ? 'bg-red-500' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${ligado ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </button>
  )
}

function TituloGrupo({ children }) {
  return <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{children}</div>
}

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
          <div><h3 className="font-bold text-gray-900">Desativar Animal</h3><p className="text-xs text-gray-500 mt-0.5">#{animal?.brinco} — {animal?.raca}</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
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
          <div><h3 className="font-bold text-gray-900">Registrar Venda</h3><p className="text-xs text-gray-500 mt-0.5">#{animal?.brinco} — {animal?.raca}</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
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

function DescarteModal({ animal, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('Doença')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  const ehMorte = motivo === 'Morte'
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900">Marcar para Descarte</h3>
            <p className="text-xs text-gray-500 mt-0.5">#{animal?.brinco} — {animal?.raca}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Motivo</label>
            <div className="grid grid-cols-2 gap-2">
              {['Morte', 'Doença', 'Inválido', 'Outro'].map(m => (
                <button key={m} onClick={() => setMotivo(m)}
                  className={`py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${motivo === m ? (m === 'Morte' ? 'border-red-600 bg-red-600 text-white' : 'border-gray-800 bg-gray-800 text-white') : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                  {m === 'Morte' ? '💀 Morte' : m === 'Doença' ? '🤒 Doença' : m === 'Inválido' ? '🦽 Inválido' : '📝 Outro'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Observação <span className="text-gray-300 font-normal normal-case">(opcional)</span></label>
            <input className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
              value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Ex: pata quebrada, não cria, animal agressivo..." />
          </div>
          {ehMorte && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600 font-medium">
              ⚠️ Animal será marcado como <strong>inativo</strong> no sistema.
            </div>
          )}
          {!ehMorte && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5 text-xs text-yellow-700 font-medium">
              🚩 Animal ficará marcado para descarte — sair na próxima venda.
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 px-4 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button
            onClick={async () => { setLoading(true); await onConfirm({ motivo, obs, ehMorte }); setLoading(false) }}
            disabled={loading}
            className={`flex-1 py-2 px-4 rounded-xl text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 ${ehMorte ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-900'}`}>
            <Flag size={13} />{loading ? 'Salvando...' : ehMorte ? 'Confirmar Morte' : 'Marcar Descarte'}
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [togglingDescarte, setTogglingDescarte] = useState(false)
  const [confHistorico, setConfHistorico] = useState([])
  const [repHistorico, setRepHistorico] = useState([])
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [fotoAmpliada, setFotoAmpliada] = useState(false)
  const [racoes, setRacoes] = useState([])
  const [internalId, setInternalId] = useState(animalId)
  const [navError, setNavError] = useState('')
  const fileInputRef = useRef(null)
  // Vacinas
  const [vacinas, setVacinas] = useState([])
  const [vacinaNome, setVacinaNome] = useState('')
  const [vacinaData, setVacinaData] = useState(new Date().toISOString().split('T')[0])
  const [vacinaObs, setVacinaObs] = useState('')
  const [vacinaRepetir, setVacinaRepetir] = useState('')
  const [savingVacina, setSavingVacina] = useState(false)

  // Sincroniza com o id vindo de fora sempre que o modal abre (ou troca de animal externamente)
  useEffect(() => { if (isOpen) setInternalId(animalId) }, [isOpen, animalId])
  useEffect(() => { if (!isOpen) setFotoAmpliada(false) }, [isOpen])

  useEffect(() => { if (isOpen && internalId) fetchAll() }, [isOpen, internalId])
  useEffect(() => {
    if (!isOpen) return
    const h = (e) => { if (e.key === 'Escape') { if (activeModal) setActiveModal(null); else onClose() } }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [isOpen, activeModal])

  async function fetchAll() {
    setLoading(true); setFotoUrl(null); setNavError(''); setFotoAmpliada(false)
    const [{ data: a }, { data: p }, { data: o }, { data: ch }, { data: rh }, { data: v }] = await Promise.all([
      supabase.from('animais').select('*').eq('id', internalId).single(),
      supabase.from('peso_historico').select('*').eq('animal_id', internalId).order('data_peso', { ascending: false }),
      supabase.from('observacoes_animal').select('*').eq('animal_id', internalId).order('created_at', { ascending: false }),
      supabase.from('confinamento_historico').select('id').eq('animal_id', internalId).limit(1),
      supabase.from('reproducao').select('id').eq('animal_id', internalId).limit(1),
      supabase.from('vacinas').select('*').eq('animal_id', internalId).order('data_aplicacao', { ascending: false }),
    ])
    setAnimal(a); setPesos(p || []); setObservacoes(o || []); setConfHistorico(ch || []); setRepHistorico(rh || []); setVacinas(v || [])
    if (a?.confinado) {
      const { data: r } = await supabase.from('racoes').select('id, nome').order('data_compra', { ascending: false })
      setRacoes(r || [])
    }
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

  // Navega para o perfil de outro animal (matriz, filho) sem fechar o modal
  async function abrirAnimalPorBrinco(brinco) {
    if (!brinco) return
    setNavError('')
    setLoading(true)
    const norm = String(parseInt(brinco, 10))
    let { data } = await supabase.from('animais').select('id, brinco').eq('brinco', String(brinco)).limit(1)
    let found = (data || [])[0]
    if (!found) {
      const { data: all } = await supabase.from('animais').select('id, brinco')
      found = (all || []).find(a => String(parseInt(a.brinco, 10)) === norm)
    }
    if (found) {
      setInternalId(found.id)
    } else {
      setNavError(`Animal #${brinco} não encontrado.`)
      setLoading(false)
    }
  }

  function abrirAnimalPorId(id) {
    setNavError('')
    setLoading(true)
    setInternalId(id)
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
      await supabase.from('animais').update({ tem_foto: true }).eq('id', internalId)
      await loadFoto(animal.brinco)
    } catch (err) { setFotoError(err.message) }
    finally { setUploadingFoto(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  async function handleRemoverFoto() {
    if (!confirm('Remover foto?')) return
    await supabase.storage.from('animais-fotos').remove(['jpg','jpeg','png','webp'].map(ext => `${animal.brinco}.${ext}`))
    await supabase.from('animais').update({ tem_foto: false }).eq('id', internalId)
    setFotoUrl(null)
  }

  async function toggleStatus() {
    setTogglingStatus(true)
    if (animal.status !== 'ATIVO') {
      await supabase.from('animais').update({ status: 'ATIVO', saida: null, motivo_saida: null }).eq('id', internalId)
      setAnimal(a => ({ ...a, status: 'ATIVO' }))
      await registrarLog('Reativou animal', null, internalId, animal?.brinco)
      onSaved?.()
    } else {
      setActiveModal('baixa')
    }
    setTogglingStatus(false)
  }

  async function toggleDescarte() {
    if (animal.descarte) {
      setTogglingDescarte(true)
      await supabase.from('animais').update({ descarte: false, motivo_saida: null }).eq('id', internalId)
      setAnimal(a => ({ ...a, descarte: false }))
      await registrarLog('Removeu descarte', null, internalId, animal?.brinco)
      setTogglingDescarte(false); onSaved?.()
    } else {
      setActiveModal('descarte')
    }
  }

  async function handleDescarte({ motivo, obs, ehMorte }) {
    if (ehMorte) {
      await supabase.from('animais').update({
        status: 'VENDIDO', local: 'VENDIDO',
        motivo_saida: 'Morte', saida: new Date().toISOString().split('T')[0],
        descarte: false,
        observacao: obs || animal.observacao
      }).eq('id', internalId)
      await registrarLog('Óbito registrado', obs || null, internalId, animal?.brinco)
    } else {
      await supabase.from('animais').update({
        descarte: true,
        motivo_saida: `${motivo}${obs ? ': ' + obs : ''}`
      }).eq('id', internalId)
      await registrarLog('Marcou para descarte', `${motivo}${obs ? ': ' + obs : ''}`, internalId, animal?.brinco)
    }
    setActiveModal(null); fetchAll(); onSaved?.()
  }

  async function salvarPeso() {
    if (!pesoVal) return setPesoError('Informe o peso')
    setSavingPeso(true); setPesoError('')
    try {
      await supabase.from('peso_historico').insert([{ animal_id: internalId, peso: parseFloat(pesoVal), data_peso: pesoData, fazenda_id: animal?.fazenda_id }])
      // Só atualiza o "peso atual" do animal se esta pesagem for a mais recente
      // (evita que registrar um peso antigo sobrescreva o peso de hoje).
      if (!animal?.data_peso || pesoData >= animal.data_peso) {
        await supabase.from('animais').update({ peso: parseFloat(pesoVal), data_peso: pesoData }).eq('id', internalId)
      }
      await registrarLog('Registrou peso', `${pesoVal} kg`, internalId, animal?.brinco)
      setPesoVal(''); setPesoData(new Date().toISOString().split('T')[0])
      fetchAll(); onSaved?.()
    } catch (err) { setPesoError(err.message) }
    finally { setSavingPeso(false) }
  }

  async function deletarPeso(id) {
    if (!confirm('Remover este peso?')) return
    await supabase.from('peso_historico').delete().eq('id', id)
    const restantes = pesos.filter(p => p.id !== id)
    if (restantes.length > 0) await supabase.from('animais').update({ peso: restantes[0].peso, data_peso: restantes[0].data_peso }).eq('id', internalId)
    else await supabase.from('animais').update({ peso: null, data_peso: null }).eq('id', internalId)
    fetchAll(); onSaved?.()
  }

  async function salvarVacina() {
    if (!vacinaNome.trim()) return
    setSavingVacina(true)
    let proxima_data = null
    if (vacinaRepetir) {
      const d = new Date(vacinaData)
      d.setMonth(d.getMonth() + parseInt(vacinaRepetir))
      proxima_data = d.toISOString().split('T')[0]
    }
    const { error: vacinaErr } = await supabase.from('vacinas').insert([{
      animal_id: internalId,
      fazenda_id: animal?.fazenda_id,
      nome: vacinaNome.trim(),
      data_aplicacao: vacinaData,
      observacao: vacinaObs.trim() || null,
      repetir_meses: vacinaRepetir ? parseInt(vacinaRepetir) : null,
      proxima_data,
    }])
    if (vacinaErr) { setSavingVacina(false); return }
    await registrarLog('Registrou vacina', vacinaNome.trim(), internalId, animal?.brinco)
    setVacinaNome(''); setVacinaObs(''); setVacinaRepetir('')
    setVacinaData(new Date().toISOString().split('T')[0])
    fetchAll(); setSavingVacina(false)
  }

  async function deletarVacina(id) {
    if (!confirm('Remover este registro?')) return
    await supabase.from('vacinas').delete().eq('id', id)
    fetchAll()
  }

  async function salvarObservacao() {
    if (!obsTexto.trim()) return
    setSavingObs(true)
    await supabase.from('observacoes_animal').insert([{ animal_id: internalId, texto: obsTexto.trim() }])
    await registrarLog('Adicionou observação', obsTexto.trim(), internalId, animal?.brinco)
    setObsTexto(''); fetchAll(); setSavingObs(false)
  }

  async function deletarObservacao(id) {
    if (!confirm('Remover esta observação?')) return
    await supabase.from('observacoes_animal').delete().eq('id', id); fetchAll()
  }

  async function handleBaixa({ motivo, data, obs }) {
    await supabase.from('animais').update({ status: 'VENDIDO', local: 'VENDIDO', motivo_saida: motivo, saida: data, observacao: obs || animal.observacao }).eq('id', internalId)
    await registrarLog('Desativou animal', `Motivo: ${motivo}`, internalId, animal?.brinco)
    setActiveModal(null); fetchAll(); onSaved?.()
  }

  async function handleVenda({ preco, peso, data, obs }) {
    await supabase.from('animais').update({ status: 'VENDIDO', local: 'VENDIDO', motivo_saida: 'Venda', preco_venda: preco ? parseFloat(preco) : null, peso: peso ? parseFloat(peso) : animal.peso, data_peso: peso ? data : animal.data_peso, saida: data, observacao: obs || animal.observacao }).eq('id', internalId)
    await registrarLog('Registrou venda', preco ? `R$ ${parseFloat(preco).toLocaleString('pt-BR')}` : null, internalId, animal?.brinco)
    setActiveModal(null); fetchAll(); onSaved?.()
  }

  const idade = () => {
    const m = mesesDeVida(animal?.nascimento)
    if (m === null) return null
    return m < 24 ? `${m} meses` : `${Math.floor(m / 12)} anos`
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full h-full sm:h-[88vh] sm:max-h-[780px] sm:max-w-5xl bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">

          {loading || !animal ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 px-3 sm:px-5 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  <span className="font-mono text-xl font-black text-gray-900 tracking-tight">{animal.brinco}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    {[animal.raca, calcularCategoria(animal.nascimento, animal.sexo) || animal.categoria, animal.local].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {!isViewer && (
                    <button onClick={() => onRequestEdit && onRequestEdit(animal)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                      <Edit2 size={12} /> <span className="hidden sm:inline">Editar</span>
                    </button>
                  )}
                  {isViewer && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">Visualização</span>
                  )}
                  <div className="w-px h-4 bg-gray-200 mx-0.5" />
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* BODY */}
              <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">

                {/* ESQUERDA — tudo o que se sabe sobre o animal */}
                <div className="w-full md:w-7/12 md:border-r border-b md:border-b-0 border-gray-100 md:overflow-y-auto">

                  <div className="px-4 sm:px-5 py-4" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #ffffff 60%)' }}>
                    <div className="flex gap-3 sm:gap-4 items-start">
                      {/* Foto à esquerda */}
                      <div className="flex-shrink-0">
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                        {fotoUrl ? (
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden cursor-pointer border border-gray-200 shadow-sm"
                            onClick={() => setFotoAmpliada(true)}>
                            <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
                            {!isViewer && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/50 flex items-center justify-center gap-1 py-1">
                                <Camera size={11} className="text-white" />
                                <span className="text-[10px] font-semibold text-white">Editar</span>
                              </div>
                            )}
                            {uploadingFoto && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader size={14} className="text-orange-500 animate-spin" /></div>}
                          </div>
                        ) : (
                          <button onClick={() => !isViewer && fileInputRef.current?.click()} disabled={uploadingFoto || isViewer}
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/40 hover:bg-orange-50 transition-all flex flex-col items-center justify-center gap-1 group">
                            {uploadingFoto
                              ? <Loader size={14} className="text-orange-400 animate-spin" />
                              : <><Upload size={18} className="text-orange-300 group-hover:text-orange-500 transition-colors" /><span className="text-[10px] font-semibold text-orange-400">Foto</span></>
                            }
                          </button>
                        )}
                        {fotoError && <p className="text-[10px] text-red-500 mt-1 w-24 sm:w-28 leading-tight">{fotoError}</p>}
                      </div>
                      {/* Grid categoria/local/sexo/raça à direita */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 flex-1">
                        {[
                          { label: 'Categoria', value: calcularCategoria(animal.nascimento, animal.sexo) || animal.categoria },
                          { label: 'Local', value: animal.local },
                          { label: 'Sexo', value: animal.sexo },
                          { label: 'Raça', value: animal.raca },
                        ].map(f => (
                          <div key={f.label}>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">{f.label}</div>
                            {f.label === 'Local' && animal.confinado ? (
                              <span className="inline-flex items-center gap-1 text-sm font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-200">
                                <Home size={11} className="fill-blue-400" /> {animal.local}
                              </span>
                            ) : (
                              <div className={`font-bold text-gray-900 ${f.label === 'Local' ? 'text-lg' : 'text-base'}`}>{f.value || '—'}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 sm:px-5 py-3">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Detalhes</div>
                    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                      <InfoRow label="Nascimento" value={fd(animal.nascimento)} />
                      <InfoRow label="Idade" value={idade()} />
                      <InfoRow label="Último Peso" value={animal.peso ? `${animal.peso} kg` : null} />
                      <InfoRow label="Data do Peso" value={fd(animal.data_peso)} />
                      {animal.matriz && (
                        <div className="flex items-center justify-between py-2.5 px-3.5 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-500">Matriz</span>
                          <button
                            onClick={() => abrirAnimalPorBrinco(animal.matriz)}
                            className="font-mono text-sm font-semibold text-orange-500 hover:text-orange-700 hover:underline transition-colors"
                          >
                            #{animal.matriz}
                          </button>
                        </div>
                      )}
                      {navError && <p className="text-xs text-red-500 px-3.5 py-1.5">{navError}</p>}
                      {animal.cor && <InfoRow label="Cor" value={animal.cor} />}
                      <InfoRow label="Confinado" value={animal.confinado ? 'Sim' : 'Não'} />
                      {animal.confinado && (
                        <InfoRow label="Dieta" value={
                          animal.racao_id
                            ? (racoes.find(r => r.id === animal.racao_id)?.nome || '—')
                            : '—'
                        } />
                      )}
                      {animal.confinado && animal.racao_id && (
                        <InfoRow label="Início dieta" value={animal.racao_data_inicio ? fd(animal.racao_data_inicio) : '—'} />
                      )}
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

                  {filhos.length > 0 && (
                    <div className="px-4 sm:px-5 pb-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filhos</span>
                        <span className="bg-orange-100 text-orange-500 text-xs font-bold px-1.5 py-0.5 rounded-full">{filhos.length}</span>
                      </div>
                      <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                        {filhos.map((f, i) => (
                          <button key={f.id} onClick={() => abrirAnimalPorId(f.id)}
                            className="w-full flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-0 text-left">
                            {i === 0 && <span className="text-xs font-bold text-orange-400 bg-orange-100 px-1.5 py-0.5 rounded flex-shrink-0">Recente</span>}
                            <span className="font-mono font-bold text-gray-900 text-sm flex-shrink-0">#{f.brinco}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">{f.raca}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">·</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">{f.categoria}</span>
                            {f.peso && <span className="text-xs text-gray-500 flex-shrink-0 ml-auto">{f.peso} kg</span>}
                            <span className={`text-xs font-bold flex-shrink-0 ${i === 0 && f.peso ? '' : 'ml-auto'} ${f.status === 'ATIVO' ? 'text-green-500' : 'text-gray-500'}`}>●</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Histórico de pesagens — o registro fica no painel de ações */}
                  <div className="px-4 sm:px-5 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pesagens</span>
                      {pesos.length > 0 && <span className="bg-orange-100 text-orange-500 text-xs font-bold px-1.5 py-0.5 rounded-full">{pesos.length}</span>}
                    </div>
                    {pesos.length === 0
                      ? <p className="text-xs text-gray-500 py-2">Nenhuma pesagem registrada</p>
                      : pesos.map((p, i) => {
                        const ant = pesos[i + 1]
                        const ganho = ant ? (p.peso - ant.peso).toFixed(1) : null
                        return (
                          <div key={p.id} className="group flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <div className="text-base font-bold text-gray-900 font-mono leading-tight">{p.peso} kg</div>
                              <div className="text-xs text-gray-500 mt-0.5">{fd(p.data_peso)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {ganho !== null && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-500' : parseFloat(ganho) < 0 ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-500'}`}>
                                  {parseFloat(ganho) > 0 ? '+' : ''}{ganho} kg
                                </span>
                              )}
                              {!isViewer && <button onClick={() => deletarPeso(p.id)} className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400"><X size={12} /></button>}
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>

                  {/* Vacinas e medicamentos */}
                  <div className="px-4 sm:px-5 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Vacinas</span>
                      {vacinas.length > 0 && <span className="bg-green-100 text-green-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{vacinas.length}</span>}
                    </div>
                    {!isViewer && (
                      <div className="space-y-2 mb-3">
                        <div className="flex gap-2">
                          <input className="flex-1 text-sm bg-white border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-400 transition-colors placeholder-gray-400"
                            placeholder="Nome da vacina / medicamento"
                            value={vacinaNome} onChange={e => setVacinaNome(e.target.value)} />
                          <input type="date" className="text-sm bg-white border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-400 transition-colors text-gray-700"
                            value={vacinaData} onChange={e => setVacinaData(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <input className="flex-1 text-sm bg-white border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-400 transition-colors placeholder-gray-400"
                            placeholder="Observação (opcional)"
                            value={vacinaObs} onChange={e => setVacinaObs(e.target.value)} />
                          <select className="text-sm bg-white border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-400 transition-colors text-gray-700"
                            value={vacinaRepetir} onChange={e => setVacinaRepetir(e.target.value)}>
                            <option value="">Sem repetição</option>
                            <option value="1">Repetir em 1 mês</option>
                            <option value="2">Repetir em 2 meses</option>
                            <option value="3">Repetir em 3 meses</option>
                            <option value="6">Repetir em 6 meses</option>
                            <option value="12">Repetir em 12 meses</option>
                          </select>
                        </div>
                        <button onClick={salvarVacina} disabled={savingVacina || !vacinaNome.trim()}
                          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm transition-all ${vacinaNome.trim() ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                          {savingVacina ? <Loader size={13} className="animate-spin" /> : <Syringe size={13} />}
                          {!savingVacina && 'Registrar'}
                        </button>
                      </div>
                    )}
                    {vacinas.length === 0
                      ? <p className="text-xs text-gray-500 py-2">Nenhuma vacina registrada</p>
                      : vacinas.map(v => {
                        const diasProx = v.proxima_data ? Math.ceil((new Date(v.proxima_data) - new Date()) / (1000 * 60 * 60 * 24)) : null
                        const alerta = diasProx !== null && diasProx <= 14
                        const vencida = diasProx !== null && diasProx < 0
                        return (
                          <div key={v.id} className={`group rounded-xl p-3 mb-2 border ${vencida ? 'border-red-200 bg-red-50' : alerta ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-bold text-gray-900 truncate">{v.nome}</span>
                                  {vencida && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full flex-shrink-0">VENCIDA</span>}
                                  {alerta && !vencida && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full flex-shrink-0">EM {diasProx}d</span>}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{fd(v.data_aplicacao)}{v.observacao ? ` · ${v.observacao}` : ''}</div>
                                {v.proxima_data && <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${vencida ? 'text-red-500' : alerta ? 'text-yellow-600' : 'text-green-600'}`}>
                                  <Bell size={10} /> Próxima: {fd(v.proxima_data)}
                                </div>}
                              </div>
                              {!isViewer && <button onClick={() => deletarVacina(v.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 flex-shrink-0 mt-0.5"><Trash2 size={12} /></button>}
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>

                  <div className="px-4 sm:px-5 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Observações</span>
                      {observacoes.length > 0 && <span className="bg-orange-100 text-orange-500 text-xs font-bold px-1.5 py-0.5 rounded-full">{observacoes.length}</span>}
                    </div>
                    {!isViewer && <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-2">
                      <MessageSquare size={12} className="text-gray-500 flex-shrink-0" />
                      <input className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                        placeholder="Ex: vacinado contra aftosa..."
                        value={obsTexto} onChange={e => setObsTexto(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') salvarObservacao() }} />
                      <button onClick={salvarObservacao} disabled={savingObs || !obsTexto.trim()}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${obsTexto.trim() ? 'bg-orange-500 hover:bg-orange-600 shadow-sm' : 'bg-gray-200'}`}>
                        {savingObs ? <Loader size={10} className="animate-spin text-white" /> : <SaveIcon />}
                      </button>
                    </div>}
                    <div className="space-y-0.5">
                      {observacoes.length === 0
                        ? <p className="text-xs text-gray-500 text-center py-3">Nenhuma observação</p>
                        : observacoes.map(o => (
                          <div key={o.id} className="group flex items-start justify-between gap-2 px-1 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 leading-snug">{o.texto}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{fmtRel(o.created_at)}</p>
                            </div>
                            {!isViewer && <button onClick={() => deletarObservacao(o.id)} className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 flex-shrink-0 mt-0.5"><X size={11} /></button>}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>

                {/* DIREITA — o que fazer com o animal */}
                <div className="w-full md:w-5/12 md:overflow-y-auto bg-gray-50/40 px-4 sm:px-5 py-4 flex flex-col gap-3.5">

                  {/* Situação em destaque */}
                  <div className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl shadow-md ${animal.status === 'ATIVO' ? 'bg-green-600 shadow-green-200' : 'bg-black shadow-gray-300'}`}>
                    <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                      {animal.status === 'ATIVO' ? <CheckCircle2 size={21} className="text-white" /> : <AlertTriangle size={20} className="text-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-bold text-white leading-tight">{animal.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</div>
                      <div className="text-xs text-white/80 truncate">
                        {animal.status === 'ATIVO'
                          ? [idade() ? `No rebanho há ${idade()}` : 'No rebanho', animal.local].filter(Boolean).join(' · ')
                          : [animal.motivo_saida, fd(animal.saida)].filter(Boolean).join(' · ') || 'Fora do rebanho'}
                      </div>
                    </div>
                    {!isViewer && (
                      <button onClick={toggleStatus} disabled={togglingStatus}
                        title={animal.status === 'ATIVO' ? 'Desativar: registra a saída do animal (morte, transferência, abate)' : 'Reativar: traz o animal de volta ao rebanho'}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-lg bg-white/95 text-[11px] font-bold hover:bg-white transition-colors disabled:opacity-60 ${animal.status === 'ATIVO' ? 'text-red-600' : 'text-green-700'}`}>
                        {togglingStatus ? '...' : animal.status === 'ATIVO' ? 'Desativar' : 'Reativar'}
                      </button>
                    )}
                  </div>

                  {!isViewer && (
                    <>
                      {/* Registrar peso */}
                      <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-3 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 flex-shrink-0 rounded-xl bg-orange-500 flex items-center justify-center">
                            <Scale size={18} className="text-white" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-orange-700 leading-tight">Registrar peso</div>
                            <div className="text-xs text-orange-500 mt-0.5">
                              {animal.peso ? `Último: ${animal.peso} kg${animal.data_peso ? ` em ${fd(animal.data_peso)}` : ''}` : 'Nenhuma pesagem registrada'}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 bg-white border-2 border-orange-200 rounded-xl px-3 py-2 focus-within:border-orange-400 transition-colors">
                            <input type="number" step="0.1"
                              className="w-16 flex-shrink-0 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400 font-mono font-bold"
                              placeholder="Peso" value={pesoVal}
                              onChange={e => setPesoVal(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') salvarPeso() }} />
                            <span className="text-xs text-gray-400 font-semibold flex-shrink-0">kg</span>
                            <div className="w-px h-4 bg-orange-200 flex-shrink-0" />
                            <input type="date" className="flex-1 min-w-0 w-full text-sm bg-transparent outline-none text-gray-700 font-medium"
                              value={pesoData} onChange={e => setPesoData(e.target.value)} />
                          </div>
                          <button onClick={salvarPeso} disabled={savingPeso || !pesoVal}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${pesoVal ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            {savingPeso ? <Loader size={13} className="animate-spin" /> : 'Salvar peso'}
                          </button>
                        </div>
                        {pesoError && <p className="text-xs text-red-500">{pesoError}</p>}
                      </div>

                      {/* Manejo */}
                      <div>
                        <TituloGrupo>Manejo</TituloGrupo>
                        <div className="mt-2 rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
                          <LinhaManejo
                            icone={<Home size={18} />}
                            titulo="Confinamento"
                            ativo={animal.confinado}
                            valor={animal.confinado ? 'Confinado' : (confHistorico.length > 0 ? 'Já esteve' : 'Nunca')}
                            onClick={() => setActiveModal('conf')}
                          />
                          {animal.sexo === 'FÊMEA' && (
                            <LinhaManejo
                              icone={<Syringe size={18} />}
                              titulo="Reprodução"
                              ativo={repHistorico.length > 0}
                              valor={repHistorico.length > 0 ? 'Com registros' : 'Sem registros'}
                              onClick={() => setActiveModal('rep')}
                            />
                          )}
                          <LinhaToggle
                            icone={<Flag size={18} className={animal.descarte ? 'fill-red-500' : ''} />}
                            titulo="Descarte"
                            descricao={animal.descarte ? 'Prioritário na próxima venda' : 'Marcar para venda prioritária'}
                            ligado={animal.descarte}
                            onClick={toggleDescarte}
                            disabled={togglingDescarte}
                          />
                        </div>
                      </div>

                      {/* Saída */}
                      {animal.status === 'ATIVO' && (
                        <div>
                          <TituloGrupo>Saída</TituloGrupo>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button onClick={() => setActiveModal('venda')}
                              className="flex flex-col gap-1.5 px-3 py-3 rounded-2xl border border-gray-200 bg-white text-left hover:border-gray-400 hover:bg-gray-50 transition-all">
                              <DollarSign size={17} className="text-gray-500" />
                              <span className="text-sm font-semibold text-gray-800 leading-tight">Registrar venda</span>
                              <span className="text-xs text-gray-500 leading-snug">Valor, peso e data</span>
                            </button>
                            <button onClick={() => setActiveModal('baixa')}
                              className="flex flex-col gap-1.5 px-3 py-3 rounded-2xl border border-gray-200 bg-white text-left hover:border-gray-400 hover:bg-gray-50 transition-all">
                              <AlertTriangle size={17} className="text-gray-500" />
                              <span className="text-sm font-semibold text-gray-800 leading-tight">Dar baixa</span>
                              <span className="text-xs text-gray-500 leading-snug">Morte ou transferência</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end px-4 sm:px-5 py-2.5 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <button onClick={onClose} className="px-6 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-colors tracking-wide">OK</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox foto */}
      {fotoAmpliada && fotoUrl && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setFotoAmpliada(false)}>
          <div className="flex flex-col items-center gap-3 w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <div className="relative w-full">
              <button onClick={() => setFotoAmpliada(false)}
                className="absolute -top-3 -right-3 bg-white text-gray-700 hover:text-red-500 hover:bg-gray-100 rounded-full p-1.5 shadow-lg transition-colors z-10">
                <X size={18} />
              </button>
              <img src={fotoUrl} alt="" className="w-full max-h-[55vh] object-contain rounded-2xl shadow-2xl" />
            </div>
            {!isViewer && (
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => { setFotoAmpliada(false); setTimeout(() => fileInputRef.current?.click(), 100) }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold text-sm px-4 py-2.5 rounded-xl shadow">
                  <Camera size={15} /> Trocar
                </button>
                <button
                  onClick={() => { handleRemoverFoto(); setFotoAmpliada(false) }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow">
                  <X size={15} /> Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {activeModal === 'baixa' && animal && <BaixaModal animal={animal} onConfirm={handleBaixa} onClose={() => setActiveModal(null)} />}
      {activeModal === 'venda' && animal && <VendaModal animal={animal} onConfirm={handleVenda} onClose={() => setActiveModal(null)} />}
      {activeModal === 'descarte' && animal && <DescarteModal animal={animal} onConfirm={handleDescarte} onClose={() => setActiveModal(null)} />}
      {animal && (
        <>
          <ConfinamentoModal isOpen={activeModal === 'conf'} onClose={() => { setActiveModal(null); fetchAll() }} animal={animal} />
          <ReproducaoModal isOpen={activeModal === 'rep'} onClose={() => { setActiveModal(null); fetchAll() }} animal={animal} />
        </>
      )}
    </>
  )
}
