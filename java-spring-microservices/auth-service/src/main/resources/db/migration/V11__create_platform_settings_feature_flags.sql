CREATE TABLE IF NOT EXISTS platform_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value VARCHAR(1000) NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_feature_flags (
  tenant_id VARCHAR(120) NOT NULL,
  flag_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (tenant_id, flag_key)
);
