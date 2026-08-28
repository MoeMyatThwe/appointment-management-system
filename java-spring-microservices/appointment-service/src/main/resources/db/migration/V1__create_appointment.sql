CREATE TABLE IF NOT EXISTS appointment (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    address VARCHAR(255),
    date_of_birth DATE,
    registered_date DATE,
    business_id VARCHAR(255),
    customer_id VARCHAR(255),
    staff_id VARCHAR(255),
    service_id VARCHAR(255),
    calendar_id VARCHAR(255),
    start_time VARCHAR(255),
    end_time VARCHAR(255),
    status VARCHAR(255),
    notes VARCHAR(1000),
    created_at VARCHAR(255),
    updated_at VARCHAR(255)
);

ALTER TABLE appointment ADD COLUMN IF NOT EXISTS business_id VARCHAR(255);
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255);
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS staff_id VARCHAR(255);
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS service_id VARCHAR(255);
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS calendar_id VARCHAR(255);
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS start_time VARCHAR(255);
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS end_time VARCHAR(255);
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS status VARCHAR(255);
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS created_at VARCHAR(255);
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS updated_at VARCHAR(255);

ALTER TABLE appointment ALTER COLUMN name DROP NOT NULL;
ALTER TABLE appointment ALTER COLUMN email DROP NOT NULL;
ALTER TABLE appointment ALTER COLUMN address DROP NOT NULL;
ALTER TABLE appointment ALTER COLUMN date_of_birth DROP NOT NULL;
ALTER TABLE appointment ALTER COLUMN registered_date DROP NOT NULL;
