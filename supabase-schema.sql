-- ============================================================
-- FAZENDA SÃO BRÁS – Schema Supabase
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Tabela principal de animais
CREATE TABLE IF NOT EXISTS animais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brinco TEXT NOT NULL UNIQUE,
  sexo TEXT NOT NULL CHECK (sexo IN ('MACHO', 'FÊMEA')),
  raca TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI')),
  local TEXT NOT NULL DEFAULT 'CASA' CHECK (local IN ('SARANDI', 'CASA', 'CAPANEMA', 'VENDIDO')),
  nascimento DATE,
  peso NUMERIC(8,2),
  data_peso DATE,
  status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'VENDIDO')),
  saida DATE,
  preco_venda NUMERIC(10,2),
  motivo_saida TEXT,
  observacao TEXT,
  usuario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de histórico de confinamento
CREATE TABLE IF NOT EXISTS confinamento_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
  data_confinamento DATE NOT NULL,
  peso_inicial NUMERIC(8,2),
  peso NUMERIC(8,2),
  data_peso DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de reprodução
CREATE TABLE IF NOT EXISTS reproducao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
  data_protocolo DATE,
  data_inseminacao DATE,
  touro TEXT,
  resultado TEXT CHECK (resultado IN ('POSITIVO', 'NEGATIVO', 'AGUARDANDO')),
  peso NUMERIC(8,2),
  data_peso DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance (suportar +3000 animais)
CREATE INDEX IF NOT EXISTS idx_animais_status ON animais(status);
CREATE INDEX IF NOT EXISTS idx_animais_local ON animais(local);
CREATE INDEX IF NOT EXISTS idx_animais_categoria ON animais(categoria);
CREATE INDEX IF NOT EXISTS idx_animais_brinco ON animais(brinco);
CREATE INDEX IF NOT EXISTS idx_confinamento_animal_id ON confinamento_historico(animal_id);
CREATE INDEX IF NOT EXISTS idx_reproducao_animal_id ON reproducao(animal_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_animais_updated_at
  BEFORE UPDATE ON animais
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Habilitar para produção
ALTER TABLE animais ENABLE ROW LEVEL SECURITY;
ALTER TABLE confinamento_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE reproducao ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (ajuste conforme necessidade de autenticação)
CREATE POLICY "Acesso público animais" ON animais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público confinamento" ON confinamento_historico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público reproducao" ON reproducao FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DADOS DE EXEMPLO (opcional - remova em produção)
-- ============================================================
INSERT INTO animais (brinco, sexo, raca, categoria, local, nascimento, peso, data_peso, status) VALUES
('001', 'MACHO', 'Nelore', 'NOVILHO', 'SARANDI', '2022-03-15', 380.5, CURRENT_DATE, 'ATIVO'),
('002', 'FÊMEA', 'Nelore', 'VACA', 'CASA', '2019-07-20', 480.0, CURRENT_DATE, 'ATIVO'),
('003', 'MACHO', 'Angus', 'BOI', 'CAPANEMA', '2021-01-10', 520.0, CURRENT_DATE, 'ATIVO'),
('004', 'FÊMEA', 'Girolando', 'NOVILHA', 'SARANDI', '2022-11-05', 320.0, CURRENT_DATE, 'ATIVO'),
('005', 'MACHO', 'Nelore', 'TOURO', 'CASA', '2018-05-12', 780.0, CURRENT_DATE, 'ATIVO');
