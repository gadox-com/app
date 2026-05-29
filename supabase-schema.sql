-- ============================================================
-- GADOX — Schema Supabase
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- FAZENDAS
CREATE TABLE IF NOT EXISTS fazendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  area_hectares NUMERIC(10,2),
  limite_animais INTEGER,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOCAIS / PIQUETES
CREATE TABLE IF NOT EXISTS locais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fazenda_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  area_hectares NUMERIC(10,2),
  limite_animais INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANIMAIS (local: texto livre, sem CHECK hardcoded)
CREATE TABLE IF NOT EXISTS animais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fazenda_id UUID REFERENCES fazendas(id) ON DELETE SET NULL,
  brinco TEXT NOT NULL,
  sexo TEXT NOT NULL CHECK (sexo IN ('MACHO', 'FÊMEA')),
  raca TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI')),
  local TEXT NOT NULL DEFAULT '',
  nascimento DATE,
  peso NUMERIC(8,2),
  data_peso DATE,
  status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'VENDIDO', 'DESCARTE')),
  saida DATE,
  preco_venda NUMERIC(10,2),
  motivo_saida TEXT,
  observacao TEXT,
  usuario TEXT,
  descarte BOOLEAN DEFAULT false,
  mae_id UUID REFERENCES animais(id) ON DELETE SET NULL,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fazenda_id, brinco)
);

-- CONFINAMENTO
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

-- REPRODUÇÃO
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

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_animais_fazenda_id ON animais(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_animais_status ON animais(status);
CREATE INDEX IF NOT EXISTS idx_animais_local ON animais(local);
CREATE INDEX IF NOT EXISTS idx_animais_categoria ON animais(categoria);
CREATE INDEX IF NOT EXISTS idx_animais_brinco ON animais(brinco);
CREATE INDEX IF NOT EXISTS idx_locais_fazenda_id ON locais(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_confinamento_animal_id ON confinamento_historico(animal_id);
CREATE INDEX IF NOT EXISTS idx_reproducao_animal_id ON reproducao(animal_id);

-- TRIGGER updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_animais_updated_at
  BEFORE UPDATE ON animais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fazendas_updated_at
  BEFORE UPDATE ON fazendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY
ALTER TABLE fazendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE locais ENABLE ROW LEVEL SECURITY;
ALTER TABLE animais ENABLE ROW LEVEL SECURITY;
ALTER TABLE confinamento_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE reproducao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fazendas_owner" ON fazendas FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "locais_owner" ON locais FOR ALL
  USING (fazenda_id IN (SELECT id FROM fazendas WHERE user_id = auth.uid()))
  WITH CHECK (fazenda_id IN (SELECT id FROM fazendas WHERE user_id = auth.uid()));

CREATE POLICY "animais_owner" ON animais FOR ALL
  USING (fazenda_id IN (SELECT id FROM fazendas WHERE user_id = auth.uid()))
  WITH CHECK (fazenda_id IN (SELECT id FROM fazendas WHERE user_id = auth.uid()));

CREATE POLICY "confinamento_owner" ON confinamento_historico FOR ALL
  USING (animal_id IN (
    SELECT id FROM animais WHERE fazenda_id IN (SELECT id FROM fazendas WHERE user_id = auth.uid())
  ));

CREATE POLICY "reproducao_owner" ON reproducao FOR ALL
  USING (animal_id IN (
    SELECT id FROM animais WHERE fazenda_id IN (SELECT id FROM fazendas WHERE user_id = auth.uid())
  ));
