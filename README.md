# 🐄 FAZENDA SÃO BRÁS — Controle de Gado

Sistema de gestão de rebanho bovino com React + Vite + Supabase.

---

## 📋 Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)

---

## 🗄️ PASSO 1 — Configurar o Supabase

### 1.1 Criar o projeto
1. Acesse [supabase.com](https://supabase.com) → **New Project**
2. Escolha um nome (ex: `fazenda-sao-bras`)
3. Defina uma senha segura
4. Selecione a região mais próxima (ex: São Paulo)
5. Clique em **Create new project** e aguarde ~2 minutos

### 1.2 Executar o schema do banco
1. No painel do Supabase, acesse: **SQL Editor** (menu lateral)
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor e clique em **Run** (ou Ctrl+Enter)
5. Você verá as tabelas criadas em **Table Editor**

### 1.3 Pegar as credenciais
1. Acesse: **Settings** → **API** (menu lateral)
2. Copie:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public** key → `eyJ...`

---

## ⚙️ PASSO 2 — Configurar o projeto

```bash
# 1. Clonar / entrar na pasta
cd fazenda-sao-bras

# 2. Instalar dependências
npm install

# 3. Criar arquivo de variáveis de ambiente
cp .env.example .env
```

### Editar o arquivo `.env`:
```
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

---

## 🚀 PASSO 3 — Rodar o sistema

```bash
npm run dev
```

Acesse: **http://localhost:5173**

---

## 🏗️ Build para produção

```bash
npm run build
npm run preview
```

A pasta `dist/` pode ser hospedada em qualquer serviço estático:
- [Vercel](https://vercel.com) (recomendado — grátis)
- [Netlify](https://netlify.com)
- GitHub Pages

### Deploy na Vercel
1. `npm install -g vercel`
2. `vercel`
3. Configure as variáveis de ambiente no painel da Vercel

---

## 📂 Estrutura do projeto

```
src/
├── components/
│   ├── Sidebar.jsx          # Menu lateral
│   ├── Modal.jsx            # Modal base
│   ├── AnimalModal.jsx      # Cadastro/edição de animal
│   ├── ConfinamentoModal.jsx
│   ├── ReproducaoModal.jsx
│   ├── VendaModal.jsx
│   ├── PageHeader.jsx
│   └── LoadingSpinner.jsx
├── pages/
│   ├── Dashboard.jsx        # Visão geral e gráficos
│   ├── Animais.jsx          # Listagem completa
│   ├── Confinamento.jsx     # Histórico de confinamento
│   ├── Reproducao.jsx       # Registros reprodutivos
│   ├── Vendas.jsx           # Animais vendidos
│   └── Relatorios.jsx       # Exportação CSV/PDF
├── lib/
│   └── supabase.js          # Cliente Supabase
└── App.jsx                  # Roteamento principal
```

---

## 🗃️ Tabelas do banco

| Tabela | Descrição |
|--------|-----------|
| `animais` | Cadastro principal do rebanho |
| `confinamento_historico` | Histórico de entradas em confinamento |
| `reproducao` | Registros de protocolo e inseminação |

---

## ✅ Funcionalidades

- [x] Dashboard com métricas e gráficos
- [x] Cadastro, edição e exclusão de animais
- [x] Busca e filtros avançados
- [x] Ordenação por brinco (numérica)
- [x] Confinamento com histórico completo
- [x] Reprodução com registro de resultado
- [x] Registro de venda com cálculo R$/kg
- [x] Exportação CSV e PDF
- [x] Suporte a 3000+ animais (sem limite de paginação)

---

## 🔧 Problemas comuns

**"Variáveis de ambiente não configuradas"**
→ Certifique-se que o arquivo `.env` existe e tem os valores corretos.

**"permission denied" no Supabase**
→ Verifique se executou o schema SQL completo, incluindo as políticas RLS.

**Dados não aparecem**
→ Verifique se a anon key está correta e se as políticas RLS estão criadas.
