import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Edit2, Home, Syringe, DollarSign, Trash2, Plus, ChevronDown, ChevronUp, ImagePlus } from 'lucide-react'
import AnimalModal from './AnimalModal'
import ConfinamentoModal from './ConfinamentoModal'
import ReproducaoModal from './ReproducaoModal'
import VendaModal from './VendaModal'

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value || '—'}</span>
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
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</span>
          {count > 0 && (
            <span className="text-xs bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full leading-none">{count}</span>
          )}
        </div>
        {open ? <ChevronUp size={13} className="text-gray-300" /> : <ChevronDown size={13} className="text-gray-300" />}
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  )
}

export default function AnimalPerfil({ isOpen, onClose, animalId, onSaved }) {
  const [animal, setAnimal] = useState(null)
  const [confinamentos, setConfinamentos] = useState([])
  const [reproducoes, setReproducoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalEdit, setModalEdit] = useState(false)
  const [modalConf, setModalConf] = useState(false)
  const [modalRep, setModalRep] = useState(false)
  const [modalVenda, setModalVenda] = useState(false)

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
    const [{ data: a }, { data: conf }, { data: rep }] = await Promise.all([
      supabase.from('animais').select('*').eq('id', animalId).single(),
      supabase.from('confinamento_historico').select('*').eq('animal_id', animalId).order('data_confinamento', { ascending: false }),
      supabase.from('reproducao').select('*').eq('animal_id', animalId).order('created_at', { ascending: false }),
    ])
    setAnimal(a)
    setConfinamentos(conf || [])
    setReproducoes(rep || [])
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm(`Excluir animal ${animal?.brinco}? Esta ação não pode ser desfeita.`)) return
    await supabase.from('animais').delete().eq('id', animalId)
    onSaved?.()
    onClose()
  }

  function handleSaved() { fetchAll(); onSaved?.() }

  const fd = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
  const fm = (v) => v ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'
  const idade = () => {
    if (!animal?.nascimento) return null
    const m = Math.floor((new Date() - new Date(animal.nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
    return m < 24 ? `${m} meses` : `${Math.floor(m / 12)} anos`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal centralizado */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {loading || !animal ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-gray-900">#{animal.brinco}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  animal.status === 'ATIVO' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'
                }`}>
                  {animal.status}
                </span>
                <span className="text-sm text-gray-400">{animal.raca} · {animal.categoria} · {animal.sexo}</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body — duas colunas */}
            <div className="flex flex-1 overflow-hidden">

              {/* COLUNA ESQUERDA — informações + foto */}
              <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col overflow-y-auto">

                {/* Foto placeholder */}
                <div className="m-4 h-40 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 flex-shrink-0">
                  <ImagePlus size={20} className="text-gray-300" />
                  <span className="text-xs text-gray-400">Foto em breve</span>
                </div>

                {/* Dados */}
                <div className="px-5 pb-5 space-y-3 flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Informações</p>
                  <div className="space-y-3">
                    <InfoRow label="Brinco" value={animal.brinco} />
                    <InfoRow label="Raça" value={animal.raca} />
                    <InfoRow label="Categoria" value={animal.categoria} />
                    <InfoRow label="Sexo" value={animal.sexo} />
                    <InfoRow label="Local" value={animal.local} />
                    <InfoRow label="Nascimento" value={fd(animal.nascimento)} />
                    <InfoRow label="Idade" value={idade()} />
                    <InfoRow label="Peso" value={animal.peso ? `${animal.peso} kg` : null} />
                    <InfoRow label="Data do Peso" value={fd(animal.data_peso)} />
                    {animal.observacao && <InfoRow label="Observação" value={animal.observacao} />}
                  </div>

                  {/* Dados de venda */}
                  {animal.status === 'VENDIDO' && (
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Venda</p>
                      <InfoRow label="Data de Saída" value={fd(animal.saida)} />
                      <InfoRow label="Valor" value={fm(animal.preco_venda)} />
                      <InfoRow label="Motivo" value={animal.motivo_saida} />
                      {animal.preco_venda && animal.peso && (
                        <InfoRow label="R$/kg" value={`R$ ${(animal.preco_venda / animal.peso).toFixed(2)}`} />
                      )}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ações</p>
                    <button onClick={() => setModalEdit(true)} className="btn-secondary w-full justify-center py-2 text-xs">
                      <Edit2 size={13} /> Editar Animal
                    </button>
                    <button onClick={() => setModalConf(true)} className="btn-secondary w-full justify-center py-2 text-xs">
                      <Home size={13} /> Confinamento
                    </button>
                    {animal.sexo === 'FÊMEA' && (
                      <button onClick={() => setModalRep(true)} className="btn-secondary w-full justify-center py-2 text-xs">
                        <Syringe size={13} /> Reprodução
                      </button>
                    )}
                    {animal.status === 'ATIVO' && (
                      <button onClick={() => setModalVenda(true)} className="btn-primary w-full justify-center py-2 text-xs">
                        <DollarSign size={13} /> Registrar Venda
                      </button>
                    )}
                    <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} /> Excluir Animal
                    </button>
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA — histórico */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Histórico</p>

                {/* Confinamento */}
                <HistSection title="Confinamento" count={confinamentos.length} defaultOpen={true}>
                  {confinamentos.length === 0 ? (
                    <p className="text-sm text-gray-300 text-center py-4">Nenhum registro ainda.</p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {confinamentos.map((c) => {
                        const ganho = c.peso && c.peso_inicial ? (c.peso - c.peso_inicial).toFixed(1) : null
                        return (
                          <div key={c.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <div className="text-xs font-bold text-gray-600 mb-1">Entrada: {fd(c.data_confinamento)}</div>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                {c.peso_inicial && <span>Inicial: <strong>{c.peso_inicial} kg</strong></span>}
                                {c.peso && <span>Atual: <strong>{c.peso} kg</strong></span>}
                                {c.data_peso && <span>Data: <strong>{fd(c.data_peso)}</strong></span>}
                              </div>
                              {c.observacao && <p className="text-xs text-gray-400 mt-1">{c.observacao}</p>}
                            </div>
                            {ganho !== null && (
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ml-2 ${
                                parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {parseFloat(ganho) > 0 ? '+' : ''}{ganho} kg
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <button onClick={() => setModalConf(true)} className="w-full py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-1.5">
                    <Plus size={12} /> Novo registro
                  </button>
                </HistSection>

                {/* Reprodução */}
                {animal.sexo === 'FÊMEA' && (
                  <HistSection title="Reprodução" count={reproducoes.length} defaultOpen={true}>
                    {reproducoes.length === 0 ? (
                      <p className="text-sm text-gray-300 text-center py-4">Nenhum registro ainda.</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {reproducoes.map((r) => (
                          <div key={r.id} className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-gray-600">
                                Inseminação: {fd(r.data_inseminacao)}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                r.resultado === 'POSITIVO' ? 'bg-orange-50 text-orange-500' :
                                r.resultado === 'NEGATIVO' ? 'bg-gray-100 text-gray-500' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                {r.resultado}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                              {r.data_protocolo && <span>Protocolo: <strong>{fd(r.data_protocolo)}</strong></span>}
                              {r.touro && <span>Touro: <strong>{r.touro}</strong></span>}
                              {r.peso && <span>Peso: <strong>{r.peso} kg</strong></span>}
                            </div>
                            {r.observacao && <p className="text-xs text-gray-400 mt-1">{r.observacao}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setModalRep(true)} className="w-full py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-1.5">
                      <Plus size={12} /> Nova inseminação
                    </button>
                  </HistSection>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sub-modals */}
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
