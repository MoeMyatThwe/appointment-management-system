ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end BIGINT;
