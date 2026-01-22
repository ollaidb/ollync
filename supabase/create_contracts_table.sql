-- Table des contrats (génération automatique de PDF)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  counterparty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_type VARCHAR(50) NOT NULL,
  payment_type VARCHAR(50),
  price DECIMAL(10, 2),
  revenue_share_percentage DECIMAL(5, 2),
  exchange_service TEXT,
  contract_content TEXT NOT NULL,
  custom_clauses TEXT,
  status VARCHAR(20) DEFAULT 'generated',
  agreement_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_creator_id ON contracts(creator_id);
CREATE INDEX IF NOT EXISTS idx_contracts_counterparty_id ON contracts(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_contracts_post_id ON contracts(post_id);
CREATE INDEX IF NOT EXISTS idx_contracts_application_id ON contracts(application_id);
