import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart3, Download, FileText, Filter, RefreshCw } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const FAIXA_MESES = [
  { label: 'Todos', value: 'Todos' },
  { label: '0 – 12 meses', value: '0-12' },
  { label: '13 – 24 meses', value: '13-24' },
  { label: '25 – 36 meses', value: '25-36' },
  { label: '+ 36 meses', value: '36+' },
  { label: '+ 5 anos', value: '60+' },
  { label: '+ 10 anos', value: '120+' },
]

const FAIXA_PESO = [
  { label: 'Todos', value: 'Todos' },
  { label: '50–100', value: '50-100' },
  { label: '100–150', value: '100-150' },
  { label: '150–200', value: '150-200' },
  { label: '200–250', value: '200-250' },
  { label: '250–300', value: '250-300' },
  { label: '+300', value: '300+' },
]

function mesesDeVida(nascimento) {
  if (!nascimento) return null
  return Math.floor((new Date() - new Date(nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
}

function anoNasc(nascimento) {
  if (!nascimento) return '—'
  const parts = String(nascimento).split('T')[0].split('-')
  return `${parts[1]}/${parts[0]}`
}

export default function Relatorios() {
  const [animais, setAnimais] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filters, setFilters] = useState({
    status: 'ATIVO',
    local: 'Todos',
    categoria: 'Todas',
    faixaMeses: [],
    apenasDescarte: false,
    faixaPeso: [],
  })

  useEffect(() => { fetchAnimais() }, [])

  async function fetchAnimais() {
    setLoading(true)
    let all = [], from = 0
    while (true) {
      const { data } = await supabase.from('animais').select('*').order('brinco').range(from, from + 999)
      all = [...all, ...(data || [])]
      if (!data || data.length < 1000) break
      from += 1000
    }
    setAnimais(all)
    setLoading(false)
  }

  function applyFilters(list) {
    let r = [...list]
    if (filters.status !== 'Todos') r = r.filter(a => a.status === filters.status)
    if (filters.local !== 'Todos') r = r.filter(a => a.local === filters.local)
    if (filters.categoria !== 'Todas') r = r.filter(a => a.categoria === filters.categoria)
    if (filters.faixaPeso.length > 0) {
      r = r.filter(a => {
        const p = parseFloat(a.peso)
        if (!p) return false
        return filters.faixaPeso.some(fp => {
          if (fp === '50-100') return p >= 50 && p <= 100
          if (fp === '100-150') return p > 100 && p <= 150
          if (fp === '150-200') return p > 150 && p <= 200
          if (fp === '200-250') return p > 200 && p <= 250
          if (fp === '250-300') return p > 250 && p <= 300
          if (fp === '300+') return p > 300
          return false
        })
      })
    }
    if (filters.apenasDescarte) r = r.filter(a => a.descarte)
    if (filters.faixaMeses.length > 0) {
      r = r.filter(a => {
        const m = mesesDeVida(a.nascimento)
        if (m === null) return false
        return filters.faixaMeses.some(fm => {
          if (fm === '0-12') return m >= 0 && m <= 12
          if (fm === '13-24') return m >= 13 && m <= 24
          if (fm === '25-36') return m >= 25 && m <= 36
          if (fm === '36+') return m > 36
          if (fm === '60+') return m > 60
          if (fm === '120+') return m > 120
          return false
        })
      })
    }
    return r
  }

  const filtered = applyFilters(animais)
  const localAtivo = filters.local !== 'Todos' ? filters.local : null

  function exportCSV() {
    const headers = ['Brinco', 'Sexo', 'Raça', 'Categoria', 'Local', 'Nascimento', 'Peso (kg)', 'Status', 'Descarte']
    const rows = filtered.map(a => [
      a.brinco, a.sexo, a.raca, a.categoria, a.local,
      a.nascimento || '', a.peso || '', a.status, a.descarte ? 'SIM' : '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gadox-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportPDF() {
    setGenerating(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const marginX = 10
      const gap = 8
      const hoje = new Date().toLocaleDateString('pt-BR')
      const dataISO = new Date().toISOString().split('T')[0]

      // Header box height depends on local
      const headerBoxH = localAtivo ? 34 : 22
      const marginTop = headerBoxH + 6

      // Column widths — brinco | raça+cat | ano nasc | campo vazio
      const colW = (pageW - marginX * 2 - gap) / 2
      const brincoW = 18
      const sexoW = 7
      const racaW = 48  // raça + cat juntos completos
      const anoW = 18
      const anoW2 = 18
      const campoW = colW - brincoW - sexoW - racaW - anoW2

      function drawPageHeader() {
        const hH = localAtivo ? 26 : 18

        // Fundo escuro compacto
        doc.setFillColor(15, 15, 15)
        doc.rect(marginX, 5, pageW - marginX * 2, hH, 'F')

        // Nome fazenda
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(255, 255, 255)
        doc.text('FAZENDA SÃO BRÁS', marginX + 5, 12)

        // Filtros ativos como pills
        let infoTxt = `${hoje}  ·  ${filtered.length} animais`
        if (filters.status !== 'Todos') infoTxt += `  ·  ${filters.status}`
        if (filters.categoria !== 'Todas') infoTxt += `  ·  ${filters.categoria}`
        if (filters.faixaPeso !== 'Todos') {
      r = r.filter(a => {
        const p = parseFloat(a.peso)
        if (!p) return false
        if (filters.faixaPeso === '50-100') return p >= 50 && p <= 100
        if (filters.faixaPeso === '100-150') return p > 100 && p <= 150
        if (filters.faixaPeso === '150-200') return p > 150 && p <= 200
        if (filters.faixaPeso === '200-250') return p > 200 && p <= 250
        if (filters.faixaPeso === '250-300') return p > 250 && p <= 300
        if (filters.faixaPeso === '300+') return p > 300
        return true
      })
    }
    if (filters.apenasDescarte) r = r.filter(a => a.descarte)
    if (filters.faixaMeses !== 'Todos') {
          const fl = FAIXA_MESES.find(f => f.value === filters.faixaMeses)
          if (fl) infoTxt += `  ·  ${fl.label}`
        }
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(160, 160, 160)
        doc.text(infoTxt, marginX + 5, 18)

        // Local — box branco canto direito compacto
        if (localAtivo) {
          const boxW = 52
          const boxX = pageW - marginX - boxW - 2
          doc.setFillColor(255, 255, 255)
          doc.roundedRect(boxX, 7, boxW, hH - 2, 2, 2, 'F')
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(6)
          doc.setTextColor(140, 140, 140)
          doc.text('LOCAL', boxX + boxW / 2, 12, { align: 'center' })
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(0, 0, 0)
          doc.text(localAtivo, boxX + boxW / 2, 22, { align: 'center' })
        }

        // Linha fina separadora
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.25)
        doc.line(marginX, 5 + hH + 1, pageW - marginX, 5 + hH + 1)
      }

      const rows = filtered.map(a => [
        (a.descarte ? '* ' : '') + a.brinco,
        a.sexo === 'MACHO' ? 'M' : 'F',
        `${a.raca || ''}${a.categoria ? ' · ' + a.categoria : ''}`,
        anoNasc(a.nascimento),
        '', // campo vazio para preencher à caneta
      ])

      const tableStyle = (xLeft) => ({
        startY: marginTop,
        margin: { left: xLeft, right: 0, top: marginTop, bottom: 8 },
        tableWidth: colW,
        styles: {
          fontSize: 8,
          cellPadding: { top: 1.8, bottom: 1.8, left: 2.5, right: 2.5 },
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          overflow: 'hidden',
          font: 'helvetica',
          minCellHeight: 0,
        },
        headStyles: {
          fillColor: [30, 30, 30],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
          minCellHeight: 0,
          valign: 'middle',
        },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: brincoW, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: sexoW, halign: 'center' },
          2: { cellWidth: racaW, fontSize: 7, textColor: [100, 100, 100] },
          3: { cellWidth: anoW, halign: 'center' },
          4: { cellWidth: campoW },
        },
        showHead: 'everyPage',
        rowPageBreak: 'avoid',
        didDrawPage: () => { drawPageHeader() },
      })

      const head = [['Brinco', 'S', 'Raça · Cat.', 'Nasc.', '_____________']]

      const rowH = 7
      const headerH = 8
      const availH = pageH - marginTop - 8
      const rowsPerCol = Math.floor((availH - headerH) / rowH)
      const rowsPerPage = rowsPerCol * 2
      const totalPages = Math.ceil(rows.length / rowsPerPage)

      for (let pg = 0; pg < totalPages; pg++) {
        if (pg > 0) doc.addPage()
        drawPageHeader()

        const pageRows = rows.slice(pg * rowsPerPage, (pg + 1) * rowsPerPage)
        const leftRows = pageRows.slice(0, rowsPerCol)
        const rightRows = pageRows.slice(rowsPerCol)

        if (leftRows.length > 0) {
          autoTable(doc, { ...tableStyle(marginX), head, body: leftRows, didDrawPage: () => {} })
        }
        if (rightRows.length > 0) {
          autoTable(doc, { ...tableStyle(marginX + colW + gap), head, body: rightRows, startY: marginTop, didDrawPage: () => {} })
        }

        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Página ${pg + 1} de ${totalPages}`, pageW - marginX, pageH - 4, { align: 'right' })
        doc.setTextColor(180)
        doc.text('GadoX  |  * = Descarte', marginX, pageH - 4)
      }

      doc.save(`gadox-${dataISO}.pdf`)
    } catch (err) {
      alert('Erro ao gerar PDF: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const stats = (() => {
    const comPeso = filtered.filter(a => a.peso && a.status === 'ATIVO')
    const pesoTotal = comPeso.reduce((s, a) => s + a.peso, 0)
    const pesoMedio = comPeso.length ? pesoTotal / comPeso.length : 0
    const porCategoria = {}
    filtered.filter(a => a.status === 'ATIVO').forEach(a => {
      porCategoria[a.categoria] = (porCategoria[a.categoria] || 0) + 1
    })
    return { pesoMedio: pesoMedio.toFixed(1), pesoTotal: pesoTotal.toFixed(0), porCategoria }
  })()

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Exporte e analise os dados do rebanho</p>
        </div>
        <button onClick={fetchAnimais} className="btn-secondary p-2"><RefreshCw size={15} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Filtros */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={15} className="text-orange-500" />
              <span className="font-semibold text-gray-900 text-sm">Filtros</span>
            </div>
            <div className="space-y-4">

              {/* Status */}
              <div>
                <label className="label">Status</label>
                <div className="flex gap-1.5">
                  {[{v:'Todos',l:'Todos',active:'bg-gray-800 text-white border-gray-800'},{v:'ATIVO',l:'● Ativos',active:'bg-green-600 text-white border-green-600'},{v:'VENDIDO',l:'○ Inativos',active:'bg-gray-500 text-white border-gray-500'}].map(s => (
                    <button key={s.v} onClick={() => setFilters(f => ({ ...f, status: s.v }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${filters.status === s.v ? s.active : 'bg-white text-gray-500 border-gray-150 hover:border-gray-300'}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Local */}
              <div>
                <label className="label">Local</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Todos', 'SARANDI', 'CASA', 'CAPANEMA'].map(l => (
                    <button key={l} onClick={() => setFilters(f => ({ ...f, local: l }))}
                      className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${filters.local === l ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-150 hover:border-gray-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Idade — multi-select */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Faixa de Idade</label>
                  {filters.faixaMeses.length > 0 && <button onClick={() => setFilters(f => ({ ...f, faixaMeses: [] }))} className="text-xs text-orange-400 hover:text-orange-600 font-semibold">Limpar</button>}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {FAIXA_MESES.filter(f => f.value !== 'Todos').map(f => {
                    const sel = filters.faixaMeses.includes(f.value)
                    return (
                      <button key={f.value} onClick={() => setFilters(fi => ({ ...fi, faixaMeses: sel ? fi.faixaMeses.filter(x => x !== f.value) : [...fi.faixaMeses, f.value] }))}
                        className={`py-2 rounded-xl text-xs font-bold border-2 transition-all leading-tight ${sel ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}>
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Peso — multi-select */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Peso (kg)</label>
                  {filters.faixaPeso.length > 0 && <button onClick={() => setFilters(f => ({ ...f, faixaPeso: [] }))} className="text-xs text-blue-400 hover:text-blue-600 font-semibold">Limpar</button>}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {FAIXA_PESO.filter(f => f.value !== 'Todos').map(f => {
                    const sel = filters.faixaPeso.includes(f.value)
                    return (
                      <button key={f.value} onClick={() => setFilters(fi => ({ ...fi, faixaPeso: sel ? fi.faixaPeso.filter(x => x !== f.value) : [...fi.faixaPeso, f.value] }))}
                        className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${sel ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Categoria + Descarte — discretos */}
              <div className="flex items-end gap-2 pt-1 border-t border-gray-100">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Categoria</label>
                  <select className="w-full px-2 py-1.5 rounded-lg border border-gray-150 text-xs text-gray-500 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300" value={filters.categoria} onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))}>
                    {['Todas', 'BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => setFilters(f => ({ ...f, apenasDescarte: !f.apenasDescarte }))}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex-shrink-0 ${filters.apenasDescarte ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-500'}`}>
                  <svg width="8" height="10" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0h10v8L5 6 0 8V0z"/><rect x="0" y="0" width="1.5" height="12" fill="currentColor"/></svg>
                  Descarte
                </button>
              </div>

            </div>
          </div>

          {/* Exportar */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Download size={15} className="text-orange-500" />
              <span className="font-semibold text-gray-900 text-sm">Exportar</span>
            </div>

            {/* Destaque do local selecionado */}
            {localAtivo && (
              <div className="bg-gray-900 rounded-xl px-4 py-3 mb-3 flex items-center gap-2">
                <span className="text-lg">📍</span>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Local selecionado</p>
                  <p className="text-white font-black text-base tracking-wide">{localAtivo}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button onClick={exportCSV} className="btn-secondary w-full justify-center">
                <FileText size={15} /> Exportar CSV
              </button>
              <button onClick={exportPDF} disabled={generating} className="btn-primary w-full justify-center relative">
                <Download size={15} />
                {generating ? 'Gerando PDF...' : 'Exportar PDF'}
                {(filters.local !== 'Todos' || filters.status !== 'ATIVO' || filters.categoria !== 'Todas' || filters.faixaMeses.length > 0 || filters.faixaPeso.length > 0 || filters.apenasDescarte) && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-300 text-orange-900 rounded-full text-[9px] font-bold flex items-center justify-center">
                    {[filters.local !== 'Todos', filters.status !== 'ATIVO', filters.categoria !== 'Todas', filters.faixaMeses.length > 0, filters.faixaPeso.length > 0, filters.apenasDescarte].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">{filtered.length} registros serão exportados</p>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={15} className="text-orange-500" />
              <span className="font-semibold text-gray-900 text-sm">Resumo</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{filtered.length}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{stats.pesoMedio} kg</div>
                <div className="text-xs text-gray-500">Peso Médio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{filtered.filter(a => a.descarte).length}</div>
                <div className="text-xs text-red-400">Descarte</div>
              </div>
            </div>
            {Object.keys(stats.porCategoria).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Por Categoria</div>
                <div className="space-y-2">
                  {Object.entries(stats.porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                    const total = Object.values(stats.porCategoria).reduce((s, v) => s + v, 0)
                    const pct = ((count / total) * 100).toFixed(0)
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-20 flex-shrink-0">{cat}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {loading ? <LoadingSpinner /> : (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Prévia</span>
                <span className="text-xs text-gray-500">{filtered.length > 10 ? `10 de ${filtered.length}` : `${filtered.length} registros`}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Brinco', 'Raça', 'Cat.', 'Nasc.', 'Peso', 'Status'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.slice(0, 10).map(a => (
                      <tr key={a.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-900">
                          <div className="flex items-center gap-1.5">
                            {a.descarte && (
                              <svg width="7" height="9" viewBox="0 0 10 12" fill="#ef4444" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 0h10v8L5 6 0 8V0z"/>
                                <rect x="0" y="0" width="1.5" height="12" fill="#ef4444"/>
                              </svg>
                            )}
                            {a.brinco}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{a.raca}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{a.categoria}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700 font-medium">{anoNasc(a.nascimento)}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{a.peso ? `${a.peso} kg` : '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={a.status === 'ATIVO' ? 'badge-ativo text-xs' : 'badge-vendido text-xs'}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
