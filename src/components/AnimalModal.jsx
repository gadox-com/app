import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { X, AlertCircle, Camera, Upload, Loader } from 'lucide-react'
import { registrarLog } from '../lib/log.js'

function calcularCategoria(nascimento, sexo) {
  if (!nascimento) return null
  const meses = Math.floor((new Date() - new Date(nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
  const isMacho = sexo === 'MACHO'
  if (meses <= 12) return isMacho ? 'BEZERRO' : 'BEZERRA'
  if (meses <= 24) return isMacho ? 'NOVILHO' : 'NOVILHA'
  if (meses <= 36) return isMacho ? 'BOI' : 'VACA'
  return isMacho ? 'TOURO' : 'VACA'
}

const RACAS = ['Nelore', 'Tabapuã', 'Hereford', 'Angus', 'Braford', 'Girolando', 'Gir', 'Simental', 'Brahman']

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      {children}
    </div>
  )
}

export default function AnimalModal({ isOpen, onClose, animal, onSaved }) {
  const isEdit = !!animal?.id
  const [form, setForm] = useState({})
  const [locais, setLocais] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [brincoStatus, setBrincoStatus] = useState(null)
  const [fotoUrl, setFotoUrl] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fazendaId, setFazendaId] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    // Buscar fazenda_id do usuário
    supabase.from('usuario_fazenda').select('fazenda_id').single()
      .then(({ data }) => { if (data) setFazendaId(data.fazenda_id) })
    const base = animal ? {
      brinco: animal.brinco || '',
      sexo: animal.sexo || 'MACHO',
      raca: animal.raca || 'Nelore',
      categoria: animal.categoria || '',
      local: animal.local || '',
      nascimento: animal.nascimento || '',
      peso: animal.peso || '',
      data_peso: animal.data_peso || '',
      observacao: animal.observacao || '',
      usuario: animal.usuario || '',
      status: animal.status || 'ATIVO',
      matriz: animal.matriz || '',
      cor: animal.cor || '',
    } : {
      brinco: '', sexo: 'MACHO', raca: 'Nelore', categoria: '',
      local: '', nascimento: '', peso: '', data_peso: '',
      observacao: '', usuario: '', status: 'ATIVO', matriz: '', cor: '',
    }
    setForm(base)
    setError('')
    setBrincoStatus(null)
    setFotoPreview(null)
    setFotoFile(null)
    if (animal?.brinco) loadFoto(animal.brinco)
    else setFotoUrl(null)
  }, [animal, isOpen])

  useEffect(() => {
    supabase.from('locais').select('nome').order('nome').then(({ data }) => {
      setLocais((data || []).map(l => l.nome))
    })
  }, [])

  async function loadFoto(brinco) {
    for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
      const { data } = await supabase.storage.from('animais-fotos').createSignedUrl(`${brinco}.${ext}`, 3600)
      if (data?.signedUrl) { setFotoUrl(data.signedUrl); return }
    }
    setFotoUrl(null)
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const normalizeBrinco = (b) => String(parseInt(b, 10) || b.trim().toLowerCase())

  async function checkBrinco(valor) {
    if (!valor.trim()) { setBrincoStatus(null); return }
    setBrincoStatus('checking')
    const { data } = await supabase.from('animais').select('id, brinco, raca, categoria, status')
    if (!data) { setBrincoStatus('ok'); return }
    const match = data.find(a => {
      if (isEdit && a.id === animal.id) return false
      return normalizeBrinco(a.brinco) === normalizeBrinco(valor)
    })
    setBrincoStatus(match || 'ok')
  }

  function handleFotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function uploadFoto(brinco) {
    if (!fotoFile) return
    setUploadingFoto(true)
    try {
      await supabase.storage.from('animais-fotos').remove(['jpg','jpeg','png','webp'].map(ext => `${brinco}.${ext}`))
      await supabase.storage.from('animais-fotos').upload(`${brinco}.jpg`, fotoFile, { upsert: true, contentType: fotoFile.type })
    } finally { setUploadingFoto(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.brinco.trim()) return setError('Brinco é obrigatório')
    if (brincoStatus && brincoStatus !== 'ok' && brincoStatus !== 'checking')
      return setError(`Brinco já existe: ${brincoStatus.brinco} (${brincoStatus.raca} · ${brincoStatus.status})`)

    setLoading(true)
    try {
      const catAuto = calcularCategoria(form.nascimento, form.sexo)
      const payload = {
        ...form,
        categoria: catAuto || form.categoria,
        nascimento: form.nascimento || null,
        peso: form.peso ? parseFloat(form.peso) : null,
        data_peso: form.data_peso || null,
        cor: form.cor || null,
      }

      let savedId = animal?.id
      if (isEdit) {
        const { error: err } = await supabase.from('animais').update(payload).eq('id', animal.id)
        if (err) throw err
      } else {
        const { data, error: err } = await supabase.from('animais').insert([{ ...payload, status: 'ATIVO', fazenda_id: fazendaId }]).select('id').single()
        if (err) throw err
        savedId = data?.id
      }

      if (fotoFile) await uploadFoto(form.brinco)

      await registrarLog(
        isEdit ? 'Editou cadastro' : 'Cadastrou animal',
        `Brinco ${form.brinco} — ${form.raca}`,
        savedId, form.brinco
      )
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const categoriaAuto = calcularCategoria(form.nascimento, form.sexo)
  const fotoExibida = fotoPreview || fotoUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ height: '88vh', maxHeight: '780px' }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">

          {/* HEADER */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              <input
                className="font-mono text-xl font-black text-gray-900 tracking-tight bg-transparent border-b-2 border-transparent focus:border-orange-400 focus:outline-none w-32 placeholder-gray-300"
                value={form.brinco}
                onChange={e => { set('brinco', e.target.value); checkBrinco(e.target.value) }}
                placeholder="Brinco"
                required
              />
              {brincoStatus === 'checking' && <span className="text-xs text-gray-400">verificando...</span>}
              {brincoStatus === 'ok' && form.brinco && <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">✓ disponível</span>}
              {brincoStatus && brincoStatus !== 'ok' && brincoStatus !== 'checking' && (
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">✗ já existe</span>
              )}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                isEdit && form.status !== 'ATIVO'
                  ? 'bg-gray-100 text-gray-500 border-gray-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                {isEdit ? (form.status === 'ATIVO' ? '● Ativo' : '○ Inativo') : '● Novo'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="flex flex-1 overflow-hidden">

            {/* ESQUERDA — foto + identidade */}
            <div className="w-2/5 border-r border-gray-100 flex flex-col overflow-y-auto">

              {/* Foto */}
              <div className="relative flex-shrink-0" style={{ height: '220px' }}>
                {fotoExibida ? (
                  <img src={fotoExibida} alt="foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-50 to-gray-100 flex flex-col items-center justify-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-white/70 flex items-center justify-center shadow-sm">
                      <Camera size={28} className="text-orange-300" />
                    </div>
                    <span className="text-xs text-gray-400 font-medium">Foto do animal</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow hover:bg-white transition-all"
                >
                  {uploadingFoto ? <Loader size={12} className="animate-spin" /> : <Upload size={12} />}
                  {fotoExibida ? 'Trocar' : 'Adicionar foto'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoSelect} />
              </div>

              {/* Campos identidade */}
              <div className="p-5 space-y-4" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #ffffff 60%)' }}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Sexo">
                    <select
                      className="w-full text-sm font-bold text-gray-900 bg-transparent border-b border-gray-200 focus:border-orange-400 focus:outline-none py-1"
                      value={form.sexo} onChange={e => set('sexo', e.target.value)}
                    >
                      <option value="MACHO">MACHO</option>
                      <option value="FÊMEA">FÊMEA</option>
                    </select>
                  </Field>
                  <Field label="Categoria">
                    <div className="text-sm font-bold text-gray-900 py-1 border-b border-gray-200">
                      {categoriaAuto || <span className="text-gray-400 font-normal text-xs">pelo nascimento</span>}
                    </div>
                  </Field>
                  <Field label="Raça">
                    <select
                      className="w-full text-sm font-bold text-gray-900 bg-transparent border-b border-gray-200 focus:border-orange-400 focus:outline-none py-1"
                      value={form.raca} onChange={e => set('raca', e.target.value)}
                    >
                      {RACAS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field label="Local">
                    <select
                      className="w-full text-sm font-bold text-gray-900 bg-transparent border-b border-gray-200 focus:border-orange-400 focus:outline-none py-1"
                      value={form.local} onChange={e => set('local', e.target.value)}
                    >
                      <option value="">—</option>
                      {locais.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Cor */}
              <div className="px-5 pb-4">
                <Field label="Cor / Pelagem">
                  <input
                    className="w-full text-sm text-gray-900 bg-transparent border-b border-gray-200 focus:border-orange-400 focus:outline-none py-1"
                    value={form.cor} onChange={e => set('cor', e.target.value)}
                    placeholder="Ex: Amarela, Preta, Malhada..."
                  />
                </Field>
              </div>
            </div>

            {/* DIREITA — detalhes + observação */}
            <div className="flex-1 flex flex-col overflow-y-auto">

              <div className="p-5 space-y-5">

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-700 text-sm">
                    <AlertCircle size={15} /> {error}
                  </div>
                )}

                {/* Nascimento + Peso */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Dados</div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">Nascimento</span>
                      <input type="date" className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent focus:border-orange-400 focus:outline-none text-right"
                        value={form.nascimento} onChange={e => set('nascimento', e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">Peso (kg)</span>
                      <input type="number" step="0.1" className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent focus:border-orange-400 focus:outline-none text-right w-24"
                        value={form.peso} onChange={e => set('peso', e.target.value)} placeholder="—" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">Data do peso</span>
                      <input type="date" className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent focus:border-orange-400 focus:outline-none text-right"
                        value={form.data_peso} onChange={e => set('data_peso', e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">Matriz (mãe)</span>
                      <input className="font-mono text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent focus:border-orange-400 focus:outline-none text-right w-28"
                        value={form.matriz} onChange={e => set('matriz', e.target.value)} placeholder="Brinco da mãe" />
                    </div>
                    {isEdit && (
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-gray-500">Status</span>
                        <button type="button" onClick={() => set('status', form.status === 'ATIVO' ? 'VENDIDO' : 'ATIVO')}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${form.status === 'ATIVO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {form.status === 'ATIVO' ? '● Ativo' : '○ Inativo'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Observação */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Observações</div>
                  <textarea
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                    rows={4}
                    value={form.observacao}
                    onChange={e => set('observacao', e.target.value)}
                    placeholder="Vacinações, tratamentos, histórico..."
                  />
                </div>
              </div>

              {/* FOOTER com botão salvar */}
              <div className="mt-auto px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-white flex-shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || (brincoStatus && brincoStatus !== 'ok' && brincoStatus !== 'checking')}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  {loading ? <Loader size={15} className="animate-spin" /> : null}
                  {loading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar animal'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
