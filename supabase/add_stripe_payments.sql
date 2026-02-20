-- Stripe payments setup for boosts / sponsored placements
-- Run in Supabase SQL editor

-- 1) Products catalog managed by your app admin
CREATE TABLE IF NOT EXISTS payment_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'eur',
  stripe_price_id TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Stripe customer mapping (1 row per app user)
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3) Payment orders
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES payment_products(id) ON DELETE SET NULL,
  product_code TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'eur',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'failed', 'expired')),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) Stripe webhook/event log (idempotency + audit)
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_products_active ON payment_products(active);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_processed ON payment_events(processed);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION update_payment_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_products_updated_at ON payment_products;
CREATE TRIGGER trg_payment_products_updated_at
BEFORE UPDATE ON payment_products
FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at_column();

DROP TRIGGER IF EXISTS trg_stripe_customers_updated_at ON stripe_customers;
CREATE TRIGGER trg_stripe_customers_updated_at
BEFORE UPDATE ON stripe_customers
FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at_column();

DROP TRIGGER IF EXISTS trg_payment_orders_updated_at ON payment_orders;
CREATE TRIGGER trg_payment_orders_updated_at
BEFORE UPDATE ON payment_orders
FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at_column();

-- RLS
ALTER TABLE payment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Public product read (active only)
DROP POLICY IF EXISTS "Anyone can read active payment products" ON payment_products;
CREATE POLICY "Anyone can read active payment products"
ON payment_products FOR SELECT
USING (active = TRUE);

-- Users can read their own stripe customer row
DROP POLICY IF EXISTS "Users read own stripe customer" ON stripe_customers;
CREATE POLICY "Users read own stripe customer"
ON stripe_customers FOR SELECT
USING (auth.uid() = user_id);

-- Users can read their own orders
DROP POLICY IF EXISTS "Users read own payment orders" ON payment_orders;
CREATE POLICY "Users read own payment orders"
ON payment_orders FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own orders (optional, backend can also handle everything)
DROP POLICY IF EXISTS "Users insert own payment orders" ON payment_orders;
CREATE POLICY "Users insert own payment orders"
ON payment_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- No direct user write access on payment_events
DROP POLICY IF EXISTS "Users read own payment events through orders" ON payment_events;
CREATE POLICY "Users read own payment events through orders"
ON payment_events FOR SELECT
USING (
  order_id IN (
    SELECT id FROM payment_orders WHERE user_id = auth.uid()
  )
);

-- Seed default products (you can edit prices later)
INSERT INTO payment_products (code, name, description, amount_cents, currency, active)
VALUES
  ('BOOST_24H', 'Boost annonce 24h', 'Mise en avant pendant 24 heures', 499, 'eur', TRUE),
  ('BOOST_7D', 'Boost annonce 7 jours', 'Mise en avant pendant 7 jours', 1499, 'eur', TRUE),
  ('BOOST_30D', 'Boost annonce 30 jours', 'Mise en avant pendant 30 jours', 3999, 'eur', TRUE),
  ('SPONSOR_SPOT_BASIC', 'Spot sponsorise basic', 'Placement publicitaire basic', 15000, 'eur', TRUE)
ON CONFLICT (code) DO NOTHING;
