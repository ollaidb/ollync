-- Add promotion columns to posts for paid boosts/sponsored visibility

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS promotion_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_posts_boosted_until ON posts(boosted_until);
CREATE INDEX IF NOT EXISTS idx_posts_sponsored_until ON posts(sponsored_until);
