import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://shstupvvmaaenmknertc.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_PwlyaWFCZnYUeBEIfvfO0w_UgK6uLpj'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Retorna o fazenda_id do usuário logado
export async function getFazendaId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.user_metadata?.fazenda_id || null
}

// Retorna os locais da fazenda do usuário logado
export async function getLocais() {
  const fazendaId = await getFazendaId()
  if (!fazendaId) return []
  const { data } = await supabase.from('locais').select('nome').eq('fazenda_id', fazendaId).order('nome')
  return (data || []).map(l => l.nome)
}

// Retorna o nome da fazenda do usuário logado
export async function getNomeFazenda() {
  const fazendaId = await getFazendaId()
  if (!fazendaId) return 'GadoX'
  const { data } = await supabase.from('fazendas').select('nome').eq('id', fazendaId).single()
  return data?.nome || 'GadoX'
}