import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  X, Edit2, Syringe, DollarSign, Trash2, Plus,
  Camera, Upload, Loader, ChevronDown, ChevronUp,
  Weight, Save, AlertTriangle, Home
} from 'lucide-react'
import AnimalModal from './AnimalModal'
import ConfinamentoModal from './ConfinamentoModal'
import ReproducaoModal from './ReproducaoModal'
import VendaModal from './VendaModal'

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function HistSection({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 border-b border-gray-100"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</span>
          {count > 0 && (
            <span className="text-xs bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full leading-none">{count}</span>
          )}
        </div>
        {open ? <ChevronUp size={12} className="text-gray-300" /> : <ChevronDown size={12} className="text-gray-300" />}
      </button>
      {open && <div className="pt-3 space-y-2">{children}</div>}
    </div>
  )
}

export default function AnimalPerfil({ isOpen, onClose, animalId, onSaved }) {
  const [animal, setAnimal] = useState(null)
  const [confinamentos, setConfinamentos] = useState([])
  const [reproducoes, setReproducoes] = useState([])
  const [pesos, setPesos] = useState([])
  const [loading, setLoading] = useState(true)
  const [fotoUrl, setFotoUrl] = useState(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoError, setFotoError] = useState('')

  // Peso form
  const [pesoVal, setPesoVal] = useState('')
  const [pesoData, setPesoData] = useState(new Date().toISOString().split('T')[0])
  const [pesoObs, setPesoObs] = useState('')
  const [savingPeso, setSavingPeso] = useState(false)
  const [pesoError, setPesoError] = useState('')
  const [pesoChanged, setPesoChanged] = useState(false)

  // Modals
  const [modalEdit, setModalEdit] = useState(false)
  const [modalConf, setModalConf] = useState(false)
  const [modalRep, setModalRep] = useState(false)
  const [modalVenda, setModalVenda] = useState(false)
  const [modalDesativar, setModalDesativar] = useState(false)
  const [togglingConfinado, setTogglingConfinado] = useState(false)

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen && animalId) fetchAll()
  }, [isOpen, animalId])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, pesoChanged])

  function handleClose() {
    if (pesoChanged) {
      if (!confirm('Você tem um peso não salvo. Deseja descartar as alterações?')) return
    }
    setPesoVal(''); setPesoObs(''); setPesoChanged(false)
    onClose()
  }

  async function fetchAll() {
    setLoading(true)
    setFotoUrl(null)
    const [{ data: a }, { data: conf }, { data: rep }, { data: p }] = await Promise.all([
      supabase.from('animais').select('*').eq('id', animalId).single(),
      supabase.from('confinamento_historico').select('*').eq('animal_id', animalId).order('data_confinamento', { ascending: false }),
      supabase.from('reproducao').select('*').eq('animal_id', animalId).order('created_at', { ascending: false }),
      supabase.from('peso_historico').select('*').eq('animal_id', animalId).order('data_peso', { ascending: false }),
    ])
    setAnimal(a)
    setConfinamentos(conf || [])
    setReproducoes(rep || [])
    setPesos(p || [])
    if (a) await loadFoto(a.brinco)
    setLoading(false)
  }

  async function loadFoto(brinco) {
    for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
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
    } catch (err) {
      setFotoError(err.message)
    } finally {
      setUploadingFoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoverFoto() {
    if (!confirm('Remover a foto deste animal?')) return
    await supabase.storage.from('animais-fotos').remove(['jpg','jpeg','png','webp'].map(e => `${animal.brinco}.${e}`))
    setFotoUrl(null)
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
      const { error: e1 } = await supabase.from('peso_historico').insert([{
        animal_id: animalId,
        peso: parseFloat(pesoVal),
        data_peso: pesoData,
        observacao: pesoObs || null,
      }])
      if (e1) throw e1
      const { error: e2 } = await supabase.from('animais').update({
        peso: parseFloat(pesoVal),
        data_peso: pesoData,
      }).eq('id', animalId)
      if (e2) throw e2
      setPesoVal(''); setPesoObs(''); setPesoChanged(false)
      setPesoData(new Date().toISOString().split('T')[0])
      fetchAll(); onSaved?.()
    } catch (err) {
      setPesoError(err.message)
    } finally {
      setSavingPeso(false)
    }
  }

  async function handleDesativar(motivo) {
    await supabase.from('animais').update({
      status: 'VENDIDO',
      local: 'VENDIDO',
      motivo_saida: motivo,
      saida: new Date().toISOString().split('T')[0],
    }).eq('id', animalId)
    onSaved?.(); onClose()
  }

  async function handleDelete() {
    if (!confirm(`Excluir permanentemente o animal ${animal?.brinco}? Esta ação não pode ser desfeita.`)) return
    await supabase.from('animais').delete().eq('id', animalId)
    onSaved?.(); onClose()
  }

  function handleSaved() { fetchAll(); onSaved?.() }

  const fd = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : null
  const fm = (v) => v ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null
  const idade = () => {
    if (!animal?.nascimento) return null
    const m = Math.floor((new Date() - new Date(animal.nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
    return m < 24 ? `${m} meses` : `${Math.floor(m / 12)} anos`
  }

  if (!isOpen) return null

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '88vh' }}>

        {loading || !animal ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── HEADER ── */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                {/* Brinco */}
                <span className="font-mono text-lg font-bold text-gray-900">#{animal.brinco}</span>

                {/* Status */}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  animal.status === 'ATIVO'
                    ? 'bg-green-50 text-green-400 border border-green-100'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {animal.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                </span>

                {/* Confinado toggle — mais evidente */}
                <button
                  onClick={toggleConfinado}
                  disabled={togglingConfinado || animal.status !== 'ATIVO'}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border-2 transition-all ${
                    animal.confinado
                      ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                      : 'bg-white text-gray-500 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  <Home size={11} />
                  {animal.confinado ? 'Confinado' : 'Solto'}
                </button>
              </div>

              {/* Ações no header — ícones */}
              <div className="flex items-center gap-1.5">
                {/* Venda */}
                {animal.status === 'ATIVO' && (
                  <button
                    onClick={() => setModalVenda(true)}
                    className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                    title="Registrar Venda"
                  >
                    <DollarSign size={16} />
                  </button>
                )}
                {/* Reprodução */}
                {animal.sexo === 'FÊMEA' && (
                  <button
                    onClick={() => setModalRep(true)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Reprodução"
                  >
                    <Syringe size={16} />
                  </button>
                )}
                {/* Editar */}
                <button
                  onClick={() => setModalEdit(true)}
                  className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors"
                  title="Editar Animal"
                >
                  <Edit2 size={16} />
                </button>
                {/* Desativar */}
                <button
                  onClick={() => setModalDesativar(true)}
                  className="p-2 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors"
                  title="Desativar / Baixa"
                >
                  <AlertTriangle size={16} />
                </button>
                {/* Excluir */}
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                  title="Excluir permanentemente"
                >
                  <Trash2 size={15} />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Fechar */}
                <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── BODY ── */}
            <div className="flex flex-1 overflow-hidden">

              {/* ESQUERDA — Informações */}
              <div className="w-1/2 border-r border-gray-100 overflow-y-auto pb-20">
                <div className="px-6 py-5 space-y-5">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Informações</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Brinco" value={animal.brinco} />
                      <InfoRow label="Sexo" value={animal.sexo} />
                      <InfoRow label="Raça" value={animal.raca} />
                      <InfoRow label="Categoria" value={animal.categoria} />
                      <InfoRow label="Local" value={animal.local} />
                      <InfoRow label="Confinado" value={animal.confinado ? 'Sim' : 'Não'} />
                      <InfoRow label="Nascimento" value={fd(animal.nascimento)} />
                      <InfoRow label="Idade" value={idade()} />
                      <InfoRow label="Último Peso" value={animal.peso ? `${animal.peso} kg` : null} />
                      <InfoRow label="Data do Peso" value={fd(animal.data_peso)} />
                      {animal.observacao && (
                        <div className="col-span-2">
                          <InfoRow label="Observação" value={animal.observacao} />
                        </div>
                      )}
                    </div>
                  </div>

                  {animal.status === 'VENDIDO' && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Saída</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <InfoRow label="Data" value={fd(animal.saida)} />
                        <InfoRow label="Motivo" value={animal.motivo_saida} />
                        <InfoRow label="Valor" value={fm(animal.preco_venda)} />
                        {animal.preco_venda && animal.peso && (
                          <InfoRow label="R$/kg" value={`R$ ${(animal.preco_venda / animal.peso).toFixed(2)}`} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Registrar peso — form */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Registrar Pesagem</p>
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 font-medium block mb-1">Peso (kg) *</label>
                          <input
                            type="number"
                            step="0.1"
                            className="input-field text-sm py-2"
                            value={pesoVal}
                            onChange={e => { setPesoVal(e.target.value); setPesoChanged(!!e.target.value) }}
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 font-medium block mb-1">Data</label>
                          <input
                            type="date"
                            className="input-field text-sm py-2"
                            value={pesoData}
                            onChange={e => setPesoData(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1">Observação</label>
                        <input
                          className="input-field text-sm py-2"
                          value={pesoObs}
                          onChange={e => setPesoObs(e.target.value)}
                          placeholder="Ex: vacinação, mangueira..."
                        />
                      </div>
                      {pesoError && <p className="text-xs text-red-500">{pesoError}</p>}
                    </div>
                  </div>
                </div>

                {/* Botões fixos no rodapé esquerdo */}
                <div className="absolute bottom-0 left-0 w-1/2 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-end gap-2">
                  <button
                    onClick={handleClose}
                    className="btn-secondary py-2 text-xs"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={salvarPeso}
                    disabled={savingPeso || !pesoVal}
                    className="btn-primary py-2 text-xs disabled:opacity-40"
                  >
                    <Weight size={13} />
                    {savingPeso ? 'Salvando...' : 'Salvar Peso'}
                  </button>
                </div>
              </div>

              {/* DIREITA */}
              <div className="w-1/2 flex flex-col overflow-hidden">

                {/* Foto */}
                <div className="h-1/2 border-b border-gray-100 flex flex-col p-4 overflow-hidden">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex-shrink-0">Foto</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                  <div className="flex-1 min-h-0">
                    {fotoUrl ? (
                      <div className="relative group h-full rounded-xl overflow-hidden">
                        <img src={fotoUrl} alt={`Animal ${animal.brinco}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFoto} className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5">
                            <Camera size={12} /> Trocar
                          </button>
                          <button onClick={handleRemoverFoto} className="bg-white text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            Remover
                          </button>
                        </div>
                        {uploadingFoto && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <Loader size={20} className="text-orange-500 animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFoto}
                        className="w-full h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        {uploadingFoto
                          ? <><Loader size={22} className="text-orange-400 animate-spin" /><span className="text-xs text-gray-400">Enviando...</span></>
                          : <><Upload size={22} className="text-gray-300 group-hover:text-orange-400 transition-colors" /><span className="text-xs font-semibold text-gray-400 group-hover:text-orange-500">Adicionar foto</span><span className="text-xs text-gray-300">JPG, PNG até 5MB</span></>
                        }
                      </button>
                    )}
                  </div>
                  {fotoError && <p className="text-xs text-red-500 mt-2 flex-shrink-0">{fotoError}</p>}
                </div>

                {/* Histórico */}
                <div className="h-1/2 overflow-y-auto p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Histórico</p>
                  <div className="space-y-4">

                    <HistSection title="Pesagens" count={pesos.length} defaultOpen={true}>
                      {pesos.length === 0
                        ? <p className="text-xs text-gray-300 text-center py-2">Nenhuma pesagem registrada.</p>
                        : pesos.map((p, i) => {
                          const anterior = pesos[i + 1]
                          const ganho = anterior ? (p.peso - anterior.peso).toFixed(1) : null
                          return (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div>
                                <div className="text-sm font-bold text-gray-800">{p.peso} kg</div>
                                <div className="text-xs text-gray-400">{fd(p.data_peso)}</div>
                                {p.observacao && <div className="text-xs text-gray-400 italic mt-0.5">{p.observacao}</div>}
                              </div>
                              {ganho !== null && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                                  parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-500' :
                                  parseFloat(ganho) < 0 ? 'bg-red-50 text-red-400' :
                                  'bg-gray-100 text-gray-400'
                                }`}>
                                  {parseFloat(ganho) > 0 ? '+' : ''}{ganho} kg
                                </span>
                              )}
                            </div>
                          )
                        })
                      }
                    </HistSection>

                    <HistSection title="Confinamento" count={confinamentos.length} defaultOpen={false}>
                      {confinamentos.length === 0
                        ? <p className="text-xs text-gray-300 text-center py-2">Nenhum registro.</p>
                        : confinamentos.map((c) => {
                          const ganho = c.peso && c.peso_inicial ? (c.peso - c.peso_inicial).toFixed(1) : null
                          return (
                            <div key={c.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                              <div>
                                <div className="text-xs font-bold text-gray-600 mb-1">Entrada: {fd(c.data_confinamento)}</div>
                                <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
                                  {c.peso_inicial && <span>Ini: <strong>{c.peso_inicial}kg</strong></span>}
                                  {c.peso && <span>Atual: <strong>{c.peso}kg</strong></span>}
                                </div>
                                {c.observacao && <p className="text-xs text-gray-400 mt-1">{c.observacao}</p>}
                              </div>
                              {ganho !== null && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ml-2 ${parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'}`}>
                                  {parseFloat(ganho) > 0 ? '+' : ''}{ganho}kg
                                </span>
                              )}
                            </div>
                          )
                        })
                      }
                      <button onClick={() => setModalConf(true)} className="w-full mt-1 py-1.5 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-1">
                        <Plus size={11} /> Novo registro
                      </button>
                    </HistSection>

                    {animal.sexo === 'FÊMEA' && (
                      <HistSection title="Reprodução" count={reproducoes.length} defaultOpen={false}>
                        {reproducoes.length === 0
                          ? <p className="text-xs text-gray-300 text-center py-2">Nenhum registro.</p>
                          : reproducoes.map((r) => (
                            <div key={r.id} className="p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-gray-600">{fd(r.data_inseminacao)}</span>
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                                  r.resultado === 'POSITIVO' ? 'bg-orange-50 text-orange-500' :
                                  r.resultado === 'NEGATIVO' ? 'bg-gray-100 text-gray-500' :
                                  'bg-gray-100 text-gray-400'
                                }`}>{r.resultado}</span>
                              </div>
                              <div className="flex gap-3 text-xs text-gray-500">
                                {r.touro && <span>Touro: <strong>{r.touro}</strong></span>}
                                {r.peso && <span><strong>{r.peso}kg</strong></span>}
                              </div>
                            </div>
                          ))
                        }
                        <button onClick={() => setModalRep(true)} className="w-full mt-1 py-1.5 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-1">
                          <Plus size={11} /> Nova inseminação
                        </button>
                      </HistSection>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Modal desativar */}
    {modalDesativar && (
      <DesativarModal
        animal={animal}
        onConfirm={handleDesativar}
        onClose={() => setModalDesativar(false)}
      />
    )}

    {animal && (
      <>
        <AnimalModal isOpen={modalEdit} onClose={() => setModalEdit(false)} animal={animal} onSaved={handleSaved} />
        <ConfinamentoModal isOpen={modalConf} onClose={() => { setModalConf(false); fetchAll() }} animal={animal} />
        <ReproducaoModal isOpen={modalRep} onClose={() => { setModalRep(false); fetchAll() }} animal={animal} />
        <VendaModal isOpen={modalVenda} onClose={() => setModalVenda(false)} animal={animal} onSaved={handleSaved} />
      </>
    )}
    </>
  )
}

function DesativarModal({ animal, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('Morte')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await onConfirm(motivo)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-yellow-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Baixa do Animal</h3>
            <p className="text-xs text-gray-500">#{animal?.brinco} — {animal?.raca}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          O animal será marcado como <strong>inativo</strong> e removido do rebanho ativo. Esta ação pode ser revertida manualmente.
        </p>

        <div className="mb-4">
          <label className="label">Motivo da Baixa</label>
          <select className="input-field" value={motivo} onChange={e => setMotivo(e.target.value)}>
            <option value="Morte">Morte</option>
            <option value="Venda">Venda</option>
            <option value="Abate">Abate</option>
            <option value="Descarte">Descarte</option>
            <option value="Transferência">Transferência</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
            <AlertTriangle size={14} />
            {loading ? 'Salvando...' : 'Confirmar Baixa'}
          </button>
        </div>
      </div>
    </div>
  )
}
