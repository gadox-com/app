import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://shstupvvmaaenmknertc.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_PwlyaWFCZnYUeBEIfvfO0w_UgK6uLpj'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Retorna fazenda_id do usuário logado via tabela usuario_fazenda
export async function getFazendaId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('usuario_fazenda')
    .select('fazenda_id')
    .eq('user_id', user.id)
    .single()
  return data?.fazenda_id || null
}

// Retorna os locais da fazenda do usuário logado
export async function getLocais() {
  const fazendaId = await getFazendaId()
  if (!fazendaId) return []
  const { data } = await supabase
    .from('locais')
    .select('nome')
    .eq('fazenda_id', fazendaId)
    .order('nome')
  return (data || []).map(l => l.nome)
}

// Retorna o nome da fazenda do usuário logado
export async function getNomeFazenda() {
  const fazendaId = await getFazendaId()
  if (!fazendaId) return 'GadoX'
  const { data } = await supabase
    .from('fazendas')
    .select('nome')
    .eq('id', fazendaId)
    .single()
  return data?.nome || 'GadoX'
}
