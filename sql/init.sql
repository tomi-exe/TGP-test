CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  nombre_empresa VARCHAR(100) NOT NULL,
  dominio VARCHAR(255) NOT NULL UNIQUE,
  cargo_contacto VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'pending';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS lead_outreach (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  llm_provider VARCHAR(50),
  llm_model VARCHAR(100),
  status VARCHAR(30) DEFAULT 'generated',
  attempts INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lead_outreach ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(50);
ALTER TABLE lead_outreach ADD COLUMN IF NOT EXISTS llm_model VARCHAR(100);
ALTER TABLE lead_outreach ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'generated';
ALTER TABLE lead_outreach ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 1;
ALTER TABLE lead_outreach ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS lead_errors (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  attempts INTEGER NOT NULL,
  error_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_outreach_created_at ON lead_outreach(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_errors_company_id ON lead_errors(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
