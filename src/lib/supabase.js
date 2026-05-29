import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Variáveis de ambiente do Supabase não configuradas!')
  console.error('Copie .env.example para .env e preencha com seus dados.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  db: { schema: 'public' },
  global: {
    headers: { 'x-app-name': 'fazenda-sao-bras' }
  }
})
