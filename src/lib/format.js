// Helpers compartilhados — antes duplicados (com pequenas variações) em
// AnimalPerfil, AnimalModal, BuscaRapida, Animais, Vendas, Reproducao,
// ReproducaoModal, ConfinamentoModal, Confinamento, Alimentacao e Relatorios.
// Centralizado aqui pra evitar que uma correção feita num arquivo fique
// faltando nos outros.
//
// Diferente do sistema single-tenant original, o GADOX não tem locais fixos:
// cada fazenda cadastra os seus (tabela `locais`, ver Fazendas.jsx), por isso
// não há LOCAIS_BASE/LOCAIS_FILTRO aqui — quem precisa de locais busca da
// tabela dinamicamente.

export const RACAS = ['Nelore', 'Tabapuã', 'Hereford', 'Angus', 'Braford', 'Girolando', 'Gir', 'Simental', 'Brahman']

// Formata uma data 'YYYY-MM-DD' (ou 'YYYY-MM-DDTHH:mm:ss') como 'DD/MM/YYYY'.
// Não usa o construtor Date pra evitar bug de fuso horário (virar o dia
// anterior dependendo do horário/timezone do navegador).
export function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = String(d).split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

// Meses de vida a partir da data de nascimento.
export function mesesDeVida(nascimento) {
  if (!nascimento) return null
  return Math.floor((new Date() - new Date(nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
}

// 'Xm' se menos de 24 meses, senão 'Xa'.
export function idadeFormatada(nascimento) {
  const m = mesesDeVida(nascimento)
  if (m === null) return null
  return m < 24 ? `${m}m` : `${Math.floor(m / 12)}a`
}

// Categoria (BEZERRO/NOVILHO/BOI/TOURO ou versão fêmea) a partir de
// nascimento + sexo. Usada como fallback quando o campo categoria salvo
// no banco está desatualizado.
export function calcularCategoria(nascimento, sexo) {
  const meses = mesesDeVida(nascimento)
  if (meses === null) return null
  const macho = sexo === 'MACHO'
  if (meses <= 12) return macho ? 'BEZERRO' : 'BEZERRA'
  if (meses <= 24) return macho ? 'NOVILHO' : 'NOVILHA'
  if (meses <= 36) return macho ? 'BOI' : 'VACA'
  return macho ? 'TOURO' : 'VACA'
}

// 'MM/YYYY' a partir de uma data de nascimento.
export function anoNasc(nascimento) {
  if (!nascimento) return '—'
  const parts = String(nascimento).split('T')[0].split('-')
  return `${parts[1]}/${parts[0]}`
}

// Dias corridos desde uma data até hoje. null se não houver data.
export function diffDias(d) {
  if (!d) return null
  return Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60 * 24))
}

// 'R$ 1.234,56'. null/0/undefined → '—'.
export function formatMoney(v) {
  return v ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'
}
