import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2, Home, Syringe, DollarSign, Trash2, ChevronUp, ChevronDown, X, RefreshCw, Camera } from 'lucide-react'
import AnimalModal from '../components/AnimalModal'
import ConfinamentoModal from '../components/ConfinamentoModal'
import ReproducaoModal from '../components/ReproducaoModal'
import VendaModal from '../components/VendaModal'
import AnimalPerfil from '../components/AnimalPerfil'
import LoadingSpinner from '../components/LoadingSpinner'
import { useRole } from '../lib/role.jsx'

const CATEGORIAS = ['Todas', 'BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']
const STATUS = ['Todos', 'ATIVO', 'VENDIDO']

export default function Animais() {
  const { isViewer } = useRole()
  const [animais, setAnimais] = useState([])
  const [locais, setLocais] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Debounce — só filtra 300ms depois de parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])
  const FILTROS_PADRAO = { status: 'ATIVO', local: 'Todos', categoria: 'Todas', sexo: 'Todos', faixaPeso: [], descarte: false }
  const [filters, setFilters] = useState(FILTROS_PADRAO)
  const [sortField, setSortField] = useState('brinco')
  const [sortDir, setSortDir] = useState('asc')

  const [modalAnimal, setModalAnimal] = useState({ open: false, data: null })
  const [pesoOpen, setPesoOpen] = useState(false)
  const pesoRef = useRef(null)
  const [modalConf, setModalConf] = useState({ open: false, data: null })
  const [modalRep, setModalRep] = useState({ open: false, data: null })
  const [modalVenda, setModalVenda] = useState({ open: false, data: null })
  const [perfilId, setPerfilId] = useState(null)

  useEffect(() => { fetchAnimais() }, [])

  useEffect(() => {
    supabase.from('locais').select('nome').order('nome').then(({ data }) => {
      setLocais(['Todos', ...(data || []).map(l => l.nome), 'VENDIDO'])
    })
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (pesoRef.current && !pesoRef.current.contains(e.target)) setPesoOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Listen for cross-animal navigation from AnimalPerfil
  useEffect(() => {
    const openById = (e) => setPerfilId(e.detail)
    const openByBrinco = async (e) => {
      const norm = String(parseInt(e.detail, 10))
      const { data } = await supabase.from('animais').select('id, brinco')
      const found = (data || []).find(a => String(parseInt(a.brinco, 10)) === norm)
      if (found) setPerfilId(found.id)
    }
    document.addEventListener('openAnimal', openById)
    document.addEventListener('openAnimalByBrinco', openByBrinco)
    return () => {
      document.removeEventListener('openAnimal', openById)
      document.removeEventListener('openAnimalByBrinco', openByBrinco)
    }
  }, [])

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
      ? { status: 'ATIVO', saida: null, motivo_saida: null }
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
    if (filters.sexo !== 'Todos') list = list.filter(a => a.sexo === filters.sexo)
    if (filters.descarte) list = list.filter(a => a.descarte)
    if (filters.faixaPeso.length > 0) {
      const pesoMatch = (peso, faixa) => {
        const p = parseFloat(peso)
        if (!p) return false
        if (faixa === '50-100')  return p >= 50  && p <= 100
        if (faixa === '100-150') return p > 100  && p <= 150
        if (faixa === '150-200') return p > 150  && p <= 200
        if (faixa === '200-250') return p > 200  && p <= 250
        if (faixa === '250-300') return p > 250  && p <= 300
        if (faixa === '300+')    return p > 300
        return false
      }
      list = list.filter(a => filters.faixaPeso.some(f => pesoMatch(a.peso, f)))
    }

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

  const temFiltroAtivo = filters.status !== 'ATIVO' || filters.local !== 'Todos' || filters.categoria !== 'Todas' ||
    filters.sexo !== 'Todos' || filters.faixaPeso.length > 0 || filters.descarte || !!searchInput.trim()

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Animais</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm font-bold text-orange-500">{filtered.length}</span>
            <span className="text-sm text-gray-500">
              {filtered.length === 1 ? 'animal' : 'animais'}
              {temFiltroAtivo ? ' encontrados' : ' ativos'}
            </span>
            {temFiltroAtivo && (
              <span className="text-xs text-gray-500">
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
            {searchInput.trim() && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">&ldquo;{searchInput.trim()}&rdquo;</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAnimais} className="btn-secondary p-2">
            <RefreshCw size={15} />
          </button>
          {!isViewer && (
            <button onClick={() => setModalAnimal({ open: true, data: {} })} className="btn-primary">
              <Plus size={15} /> Cadastrar
            </button>
          )}
        </div>
      </div>

      {/* Busca — campo grande e destacado */}
      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-11 pr-4 py-3.5 text-base bg-white border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all placeholder:text-gray-400"
          placeholder="Buscar por brinco ou raça..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          autoComplete="off"
        />
        {searchInput && (
          <button onClick={() => { setSearch(''); setSearchInput('') }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filtros — sempre visíveis */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4">
        <div className="px-4 py-3 flex items-center gap-2 flex-wrap">

          {/* STATUS — pills */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Status</span>
            <div className="flex gap-1">
              {[{v:'Todos',l:'Todos'},{v:'ATIVO',l:'● Ativo'},{v:'VENDIDO',l:'○ Vendido'}].map(s => (
                <button key={s.v} onClick={() => setFilters(f => ({ ...f, status: s.v }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    filters.status === s.v
                      ? s.v === 'ATIVO' ? 'bg-green-500 text-white shadow-sm'
                        : s.v === 'VENDIDO' ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-gray-700 text-white shadow-sm'
                      : s.v === 'ATIVO' ? 'bg-gray-100 text-green-700 hover:bg-green-50'
                        : s.v === 'VENDIDO' ? 'bg-gray-100 text-red-600 hover:bg-red-50'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{s.l}</button>
              ))}
            </div>
          </div>

          <div className="w-px h-12 bg-gray-200" />

          {/* LOCAL — dropdown */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Local</span>
            <select
              value={filters.local}
              onChange={e => setFilters(f => ({ ...f, local: e.target.value }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer ${
                filters.local !== 'Todos' ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-100 text-gray-700 border-gray-100 hover:bg-gray-200'
              }`}>
              {locais.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="w-px h-12 bg-gray-200" />

          {/* CATEGORIA — dropdown */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Categoria</span>
            <select
              value={filters.categoria}
              onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer ${
                filters.categoria !== 'Todas' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-100 text-gray-700 border-gray-100 hover:bg-gray-200'
              }`}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="w-px h-12 bg-gray-200" />

          {/* SEXO — dropdown */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Sexo</span>
            <select
              value={filters.sexo}
              onChange={e => setFilters(f => ({ ...f, sexo: e.target.value }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer ${
                filters.sexo !== 'Todos' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-100 text-gray-700 border-gray-100 hover:bg-gray-200'
              }`}>
              <option value="Todos">Todos</option>
              <option value="MACHO">♂ Macho</option>
              <option value="FÊMEA">♀ Fêmea</option>
            </select>
          </div>

          <div className="w-px h-12 bg-gray-200" />

          {/* PESO — dropdown multi-select */}
          <div className="flex flex-col gap-1" ref={pesoRef}>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Peso (kg)</span>
            <div className="relative">
              <button
                onClick={() => setPesoOpen(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                  filters.faixaPeso.length > 0 ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-gray-100 text-gray-700 border-gray-100 hover:bg-blue-50 hover:text-blue-600'
                }`}>
                {filters.faixaPeso.length === 0 ? 'Todos' : filters.faixaPeso.length === 1 ? filters.faixaPeso[0] + ' kg' : `${filters.faixaPeso.length} faixas`}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform ${pesoOpen ? 'rotate-180' : ''}`}><path d="M1 3l4 4 4-4"/></svg>
              </button>
              {pesoOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[140px] py-1">
                  {[{v:'50-100',l:'50 – 100 kg'},{v:'100-150',l:'100 – 150 kg'},{v:'150-200',l:'150 – 200 kg'},{v:'200-250',l:'200 – 250 kg'},{v:'250-300',l:'250 – 300 kg'},{v:'300+',l:'Acima de 300 kg'}].map(p => (
                    <label key={p.v} className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={filters.faixaPeso.includes(p.v)}
                        onChange={() => setFilters(f => ({
                          ...f,
                          faixaPeso: f.faixaPeso.includes(p.v)
                            ? f.faixaPeso.filter(x => x !== p.v)
                            : [...f.faixaPeso, p.v]
                        }))}
                        className="accent-blue-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs font-medium text-gray-700">{p.l}</span>
                    </label>
                  ))}
                  {filters.faixaPeso.length > 0 && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => setFilters(f => ({ ...f, faixaPeso: [] }))}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 font-medium transition-colors">
                        Limpar peso
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-px h-12 bg-gray-200" />

          {/* DESCARTE — toggle */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Descarte</span>
            <button onClick={() => setFilters(f => ({ ...f, descarte: !f.descarte }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
                filters.descarte ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-gray-100 text-gray-600 border-gray-100 hover:bg-red-50 hover:text-red-600'
              }`}>
              <svg width="8" height="10" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0h10v8L5 6 0 8V0z"/><rect x="0" y="0" width="1.5" height="12" fill="currentColor"/></svg>
              {filters.descarte ? 'Só descarte' : 'Descarte'}
            </button>
          </div>

          {temFiltroAtivo && (
            <>
              <div className="w-px h-12 bg-gray-200" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-transparent uppercase tracking-wider px-1">-</span>
                <button onClick={() => { setFilters(FILTROS_PADRAO); setSearch(''); setSearchInput('') }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <X size={12} /> Limpar
                </button>
              </div>
            </>
          )}
        </div>
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
                    { label: '', field: 'tem_foto' },
                    { label: 'Brinco', field: 'brinco' },
                    { label: 'Raça', field: 'raca' },
                    { label: 'Categoria', field: 'categoria' },
                    { label: 'Local', field: 'local' },
                    { label: 'Peso', field: 'peso' },
                    { label: 'Data Peso', field: 'data_peso' },
                    { label: 'Status', field: 'status' },
                    { label: 'Cadastro', field: 'created_at' },
                    { label: 'Alterado', field: 'updated_at' },
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
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">
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
                    <td className="px-2 py-3 w-8 text-center">
                      {animal.tem_foto && (
                        <Camera size={13} className="text-orange-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        {animal.descarte && (
                          <svg width="10" height="12" viewBox="0 0 10 12" fill="#ef4444" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0h10v8L5 6 0 8V0z"/>
                            <rect x="0" y="0" width="1.5" height="12" fill="#ef4444"/>
                          </svg>
                        )}
                        {animal.brinco}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{animal.raca}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {animal.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {animal.confinado ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-200 whitespace-nowrap">
                          <Home size={10} /> {animal.local}
                        </span>
                      ) : animal.local}
                    </td>
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
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{animal.created_at ? new Date(animal.created_at).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit'}) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{animal.updated_at ? new Date(animal.updated_at).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit'}) : '—'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {!isViewer && <>
                        {/* Editar */}
                        <button
                          onClick={e => { e.stopPropagation(); setModalAnimal({ open: true, data: animal }) }}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
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
                          className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                        </>
                      }
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