import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, Scale, ChevronRight, Search, Loader, X, TrendingUp, Calendar, Package, Download } from 'lucide-react'
import AnimalPerfil from '../components/AnimalPerfil'

const fd = (d) => {
  if (!d) return '—'
  const [y, m, day] = String(d).split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

const diffDias = (d) => {
  if (!d) return null
  const dias = Math.floor((new Date() - new Date(d)) / (1000*60*60*24))
  return dias
}

function HistPesoModal({ animal, onClose }) {
  const [pesos, setPesos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('peso_historico')
      .select('*')
      .eq('animal_id', animal.id)
      .order('data_peso', { ascending: false })
      .then(({ data }) => { setPesos(data || []); setLoading(false) })
  }, [animal.id])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">Histórico de Pesos</h3>
            <p className="text-xs text-gray-500">Brinco #{animal.brinco} · {animal.raca}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15} /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : pesos.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">Nenhuma pesagem registrada</div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1">
            {pesos.map((p, i) => {
              const ant = pesos[i + 1]
              const ganho = ant ? (parseFloat(p.peso) - parseFloat(ant.peso)).toFixed(1) : null
              return (
                <div key={p.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <div className="font-mono font-black text-gray-900 text-base leading-tight">{p.peso} kg</div>
                    <div className="text-xs text-gray-400 mt-0.5">{fd(p.data_peso)}{p.observacao ? ` · ${p.observacao}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="text-[10px] font-bold bg-orange-50 text-orange-400 px-1.5 py-0.5 rounded">Atual</span>}
                    {ganho !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${parseFloat(ganho) >= 0 ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-400'}`}>
                        {parseFloat(ganho) >= 0 ? '+' : ''}{ganho}kg
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <button onClick={onClose} className="mt-4 w-full py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 flex-shrink-0">Fechar</button>
      </div>
    </div>
  )
}

function PesoModal({ animal, onSave, onClose }) {
  const [peso, setPeso] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  async function salvar() {
    if (!peso) return
    setSaving(true)
    const { data: uf } = await supabase.from('usuario_fazenda').select('fazenda_id').single()
    await supabase.from('peso_historico').insert([{
      animal_id: animal.id,
      fazenda_id: uf?.fazenda_id,
      peso: parseFloat(peso),
      data_peso: data,
    }])
    await supabase.from('animais').update({ peso: parseFloat(peso), data_peso: data }).eq('id', animal.id)
    setSaving(false)
    onSave(parseFloat(peso), data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Registrar Peso</h3>
            <p className="text-xs text-gray-500">Brinco #{animal.brinco}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Peso (kg) *</label>
            <input type="number" step="0.1" autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold outline-none focus:border-orange-400 transition-colors font-mono"
              placeholder="0.0" value={peso} onChange={e => setPeso(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && salvar()} />
            {animal.peso_inicio_dieta && peso && (
              <p className="text-xs mt-1 font-semibold" style={{ color: parseFloat(peso) >= animal.peso_inicio_dieta ? '#16a34a' : '#ef4444' }}>
                {parseFloat(peso) >= animal.peso_inicio_dieta ? '+' : ''}{(parseFloat(peso) - animal.peso_inicio_dieta).toFixed(1)} kg desde entrada
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Data</label>
            <input type="date" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
              value={data} onChange={e => setData(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={saving || !peso}
            className={`flex-1 py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors ${peso ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {saving ? <Loader size={13} className="animate-spin" /> : <Scale size={13} />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Confinamento({ onNavigate }) {
  const [animais, setAnimais] = useState([])
  const [racoes, setRacoes] = useState({}) // id → nome
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pesoModal, setPesoModal] = useState(null)
  const [perfilId, setPerfilId] = useState(null)
  const [histModal, setHistModal] = useState(null) // animal para ver histórico de pesos

  useEffect(() => { fetchDados() }, [])

  async function fetchDados() {
    setLoading(true)
    const [{ data: a }, { data: r }] = await Promise.all([
      supabase.from('animais')
        .select('id, brinco, raca, categoria, sexo, peso, data_peso, peso_inicio_dieta, data_confinamento, racao_id, confinado')
        .eq('confinado', true)
        .eq('status', 'ATIVO')
        .order('data_confinamento', { ascending: false }),
      supabase.from('racoes').select('id, nome'),
    ])
    setAnimais(a || [])
    const rMap = {}
    ;(r || []).forEach(x => { rMap[x.id] = x.nome })
    setRacoes(rMap)
    setLoading(false)
  }

  const [generating, setGenerating] = useState(false)

  async function exportarPDF() {
    setGenerating(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      // Buscar nome da fazenda
      let nomeFazenda = 'GadoX'
      const { data: uf } = await supabase.from('usuario_fazenda').select('fazenda_id').single()
      if (uf?.fazenda_id) {
        const { data: faz } = await supabase.from('fazendas').select('nome').eq('id', uf.fazenda_id).single()
        if (faz?.nome) nomeFazenda = faz.nome
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const hoje = new Date().toLocaleDateString('pt-BR')
      const dataISO = new Date().toISOString().split('T')[0]

      function drawHeader() {
        doc.setFillColor(15, 15, 15)
        doc.rect(10, 5, pageW - 20, 18, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(255, 255, 255)
        doc.text(nomeFazenda.toUpperCase(), 15, 13)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(180, 180, 180)
        doc.text('FOLHA DE PESAGEM — CONFINAMENTO', 15, 19)
        doc.setTextColor(180, 180, 180)
        doc.text(`Data: ${hoje}  ·  ${animais.length} animais`, pageW - 15, 13, { align: 'right' })
        doc.setTextColor(120, 120, 120)
        doc.text('Responsável: ________________________', pageW - 15, 19, { align: 'right' })
      }

      const rows = [...animais]
        .sort((a, b) => (a.brinco || '').localeCompare(b.brinco || '', undefined, { numeric: true }))
        .map(a => {
          const dias = a.data_confinamento
            ? Math.floor((new Date() - new Date(a.data_confinamento)) / (1000*60*60*24))
            : '—'
          return [
            a.brinco || '—',
            \`\${a.raca || '—'}\`,
            a.categoria || '—',
            a.data_confinamento ? (() => { const [y,m,d] = a.data_confinamento.split('-'); return \`\${d}/\${m}/\${y}\` })() : '—',
            a.peso_inicio_dieta ? \`\${a.peso_inicio_dieta} kg\` : '—',
            a.peso ? \`\${a.peso} kg\` : '—',
            String(dias),
            racoes[a.racao_id] || '—',
            '', // novo peso (preenchido à mão)
          ]
        })

      drawHeader()

      autoTable(doc, {
        startY: 28,
        margin: { left: 10, right: 10 },
        head: [[
          'Brinco', 'Raça', 'Cat.', 'Entrada', 'Peso Entrada', 'Peso Atual', 'Dias', 'Dieta', 'Novo Peso ___________'
        ]],
        body: rows,
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 },
          lineColor: [200, 200, 200],
          lineWidth: 0.2,
          textColor: [0, 0, 0],
          font: 'helvetica',
          minCellHeight: 10,
        },
        headStyles: {
          fillColor: [40, 40, 40],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 28 },
          2: { cellWidth: 18 },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 12, halign: 'center' },
          7: { cellWidth: 25 },
          8: { cellWidth: 'auto', halign: 'left' }, // espaço para escrever
        },
        didDrawPage: () => { drawHeader() },
        showHead: 'everyPage',
      })

      // Rodapé
      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(160)
        doc.text(\`Página \${i} de \${totalPages}\`, pageW - 10, pageH - 5, { align: 'right' })
        doc.text('GadoX — folha de pesagem', 10, pageH - 5)
      }

      doc.save(\`pesagem-confinamento-\${dataISO}.pdf\`)
    } catch (err) {
      alert('Erro ao gerar PDF: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  function atualizarPesoLocal(animalId, peso, data_peso) {
    setAnimais(prev => prev.map(a => a.id === animalId ? { ...a, peso, data_peso } : a))
  }

  const filtered = animais.filter(a => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return a.brinco?.toLowerCase().includes(q) || a.raca?.toLowerCase().includes(q)
  })

  // Totais
  const comGanho = animais.filter(a => a.peso && a.peso_inicio_dieta)
  const ganhoTotal = comGanho.reduce((s, a) => s + (parseFloat(a.peso) - parseFloat(a.peso_inicio_dieta)), 0)
  const diasMedio = animais.filter(a => a.data_confinamento).reduce((s, a) => s + diffDias(a.data_confinamento), 0) / Math.max(1, animais.filter(a => a.data_confinamento).length)
  const gmdMedio = comGanho.length && diasMedio > 0
    ? comGanho.reduce((s, a) => {
        const d = diffDias(a.data_confinamento) || diasMedio
        return s + (parseFloat(a.peso) - parseFloat(a.peso_inicio_dieta)) / d
      }, 0) / comGanho.length
    : 0

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confinamento</h1>
          <p className="text-sm text-gray-500 mt-0.5">{animais.length} animal{animais.length !== 1 ? 'is' : ''} confinado{animais.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportarPDF} disabled={generating || animais.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${animais.length > 0 ? 'bg-gray-900 hover:bg-gray-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            {generating ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
            {generating ? 'Gerando...' : 'Folha de Pesagem'}
          </button>
          <button onClick={fetchDados} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* KPIs */}
      {animais.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-3xl font-black text-gray-900">{animais.length}</div>
            <div className="text-xs text-gray-500 mt-1">Animais confinados</div>
          </div>
          <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4 text-center">
            <div className="text-3xl font-black text-orange-600">{ganhoTotal > 0 ? `+${ganhoTotal.toFixed(0)}` : '—'}</div>
            <div className="text-xs text-orange-400 mt-1">kg ganhos no total</div>
          </div>
          <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center">
            <div className="text-3xl font-black text-green-700">{gmdMedio > 0 ? gmdMedio.toFixed(3) : '—'}</div>
            <div className="text-xs text-green-500 mt-1">GMD médio (kg/dia)</div>
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors shadow-sm"
          placeholder="Buscar por brinco ou raça..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Lista de animais */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">Nenhum animal confinado</p>
          <p className="text-sm text-gray-400 mt-1">Acesse um animal e clique em "Confinamento" para confinar</p>
          <button onClick={() => onNavigate?.('animais')} className="mt-4 text-sm font-semibold text-orange-500 hover:text-orange-700 transition-colors">Ir para Animais →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const ganho = a.peso && a.peso_inicio_dieta ? parseFloat(a.peso) - parseFloat(a.peso_inicio_dieta) : null
            const dias = diffDias(a.data_confinamento)
            const gmd = ganho !== null && dias > 0 ? (ganho / dias).toFixed(3) : null

            return (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-4">
                {/* Brinco + raça */}
                <div className="flex-shrink-0 w-28">
                  <div className="font-mono text-lg font-black text-gray-900 leading-tight">#{a.brinco}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{a.raca} · {a.categoria}</div>
                </div>

                {/* Infos confinamento — layout compacto em colunas */}
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  {/* Entrada */}
                  <div className="text-center min-w-[56px]">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entrada</div>
                    <div className="text-sm font-bold text-gray-900">{a.peso_inicio_dieta ? `${a.peso_inicio_dieta} kg` : '—'}</div>
                    {a.data_confinamento && <div className="text-[10px] text-gray-400">{fd(a.data_confinamento)}</div>}
                  </div>
                  {/* Seta */}
                  <div className="text-gray-300 text-sm">→</div>
                  {/* Atual */}
                  <div className="text-center min-w-[56px]">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atual</div>
                    <div className="text-sm font-bold text-gray-900">{a.peso ? `${a.peso} kg` : '—'}</div>
                    {a.data_peso && <div className="text-[10px] text-gray-400">{fd(a.data_peso)}</div>}
                  </div>
                  {/* Ganho + GMD */}
                  <div className="flex flex-col gap-1">
                    {ganho !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${ganho >= 0 ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-400'}`}>
                        {ganho >= 0 ? '+' : ''}{ganho.toFixed(1)} kg
                      </span>
                    )}
                    {gmd && <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-green-50 text-green-600">GMD {gmd}</span>}
                  </div>
                  {/* Dieta */}
                  {a.racao_id && racoes[a.racao_id] && (
                    <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap">{racoes[a.racao_id]}</span>
                  )}
                  {/* Dias */}
                  {dias !== null && (
                    <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{dias}d</span>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setPesoModal(a)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 transition-colors">
                    <Scale size={12} /> Peso
                  </button>
                  <button onClick={() => setHistModal(a)} title="Histórico de pesos"
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors">
                    <TrendingUp size={12} />
                  </button>
                  <button onClick={() => setPerfilId(a.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors">
                    Perfil <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modais */}
      {histModal && <HistPesoModal animal={histModal} onClose={() => setHistModal(null)} />}
      {pesoModal && (
        <PesoModal
          animal={pesoModal}
          onSave={(peso, data_peso) => atualizarPesoLocal(pesoModal.id, peso, data_peso)}
          onClose={() => setPesoModal(null)}
        />
      )}
      <AnimalPerfil
        isOpen={!!perfilId}
        onClose={() => setPerfilId(null)}
        animalId={perfilId}
        onSaved={fetchDados}
      />
    </div>
  )
}
