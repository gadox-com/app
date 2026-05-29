import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, MapPin, Beef, LayoutGrid, X, Check } from 'lucide-react'

// ─── Modal genérico ───────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Formulário Fazenda ───────────────────────────────────────
function FazendaForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    nome: initial?.nome || '',
    area_hectares: initial?.area_hectares || '',
    limite_animais: initial?.limite_animais || '',
    observacao: initial?.observacao || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.nome.trim()) return
    setSaving(true)
    const payload = {
      nome: form.nome.trim(),
      area_hectares: form.area_hectares ? Number(form.area_hectares) : null,
      limite_animais: form.limite_animais ? Number(form.limite_animais) : null,
      observacao: form.observacao.trim() || null,
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Nome da fazenda *</label>
        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={form.nome}
          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
          placeholder="Ex: Fazenda São Brás"
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
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Observação</label>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          rows={2}
          value={form.observacao}
          onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
          placeholder="Opcional"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
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

// ─── Formulário Local ─────────────────────────────────────────
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
        <label className="block text-xs font-medium text-gray-500 mb-1">Nome do local/piquete *</label>
        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={form.nome}
          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
          placeholder="Ex: Piquete A, Curral, Sede..."
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
        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
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

// ─── Card de Fazenda ──────────────────────────────────────────
function FazendaCard({ fazenda, locais, totalAnimais, onEdit, onDelete, onAddLocal, onEditLocal, onDeleteLocal }) {
  const [expanded, setExpanded] = useState(true)
  const uso = fazenda.limite_animais ? Math.round((totalAnimais / fazenda.limite_animais) * 100) : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header da fazenda */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-2 text-left flex-1 min-w-0"
          >
            {expanded ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
            <span className="font-semibold text-gray-900 text-base truncate">{fazenda.nome}</span>
          </button>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <Pencil size={15} />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div className="flex flex-wrap gap-4 mt-3 ml-6">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Beef size={14} className="text-orange-400" />
            <span><span className="font-semibold text-gray-800">{totalAnimais}</span> animais{fazenda.limite_animais ? ` / ${fazenda.limite_animais}` : ''}</span>
          </div>
          {fazenda.area_hectares && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <LayoutGrid size={14} className="text-orange-400" />
              <span><span className="font-semibold text-gray-800">{fazenda.area_hectares}</span> ha</span>
            </div>
          )}
          {locais.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin size={14} className="text-orange-400" />
              <span><span className="font-semibold text-gray-800">{locais.length}</span> local{locais.length !== 1 ? 'is' : ''}</span>
            </div>
          )}
        </div>

        {/* Barra de ocupação */}
        {uso !== null && (
          <div className="mt-3 ml-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Ocupação</span>
              <span>{uso}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${uso >= 90 ? 'bg-red-400' : uso >= 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                style={{ width: `${Math.min(uso, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Locais */}
      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50/50">
          {locais.length > 0 && (
            <div className="px-5 pt-3 pb-2 space-y-1">
              {locais.map(local => (
                <div key={local.id} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin size={13} className="text-orange-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 truncate">{local.nome}</span>
                    {local.area_hectares && (
                      <span className="text-xs text-gray-400">{local.area_hectares} ha</span>
                    )}
                    {local.limite_animais && (
                      <span className="text-xs text-gray-400">· max {local.limite_animais}</span>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => onEditLocal(local)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => onDeleteLocal(local)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-3">
            <button
              onClick={onAddLocal}
              className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              <Plus size={15} />
              Adicionar local/piquete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function Fazendas() {
  const [fazendas, setFazendas] = useState([])
  const [locais, setLocais] = useState([])
  const [contagemAnimais, setContagemAnimais] = useState({})
  const [loading, setLoading] = useState(true)

  // Modals
  const [modalFazenda, setModalFazenda] = useState(null) // null | 'new' | fazenda
  const [modalLocal, setModalLocal] = useState(null)     // null | { fazenda_id, local? }
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const [{ data: fz }, { data: lc }, { data: an }] = await Promise.all([
      supabase.from('fazendas').select('*').eq('user_id', user.id).order('nome'),
      supabase.from('locais').select('*').order('nome'),
      supabase.from('animais').select('fazenda_id').eq('status', 'ATIVO'),
    ])

    setFazendas(fz || [])
    setLocais(lc || [])

    // Contagem por fazenda
    const cnt = {}
    ;(an || []).forEach(a => {
      if (a.fazenda_id) cnt[a.fazenda_id] = (cnt[a.fazenda_id] || 0) + 1
    })
    setContagemAnimais(cnt)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── CRUD Fazenda ──
  async function saveFazenda(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    if (modalFazenda === 'new') {
      await supabase.from('fazendas').insert({ ...payload, user_id: user.id })
    } else {
      await supabase.from('fazendas').update(payload).eq('id', modalFazenda.id)
    }
    setModalFazenda(null)
    load()
  }

  async function deleteFazenda(fazenda) {
    await supabase.from('fazendas').delete().eq('id', fazenda.id)
    setConfirmDelete(null)
    load()
  }

  // ── CRUD Local ──
  async function saveLocal(payload) {
    if (modalLocal.local) {
      await supabase.from('locais').update(payload).eq('id', modalLocal.local.id)
    } else {
      await supabase.from('locais').insert({ ...payload, fazenda_id: modalLocal.fazenda_id })
    }
    setModalLocal(null)
    load()
  }

  async function deleteLocal(local) {
    await supabase.from('locais').delete().eq('id', local.id)
    setConfirmDelete(null)
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fazendas</h1>
          <p className="text-sm text-gray-400 mt-0.5">{fazendas.length} fazenda{fazendas.length !== 1 ? 's' : ''} cadastrada{fazendas.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModalFazenda('new')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={16} />
          Nova fazenda
        </button>
      </div>

      {/* Lista */}
      {fazendas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🏡</div>
          <p className="font-medium text-gray-500">Nenhuma fazenda cadastrada</p>
          <p className="text-sm mt-1">Clique em "Nova fazenda" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fazendas.map(fz => (
            <FazendaCard
              key={fz.id}
              fazenda={fz}
              locais={locais.filter(l => l.fazenda_id === fz.id)}
              totalAnimais={contagemAnimais[fz.id] || 0}
              onEdit={() => setModalFazenda(fz)}
              onDelete={() => setConfirmDelete({ type: 'fazenda', item: fz })}
              onAddLocal={() => setModalLocal({ fazenda_id: fz.id })}
              onEditLocal={local => setModalLocal({ fazenda_id: fz.id, local })}
              onDeleteLocal={local => setConfirmDelete({ type: 'local', item: local })}
            />
          ))}
        </div>
      )}

      {/* Modal nova/editar fazenda */}
      {modalFazenda && (
        <Modal
          title={modalFazenda === 'new' ? 'Nova fazenda' : `Editar — ${modalFazenda.nome}`}
          onClose={() => setModalFazenda(null)}
        >
          <FazendaForm
            initial={modalFazenda === 'new' ? null : modalFazenda}
            onSave={saveFazenda}
            onClose={() => setModalFazenda(null)}
          />
        </Modal>
      )}

      {/* Modal novo/editar local */}
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
            {confirmDelete.type === 'fazenda'
              ? `Excluir a fazenda "${confirmDelete.item.nome}"? Todos os locais vinculados serão removidos.`
              : `Excluir o local "${confirmDelete.item.nome}"?`}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={() => confirmDelete.type === 'fazenda' ? deleteFazenda(confirmDelete.item) : deleteLocal(confirmDelete.item)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2 text-sm font-medium"
            >
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
