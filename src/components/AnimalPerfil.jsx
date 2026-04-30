import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  X, Edit2, Home, Syringe, DollarSign, Trash2, Plus,
  Camera, Upload, Loader, ChevronDown, ChevronUp, Weight, Save
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

function PesoForm({ animalId, onSaved }) {
  const [peso, setPeso] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!peso) return setError('Informe o peso')
    setSaving(true)
    setError('')
    try {
      // Salva no histórico
      const { error: e1 } = await supabase.from('peso_historico').insert([{
        animal_id: animalId,
        peso: parseFloat(peso),
        data_peso: data,
        observacao: obs || null,
      }])
      if (e1) throw e1

      // Atualiza peso atual do animal
      const { error: e2 } = await supabase.from('animais').update({
        peso: parseFloat(peso),
        data_peso: data,
      }).eq('id', animalId)
      if (e2) throw e2

      setPeso('')
      setObs('')
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-orange-50 rounded-xl p-3 space-y-2.5">
      <p className="text-xs font-bold text-orange-700">Registrar Pesagem</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Peso (kg) *</label>
          <input
            type="number"
            step="0.1"
            className="input-field text-sm py-1.5"
            value={peso}
            onChange={e => setPeso(e.target.value)}
            placeholder="0.0"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Data *</label>
          <input
            type="date"
            className="input-field text-sm py-1.5"
            value={data}
            onChange={e => setData(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium block mb-1">Observação</label>
        <input
          className="input-field text-sm py-1.5"
          value={obs}
          onChange={e => setObs(e.target.value)}
          placeholder="Ex: vacinação, mangueira..."
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full justify-center py-2 text-xs"
      >
        <Save size={13} />
        {saving ? 'Salvando...' : 'Salvar Peso'}
      </button>
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
  const [showPesoForm, setShowPesoForm] = useState(false)
  const [togglingConfinado, setTogglingConfinado] = useState(false)
  const [modalEdit, setModalEdit] = useState(false)
  const [modalConf, setModalConf] = useState(false)
  const [modalRep, setModalRep] = useState(false)
  const [modalVenda, setModalVenda] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen && animalId) fetchAll()
  }, [isOpen, animalId])

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen])

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
      await supabase.storage.from('animais-fotos').remove(
        ['jpg','jpeg','png','webp'].map(e => `${animal.brinco}.${e}`)
      )
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
    await supabase.storage.from('animais-fotos').remove(
      ['jpg','jpeg','png','webp'].map(e => `${animal.brinco}.${e}`)
    )
    setFotoUrl(null)
  }

  async function toggleConfinado() {
    setTogglingConfinado(true)
    const novoValor = !animal.confinado
    await supabase.from('animais').update({ confinado: novoValor }).eq('id', animalId)
    setAnimal(a => ({ ...a, confinado: novoValor }))
    setTogglingConfinado(false)
    onSaved?.()
  }

  async function handleDelete() {
    if (!confirm(`Excluir animal ${animal?.brinco}? Esta ação não pode ser desfeita.`)) return
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '88vh' }}>

        {loading || !animal ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xl font-bold text-gray-900">#{animal.brinco}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  animal.status === 'ATIVO' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'
                }`}>{animal.status}</span>
                {/* Toggle confinado */}
                <button
                  onClick={toggleConfinado}
                  disabled={togglingConfinado || animal.status !== 'ATIVO'}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                    animal.confinado
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                  }`}
                  title={animal.confinado ? 'Clique para marcar como solto' : 'Clique para marcar como confinado'}
                >
                  <Home size={11} />
                  {animal.confinado ? 'Confinado' : 'Solto'}
                </button>
                <span className="text-sm text-gray-400 hidden sm:inline">{animal.raca} · {animal.categoria} · {animal.sexo}</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">

              {/* ESQUERDA — Informações + Ações */}
              <div className="w-1/2 border-r border-gray-100 overflow-y-auto">
                <div className="px-6 py-5 space-y-5">

                  {/* Botão registrar peso — destaque */}
                  <button
                    onClick={() => setShowPesoForm(!showPesoForm)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      showPesoForm
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-200'
                    }`}
                  >
                    <Weight size={15} />
                    {showPesoForm ? 'Fechar' : 'Registrar Peso'}
                  </button>

                  {/* Form de peso inline */}
                  {showPesoForm && (
                    <PesoForm
                      animalId={animalId}
                      onSaved={() => { setShowPesoForm(false); fetchAll(); onSaved?.() }}
                    />
                  )}

                  {/* Dados principais */}
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

                  {/* Venda */}
                  {animal.status === 'VENDIDO' && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Venda</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <InfoRow label="Data de Saída" value={fd(animal.saida)} />
                        <InfoRow label="Valor" value={fm(animal.preco_venda)} />
                        <InfoRow label="Motivo" value={animal.motivo_saida} />
                        {animal.preco_venda && animal.peso && (
                          <InfoRow label="R$/kg" value={`R$ ${(animal.preco_venda / animal.peso).toFixed(2)}`} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ações</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setModalEdit(true)} className="btn-secondary justify-center py-2 text-xs">
                        <Edit2 size={13} /> Editar
                      </button>
                      <button onClick={() => setModalConf(true)} className="btn-secondary justify-center py-2 text-xs">
                        <Home size={13} /> Confinamento
                      </button>
                      {animal.sexo === 'FÊMEA' && (
                        <button onClick={() => setModalRep(true)} className="btn-secondary justify-center py-2 text-xs">
                          <Syringe size={13} /> Reprodução
                        </button>
                      )}
                      {animal.status === 'ATIVO' && (
                        <button onClick={() => setModalVenda(true)} className="btn-primary justify-center py-2 text-xs">
                          <DollarSign size={13} /> Venda
                        </button>
                      )}
                    </div>
                    <button onClick={handleDelete} className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} /> Excluir Animal
                    </button>
                  </div>
                </div>
              </div>

              {/* DIREITA */}
              <div className="w-1/2 flex flex-col overflow-hidden">

                {/* DIREITA SUPERIOR — Foto */}
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
                        {uploadingFoto ? (
                          <><Loader size={22} className="text-orange-400 animate-spin" /><span className="text-xs text-gray-400">Enviando...</span></>
                        ) : (
                          <><Upload size={22} className="text-gray-300 group-hover:text-orange-400 transition-colors" /><span className="text-xs font-semibold text-gray-400 group-hover:text-orange-500">Adicionar foto</span><span className="text-xs text-gray-300">JPG, PNG até 5MB</span></>
                        )}
                      </button>
                    )}
                  </div>
                  {fotoError && <p className="text-xs text-red-500 mt-2 flex-shrink-0">{fotoError}</p>}
                </div>

                {/* DIREITA INFERIOR — Histórico */}
                <div className="h-1/2 overflow-y-auto p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Histórico</p>
                  <div className="space-y-4">

                    {/* Histórico de pesos */}
                    <HistSection title="Pesagens" count={pesos.length} defaultOpen={true}>
                      {pesos.length === 0 ? (
                        <p className="text-xs text-gray-300 text-center py-2">Nenhuma pesagem registrada.</p>
                      ) : pesos.map((p, i) => {
                        const anterior = pesos[i + 1]
                        const ganho = anterior ? (p.peso - anterior.peso).toFixed(1) : null
                        return (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <div className="text-xs font-bold text-gray-700">{p.peso} kg</div>
                              <div className="text-xs text-gray-400">{fd(p.data_peso)}</div>
                              {p.observacao && <div className="text-xs text-gray-400 mt-0.5 italic">{p.observacao}</div>}
                            </div>
                            {ganho !== null && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${
                                parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-500' :
                                parseFloat(ganho) < 0 ? 'bg-gray-100 text-red-400' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                {parseFloat(ganho) > 0 ? '+' : ''}{ganho} kg
                              </span>
                            )}
                          </div>
                        )
                      })}
                      <button
                        onClick={() => { setShowPesoForm(true) }}
                        className="w-full mt-1 py-1.5 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus size={11} /> Registrar peso
                      </button>
                    </HistSection>

                    {/* Confinamento */}
                    <HistSection title="Confinamento" count={confinamentos.length} defaultOpen={false}>
                      {confinamentos.length === 0 ? (
                        <p className="text-xs text-gray-300 text-center py-2">Nenhum registro.</p>
                      ) : confinamentos.map((c) => {
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
                      })}
                      <button onClick={() => setModalConf(true)} className="w-full mt-1 py-1.5 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-1">
                        <Plus size={11} /> Novo
                      </button>
                    </HistSection>

                    {/* Reprodução */}
                    {animal.sexo === 'FÊMEA' && (
                      <HistSection title="Reprodução" count={reproducoes.length} defaultOpen={false}>
                        {reproducoes.length === 0 ? (
                          <p className="text-xs text-gray-300 text-center py-2">Nenhum registro.</p>
                        ) : reproducoes.map((r) => (
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
                        ))}
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

      {animal && (
        <>
          <AnimalModal isOpen={modalEdit} onClose={() => setModalEdit(false)} animal={animal} onSaved={handleSaved} />
          <ConfinamentoModal isOpen={modalConf} onClose={() => { setModalConf(false); fetchAll() }} animal={animal} />
          <ReproducaoModal isOpen={modalRep} onClose={() => { setModalRep(false); fetchAll() }} animal={animal} />
          <VendaModal isOpen={modalVenda} onClose={() => setModalVenda(false)} animal={animal} onSaved={handleSaved} />
        </>
      )}
    </div>
  )
}
