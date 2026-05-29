import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, MapPin, Beef, LayoutGrid, X, Building2 } from 'lucide-react'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function LocalForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    nome: initial?.nome || '',
    area_hectares: initial?.area_hectares || '',
    limite_animais: initial?.limite_animais || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.nome.trim()) return
    setSaving(true)
    await onSave({
      nome: form.nome.trim().toUpperCase(),
      area_hectares: form.area_hectares ? Number(form.area_hectares) : null,
      limite_animais: form.limite_animais ? Number(form.limite_animais) : null,
    })
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Nome do local / piquete *</label>
        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={form.nome}
          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
          placeholder="Ex: CASA, PIQUETE A, CURRAL..."
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Área (ha)</label>
          <input
            type="number"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={form.area_hectares}
            onChange={e => setForm(f => ({ ...f, area_hectares: e.target.value }))}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Limite de animais</label>
          <input
            type="number"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={form.limite_animais}
            onChange={e => setForm(f => ({ ...f, limite_animais: e.target.value }))}
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
        <button
          onClick={handleSave}
          disabled={saving || !form.nome.trim()}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

export default function Fazendas() {
  const [fazenda, setFazenda] = useState(null)
  const [locais, setLocais] = useState([])
  const [contagemAnimais, setContagemAnimais] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalLocal, setModalLocal] = useState(null)   // null | { local? }
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    setLoading(true)
    const [{ data: fz }, { data: lc }, { data: an }] = await Promise.all([
      supabase.from('fazendas').select('*').single(),
      supabase.from('locais').select('*').order('nome'),
      supabase.from('animais').select('local').eq('status', 'ATIVO'),
    ])
    setFazenda(fz || null)
    setLocais(lc || [])
    const cnt = {}
    ;(an || []).forEach(a => { if (a.local) cnt[a.local] = (cnt[a.local] || 0) + 1 })
    setContagemAnimais(cnt)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveLocal(payload) {
    if (!fazenda) return
    if (modalLocal?.local) {
      await supabase.from('locais').update(payload).eq('id', modalLocal.local.id)
    } else {
      await supabase.from('locais').insert({ ...payload, fazenda_id: fazenda.id })
    }
    setModalLocal(null)
    load()
  }

  async function deleteLocal(local) {
    await supabase.from('locais').delete().eq('id', local.id)
    setConfirmDelete(null)
    load()
  }

  const totalAtivos = Object.values(contagemAnimais).reduce((a, b) => a + b, 0)
  const usoFazenda = fazenda?.limite_animais ? Math.round((totalAtivos / fazenda.limite_animais) * 100) : null

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!fazenda) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <Building2 size={40} className="mb-3 text-gray-300" />
      <p className="font-medium text-gray-500">Fazenda não configurada</p>
      <p className="text-sm mt-1">Entre em contato com o administrador do sistema</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Card da fazenda */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{fazenda.nome}</h1>
            <p className="text-xs text-gray-400">{fazenda.plano}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Beef size={14} className="text-orange-400" />
            <span><span className="font-semibold text-gray-800">{totalAtivos}</span> animais ativos
              {fazenda.limite_animais ? ` / ${fazenda.limite_animais}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin size={14} className="text-orange-400" />
            <span><span className="font-semibold text-gray-800">{locais.length}</span> local{locais.length !== 1 ? 'is' : ''} cadastrado{locais.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {usoFazenda !== null && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Ocupação</span>
              <span>{usoFazenda}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usoFazenda >= 90 ? 'bg-red-400' : usoFazenda >= 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                style={{ width: `${Math.min(usoFazenda, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Locais / Piquetes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Locais / Piquetes</h2>
          <button
            onClick={() => setModalLocal({})}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium"
          >
            <Plus size={15} />
            Novo local
          </button>
        </div>

        {locais.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
            <MapPin size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="font-medium text-gray-500">Nenhum local cadastrado</p>
            <p className="text-sm mt-1">Adicione piquetes, currais ou áreas da fazenda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {locais.map(local => {
              const qtd = contagemAnimais[local.nome] || 0
              const uso = local.limite_animais ? Math.round((qtd / local.limite_animais) * 100) : null
              return (
                <div key={local.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin size={15} className="text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{local.nome}</p>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">
                            <span className="font-medium text-gray-700">{qtd}</span> animais{local.limite_animais ? ` / ${local.limite_animais}` : ''}
                          </span>
                          {local.area_hectares && (
                            <span className="text-xs text-gray-400">
                              <LayoutGrid size={10} className="inline mr-0.5" />{local.area_hectares} ha
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setModalLocal({ local })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(local)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {uso !== null && (
                    <div className="mt-2.5">
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${uso >= 90 ? 'bg-red-400' : uso >= 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                          style={{ width: `${Math.min(uso, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal local */}
      {modalLocal && (
        <Modal
          title={modalLocal.local ? `Editar — ${modalLocal.local.nome}` : 'Novo local / piquete'}
          onClose={() => setModalLocal(null)}
        >
          <LocalForm
            initial={modalLocal.local}
            onSave={saveLocal}
            onClose={() => setModalLocal(null)}
          />
        </Modal>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <Modal title="Confirmar exclusão" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-gray-600 mb-5">
            Excluir o local <span className="font-semibold">"{confirmDelete.nome}"</span>? Os animais neste local não serão afetados.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={() => deleteLocal(confirmDelete)} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2 text-sm font-medium">Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
