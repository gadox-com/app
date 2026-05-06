import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ── Utilitários ───────────────────────────────────────────────────────
const fd = (d) => {
  if (!d) return '—'
  const s = String(d).split('T')[0]
  const [y, m, day] = s.split('-')
  return `${day}/${m}/${y}`
}

function calcularCategoria(nascimento, sexo) {
  if (!nascimento) return null
  const meses = Math.floor((new Date() - new Date(nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
  const m = sexo === 'MACHO'
  if (meses <= 12) return m ? 'BEZERRO' : 'BEZERRA'
  if (meses <= 24) return m ? 'NOVILHO' : 'NOVILHA'
  if (meses <= 36) return m ? 'BOI' : 'VACA'
  return m ? 'TOURO' : 'VACA'
}

const calcIdade = (nascimento) => {
  if (!nascimento) return null
  const m = Math.floor((new Date() - new Date(nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
  return m < 24 ? `${m} meses` : `${Math.floor(m / 12)} anos`
}

// ── Card de resultado ─────────────────────────────────────────────────
function AnimalCard({ animal, pesos, onVerCompleto }) {
  const cat = calcularCategoria(animal.nascimento, animal.sexo)

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Header laranja com brinco */}
      <div style={{ background: 'linear-gradient(160deg, #f97316 0%, #ea6c0a 100%)' }}
        className="px-5 pt-5 pb-10 -mx-0">
        <button onClick={() => onVerCompleto(null)} className="flex items-center gap-1 text-white/70 text-sm font-semibold mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Buscar outro
        </button>
        <div className="font-mono text-5xl font-black text-white tracking-tight leading-none">{animal.brinco}</div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${animal.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-white/20 text-white'}`}>
            {animal.status === 'ATIVO' ? '● Ativo' : '○ Inativo'}
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white">
            {animal.confinado ? '⊞ Confinado' : '⊟ Solto'}
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white">
            {animal.sexo === 'MACHO' ? 'Macho' : 'Fêmea'}
          </span>
        </div>
      </div>

      {/* Card principal flutuante */}
      <div className="mx-4 -mt-6 bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 4 infos em grid */}
        <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
          {[
            { label: 'Raça', value: animal.raca },
            { label: 'Categoria', value: cat || animal.categoria },
            { label: 'Local', value: animal.local },
            { label: 'Idade', value: calcIdade(animal.nascimento) },
          ].map(f => (
            <div key={f.label} className="px-4 py-3">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{f.label}</div>
              <div className="text-base font-bold text-gray-900">{f.value || '—'}</div>
            </div>
          ))}
        </div>

        {/* Detalhes */}
        <div className="border-t border-gray-100">
          {[
            { k: 'Nascimento', v: fd(animal.nascimento) },
            { k: 'Último Peso', v: animal.peso ? `${animal.peso} kg` : null },
            { k: 'Data Peso', v: fd(animal.data_peso) },
            animal.matriz ? { k: 'Matriz', v: `#${animal.matriz}`, mono: true } : null,
          ].filter(Boolean).map(row => (
            <div key={row.k} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{row.k}</span>
              <span className={`text-sm font-semibold text-gray-900 ${row.mono ? 'font-mono' : ''}`}>{row.v || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pesagens */}
      {pesos.length > 0 && (
        <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pesagens</span>
            <span className="bg-orange-100 text-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pesos.length}</span>
          </div>
          {pesos.slice(0, 4).map((p, i) => {
            const ant = pesos[i + 1]
            const ganho = ant ? (p.peso - ant.peso).toFixed(1) : null
            return (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-base font-bold text-gray-900 font-mono">{p.peso} kg</div>
                  <div className="text-xs text-gray-400">{fd(p.data_peso)}</div>
                </div>
                {ganho !== null && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${parseFloat(ganho) > 0 ? 'bg-orange-50 text-orange-500' : parseFloat(ganho) < 0 ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-400'}`}>
                    {parseFloat(ganho) > 0 ? '+' : ''}{ganho} kg
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Ver perfil completo */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <button onClick={() => onVerCompleto(animal.id)}
          className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="15" x2="12" y2="15"/></svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-gray-900">Ver perfil completo</div>
              <div className="text-xs text-gray-400">Editar, fotos, observações</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  )
}

// ── Principal ─────────────────────────────────────────────────────────
export default function BuscaRapida({ onNavigate }) {
  const [brinco, setBrinco] = useState('')
  const [animal, setAnimal] = useState(null)
  const [pesos, setPesos] = useState([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [recentes, setRecentes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('buscaRecente') || '[]') } catch { return [] }
  })
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!brinco.trim()) { setAnimal(null); setPesos([]); setNotFound(false); return }
    const timer = setTimeout(() => buscar(brinco.trim()), 350)
    return () => clearTimeout(timer)
  }, [brinco])

  async function buscar(val) {
    setLoading(true); setNotFound(false)
    const norm = String(parseInt(val, 10))
    const { data: todos } = await supabase.from('animais').select('*')
    const found = (todos || []).find(a => String(parseInt(a.brinco, 10)) === norm)
    if (found) {
      setAnimal(found)
      const { data: p } = await supabase.from('peso_historico').select('*').eq('animal_id', found.id).order('data_peso', { ascending: false })
      setPesos(p || [])
      // Salvar nos recentes
      const novo = { id: found.id, brinco: found.brinco, raca: found.raca, categoria: found.categoria, local: found.local }
      const atualizados = [novo, ...recentes.filter(r => r.brinco !== found.brinco)].slice(0, 5)
      setRecentes(atualizados)
      localStorage.setItem('buscaRecente', JSON.stringify(atualizados))
    } else {
      setAnimal(null); setPesos([]); setNotFound(true)
    }
    setLoading(false)
  }

  function verCompleto(id) {
    if (!id) { setAnimal(null); setBrinco(''); return }
    // Navega para animais e abre o perfil
    localStorage.setItem('openAnimalId', id)
    onNavigate('animais')
  }

  return (
    <div className="min-h-screen" style={{ background: '#f2f2f7' }}>

      {animal ? (
        <AnimalCard animal={animal} pesos={pesos} onVerCompleto={verCompleto} />
      ) : (
        <div className="flex flex-col">
          {/* Header */}
          <div style={{ background: 'linear-gradient(160deg, #f97316 0%, #ea6c0a 100%)' }}
            className="px-5 pt-10 pb-12 text-center">
            <div className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Fazenda São Brás</div>
            <h1 className="text-2xl font-black text-white">Consulta de Animais</h1>
            <p className="text-sm text-white/75 mt-1">Digite o brinco para buscar</p>
          </div>

          {/* Campo busca flutuante */}
          <div className="mx-4 -mt-7 bg-white rounded-2xl shadow-xl p-5 relative z-10">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Número do Brinco</div>
            <div className={`flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border-2 transition-colors ${brinco ? 'border-orange-300' : 'border-gray-100'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                className="flex-1 bg-transparent outline-none font-mono font-black text-gray-900 placeholder-gray-300"
                style={{ fontSize: 32, letterSpacing: -1 }}
                placeholder="000"
                value={brinco}
                onChange={e => setBrinco(e.target.value)}
              />
              {loading && <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
              {brinco && !loading && (
                <button onClick={() => setBrinco('')} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            {notFound && brinco && (
              <p className="text-sm text-red-400 font-semibold mt-2.5 text-center">Brinco #{brinco} não encontrado</p>
            )}
            {!notFound && !brinco && (
              <p className="text-xs text-gray-400 text-center mt-2">O resultado aparece automaticamente</p>
            )}
          </div>

          {/* Recentes */}
          {recentes.length > 0 && (
            <div className="mx-4 mt-5">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">Consultados recentemente</div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {recentes.map((r, i) => (
                  <button key={r.brinco} onClick={() => setBrinco(r.brinco)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-black text-gray-900">#{r.brinco}</span>
                      <span className="text-sm text-gray-400">{r.raca} · {r.categoria} · {r.local}</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acesso completo */}
          <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">Acesso Completo</div>
                  <div className="text-xs text-gray-400">Dashboard, relatórios e edição</div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
