import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2, Home, Syringe, DollarSign, Trash2, ChevronUp, ChevronDown, Filter, X, RefreshCw, ToggleLeft } from 'lucide-react'
import AnimalModal from '../components/AnimalModal'
import ConfinamentoModal from '../components/ConfinamentoModal'
import ReproducaoModal from '../components/ReproducaoModal'
import VendaModal from '../components/VendaModal'
import AnimalPerfil from '../components/AnimalPerfil'
import LoadingSpinner from '../components/LoadingSpinner'

const CATEGORIAS = ['Todas', 'BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']
const LOCAIS = ['Todos', 'SARANDI', 'CASA', 'CAPANEMA', 'VENDIDO']
const STATUS = ['Todos', 'ATIVO', 'VENDIDO']

export default function Animais() {
  const [animais, setAnimais] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: 'ATIVO', local: 'Todos', categoria: 'Todas' })
  const [sortField, setSortField] = useState('brinco')
  const [sortDir, setSortDir] = useState('asc')
  const [showFilters, setShowFilters] = useState(false)

  const [modalAnimal, setModalAnimal] = useState({ open: false, data: null })
  const [modalConf, setModalConf] = useState({ open: false, data: null })
  const [modalRep, setModalRep] = useState({ open: false, data: null })
  const [modalVenda, setModalVenda] = useState({ open: false, data: null })
  const [perfilId, setPerfilId] = useState(null)

  useEffect(() => { fetchAnimais() }, [])

  async function fetchAnimais() {
    setLoading(true)
    try {
      let all = []
      let from = 0
      const pageSize = 1000
      while (true) {
        const { data, error } = await supabase
          .from('animais')
          .select('*')
          .order('brinco')
          .range(from, from + pageSize - 1)
        if (error) throw error
        all = [...all, ...(data || [])]
        if (!data || data.length < pageSize) break
        from += pageSize
      }
      setAnimais(all)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleStatus(animal, e) {
    e.stopPropagation()
    const novoStatus = animal.status === 'ATIVO' ? 'VENDIDO' : 'ATIVO'
    const updates = novoStatus === 'ATIVO'
      ? { status: 'ATIVO', local: 'CASA', saida: null, motivo_saida: null }
      : { status: 'VENDIDO', local: 'VENDIDO', saida: new Date().toISOString().split('T')[0], motivo_saida: 'Baixa manual' }
    await supabase.from('animais').update(updates).eq('id', animal.id)
    fetchAnimais()
  }

  async function deleteAnimal(animal) {
    if (!confirm(`Excluir animal ${animal.brinco}? Esta ação não pode ser desfeita.`)) return
    await supabase.from('animais').delete().eq('id', animal.id)
    fetchAnimais()
  }

  const filtered = useMemo(() => {
    let list = [...animais]

    if (search.trim()) {
      const q = search.trim()
      const isNumeric = /^\d+$/.test(q)
      list = list.filter(a => {
        if (isNumeric) {
          // Brinco: comparação exata (normaliza zeros à esquerda)
          const brincoNorm = String(parseInt(a.brinco || '0', 10))
          const qNorm = String(parseInt(q, 10))
          return brincoNorm === qNorm
        }
        // Texto: busca parcial em raça e categoria
        const ql = q.toLowerCase()
        return (
          a.brinco?.toLowerCase().includes(ql) ||
          a.raca?.toLowerCase().includes(ql) ||
          a.categoria?.toLowerCase().includes(ql)
        )
      })
    }
    if (filters.status !== 'Todos') list = list.filter(a => a.status === filters.status)
    if (filters.local !== 'Todos') list = list.filter(a => a.local === filters.local)
    if (filters.categoria !== 'Todas') list = list.filter(a => a.categoria === filters.categoria)

    list.sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (sortField === 'brinco') {
        va = parseInt(va) || va; vb = parseInt(vb) || vb
        if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    // Vendidos no final
    const ativos = list.filter(a => a.status !== 'VENDIDO')
    const vendidos = list.filter(a => a.status === 'VENDIDO')
    return [...ativos, ...vendidos]
  }, [animais, search, filters, sortField, sortDir])

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Animais</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm font-bold text-orange-500">{filtered.length}</span>
            <span className="text-sm text-gray-400">
              {filtered.length === 1 ? 'animal' : 'animais'}
              {(filters.status !== 'ATIVO' || filters.local !== 'Todos' || filters.categoria !== 'Todas' || search.trim()) ? ' encontrados' : ' ativos'}
            </span>
            {(filters.status !== 'ATIVO' || filters.local !== 'Todos' || filters.categoria !== 'Todas' || search.trim()) && (
              <span className="text-xs text-gray-300">
                de {animais.length} total
              </span>
            )}
            {filters.status !== 'Todos' && filters.status !== 'ATIVO' && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{filters.status}</span>
            )}
            {filters.local !== 'Todos' && (
              <span className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">{filters.local}</span>
            )}
            {filters.categoria !== 'Todas' && (
              <span className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">{filters.categoria}</span>
            )}
            {search.trim() && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">"{search.trim()}"</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAnimais} className="btn-secondary p-2">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setModalAnimal({ open: true, data: {} })} className="btn-primary">
            <Plus size={15} /> Cadastrar
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder="Buscar por brinco, raça ou categoria..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'border-orange-300 text-orange-600' : ''}`}
          >
            <Filter size={15} /> Filtros
            {(filters.status !== 'ATIVO' || filters.local !== 'Todos' || filters.categoria !== 'Todas') && (
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3 flex-wrap">
            <div>
              <label className="label">Status</label>
              <select className="input-field text-sm" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                {STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Local</label>
              <select className="input-field text-sm" value={filters.local} onChange={e => setFilters(f => ({ ...f, local: e.target.value }))}>
                {LOCAIS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input-field text-sm" value={filters.categoria} onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: 'Todos', local: 'Todos', categoria: 'Todas' })}
                className="btn-secondary text-xs py-2"
              >
                <X size={13} /> Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {[
                    { label: 'Brinco', field: 'brinco' },
                    { label: 'Raça', field: 'raca' },
                    { label: 'Categoria', field: 'categoria' },
                    { label: 'Local', field: 'local' },
                    { label: 'Peso', field: 'peso' },
                    { label: 'Data Peso', field: 'data_peso' },
                    { label: 'Status', field: 'status' },
                  ].map(col => (
                    <th
                      key={col.field}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => toggleSort(col.field)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.field} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                      Nenhum animal encontrado
                    </td>
                  </tr>
                )}
                {filtered.map(animal => (
                  <tr
                    key={animal.id}
                    onClick={() => setPerfilId(animal.id)}
                    className={`hover:bg-orange-50/30 transition-colors cursor-pointer ${animal.status === 'VENDIDO' ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                      {animal.brinco}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{animal.raca}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {animal.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{animal.local}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {animal.peso ? `${animal.peso} kg` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(animal.data_peso)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => toggleStatus(animal, e)}
                        title={animal.status === 'ATIVO' ? 'Clique para desativar' : 'Clique para reativar'}
                        className="transition-opacity hover:opacity-70"
                      >
                        {animal.status === 'ATIVO'
                          ? <span className="badge-ativo"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" />Ativo</span>
                          : <span className="badge-vendido">Inativo</span>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Editar */}
                        <button
                          onClick={e => { e.stopPropagation(); setModalAnimal({ open: true, data: animal }) }}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setModalConf({ open: true, data: animal }) }}
                          className="p-1.5 rounded hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition-colors"
                          title="Confinamento"
                        >
                          <Home size={14} />
                        </button>
                        {animal.sexo === 'FÊMEA' && (
                          <button
                            onClick={e => { e.stopPropagation(); setModalRep({ open: true, data: animal }) }}
                            className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Reprodução"
                          >
                            <Syringe size={14} />
                          </button>
                        )}
                        {animal.status === 'ATIVO' && (
                          <button
                            onClick={e => { e.stopPropagation(); setModalVenda({ open: true, data: animal }) }}
                            className="p-1.5 rounded hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors"
                            title="Registrar Venda"
                          >
                            <DollarSign size={14} />
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); deleteAnimal(animal) }}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}

      <ConfinamentoModal
        isOpen={modalConf.open}
        onClose={() => setModalConf({ open: false, data: null })}
        animal={modalConf.data}
      />
      <ReproducaoModal
        isOpen={modalRep.open}
        onClose={() => setModalRep({ open: false, data: null })}
        animal={modalRep.data}
      />
      <VendaModal
        isOpen={modalVenda.open}
        onClose={() => setModalVenda({ open: false, data: null })}
        animal={modalVenda.data}
        onSaved={fetchAnimais}
      />
      <AnimalPerfil
        isOpen={!!perfilId && !modalAnimal.open}
        onClose={() => setPerfilId(null)}
        animalId={perfilId}
        onSaved={fetchAnimais}
        onRequestEdit={(animal) => setModalAnimal({ open: true, data: animal })}
      />
      <AnimalModal
        isOpen={modalAnimal.open}
        onClose={() => setModalAnimal({ open: false, data: null })}
        animal={modalAnimal.data}
        onSaved={() => { fetchAnimais(); setModalAnimal({ open: false, data: null }) }}
      />
    </div>
  )
}
