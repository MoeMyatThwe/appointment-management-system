ALTER TABLE users ADD COLUMN IF NOT EXISTS business_type VARCHAR(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_phone VARCHAR(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE users
SET business_type = COALESCE(business_type, 'OTHER'),
    timezone = COALESCE(timezone, 'UTC'),
    currency = COALESCE(currency, 'USD')
WHERE business_type IS NULL
   OR timezone IS NULL
   OR currency IS NULL;
