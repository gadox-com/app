import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Edit2, Home, Syringe, DollarSign, Trash2, Plus, Save, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import AnimalModal from './AnimalModal'
import ConfinamentoModal from './ConfinamentoModal'
import ReproducaoModal from './ReproducaoModal'
import VendaModal from './VendaModal'

function Section({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700">{title}</span>
          {count !== undefined && (
            <span className="text-xs bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
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
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
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

  function handleSaved() {
    fetchAll()
    onSaved?.()
  }

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
  const formatMoney = (v) => v ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'

  const idade = () => {
    if (!animal?.nascimento) return null
    const meses = Math.floor((new Date() - new Date(animal.nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
    return meses < 24 ? `${meses} meses` : `${Math.floor(meses / 12)} anos`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — slide from right */}
      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">

        {loading || !animal ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-lg font-bold text-gray-900">#{animal.brinco}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    animal.status === 'ATIVO' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {animal.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{animal.raca} · {animal.categoria} · {animal.sexo}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
              <button onClick={() => setModalEdit(true)} className="btn-secondary py-1.5 text-xs flex-shrink-0">
                <Edit2 size={13} /> Editar
              </button>
              <button onClick={() => setModalConf(true)} className="btn-secondary py-1.5 text-xs flex-shrink-0">
                <Home size={13} /> Confinamento
              </button>
              {animal.sexo === 'FÊMEA' && (
                <button onClick={() => setModalRep(true)} className="btn-secondary py-1.5 text-xs flex-shrink-0">
                  <Syringe size={13} /> Reprodução
                </button>
              )}
              {animal.status === 'ATIVO' && (
                <button onClick={() => setModalVenda(true)} className="btn-primary py-1.5 text-xs flex-shrink-0">
                  <DollarSign size={13} /> Registrar Venda
                </button>
              )}
              <button onClick={handleDelete} className="ml-auto p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Informações básicas */}
              <Section title="Informações" defaultOpen={true}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    { label: 'Brinco', value: animal.brinco },
                    { label: 'Sexo', value: animal.sexo },
                    { label: 'Raça', value: animal.raca },
                    { label: 'Categoria', value: animal.categoria },
                    { label: 'Local', value: animal.local },
                    { label: 'Status', value: animal.status },
                    { label: 'Nascimento', value: formatDate(animal.nascimento) },
                    { label: 'Idade', value: idade() || '—' },
                    { label: 'Peso', value: animal.peso ? `${animal.peso} kg` : '—' },
                    { label: 'Data do Peso', value: formatDate(animal.data_peso) },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="text-xs text-gray-400 font-medium mb-0.5">{item.label}</div>
                      <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                    </div>
                  ))}
                  {animal.observacao && (
                    <div className="col-span-2">
                      <div className="text-xs text-gray-400 font-medium mb-0.5">Observação</div>
                      <div className="text-sm text-gray-700">{animal.observacao}</div>
                    </div>
                  )}
                </div>
              </Section>

              {/* Venda */}
              {animal.status === 'VENDIDO' && (
                <Section title="Dados da Venda" defaultOpen={true}>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      { label: 'Data de Saída', value: formatDate(animal.saida) },
                      { label: 'Valor da Venda', value: formatMoney(animal.preco_venda) },
                      { label: 'Motivo', value: animal.motivo_saida || '—' },
                      {
                        label: 'R$/kg',
                        value: animal.preco_venda && animal.peso
                          ? `R$ ${(animal.preco_venda / animal.peso).toFixed(2)}`
                          : '—'
                      },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="text-xs text-gray-400 font-medium mb-0.5">{item.label}</div>
                        <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Confinamento */}
              <Section title="Histórico de Confinamento" count={confinamentos.length} defaultOpen={confinamentos.length > 0}>
                {confinamentos.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">Nenhum registro de confinamento.</p>
                ) : (
                  <div className="space-y-2">
                    {confinamentos.map((c, i) => {
                      const ganho = c.peso && c.peso_inicial ? (c.peso - c.peso_inicial).toFixed(1) : null
                      return (
                        <div key={c.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <div className="text-xs font-bold text-gray-500 mb-1">
                              Entrada: {formatDate(c.data_confinamento)}
                            </div>
                            <div className="flex gap-4 text-xs text-gray-600">
                              {c.peso_inicial && <span>Inicial: <strong>{c.peso_inicial} kg</strong></span>}
                              {c.peso && <span>Atual: <strong>{c.peso} kg</strong></span>}
                              {c.data_peso && <span>Data: <strong>{formatDate(c.data_peso)}</strong></span>}
                            </div>
                            {c.observacao && <p className="text-xs text-gray-400 mt-1">{c.observacao}</p>}
                          </div>
                          {ganho !== null && (
                            <span className={`text-sm font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ml-3 ${
                              parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {parseFloat(ganho) > 0 ? '+' : ''}{ganho} kg
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                <button onClick={() => setModalConf(true)} className="mt-3 w-full py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-1.5">
                  <Plus size={12} /> Novo registro
                </button>
              </Section>

              {/* Reprodução */}
              {animal.sexo === 'FÊMEA' && (
                <Section title="Histórico Reprodutivo" count={reproducoes.length} defaultOpen={reproducoes.length > 0}>
                  {reproducoes.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-3">Nenhum registro reprodutivo.</p>
                  ) : (
                    <div className="space-y-2">
                      {reproducoes.map((r) => (
                        <div key={r.id} className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-start justify-between mb-1">
                            <div className="text-xs font-bold text-gray-500">
                              Inseminação: {formatDate(r.data_inseminacao)}
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                              r.resultado === 'POSITIVO' ? 'bg-orange-50 text-orange-600' :
                              r.resultado === 'NEGATIVO' ? 'bg-gray-100 text-gray-500' :
                              'bg-gray-100 text-gray-400'
                            }`}>
                              {r.resultado}
                            </span>
                          </div>
                          <div className="flex gap-4 text-xs text-gray-500">
                            {r.data_protocolo && <span>Protocolo: <strong>{formatDate(r.data_protocolo)}</strong></span>}
                            {r.touro && <span>Touro: <strong>{r.touro}</strong></span>}
                            {r.peso && <span>Peso: <strong>{r.peso} kg</strong></span>}
                          </div>
                          {r.observacao && <p className="text-xs text-gray-400 mt-1">{r.observacao}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setModalRep(true)} className="mt-3 w-full py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-1.5">
                    <Plus size={12} /> Nova inseminação
                  </button>
                </Section>
              )}

            </div>
          </>
        )}
      </div>

      {/* Sub-modals */}
      {animal && (
        <>
          <AnimalModal
            isOpen={modalEdit}
            onClose={() => setModalEdit(false)}
            animal={animal}
            onSaved={handleSaved}
          />
          <ConfinamentoModal
            isOpen={modalConf}
            onClose={() => { setModalConf(false); fetchAll() }}
            animal={animal}
          />
          <ReproducaoModal
            isOpen={modalRep}
            onClose={() => { setModalRep(false); fetchAll() }}
            animal={animal}
          />
          <VendaModal
            isOpen={modalVenda}
            onClose={() => setModalVenda(false)}
            animal={animal}
            onSaved={handleSaved}
          />
        </>
      )}
    </div>
  )
}
