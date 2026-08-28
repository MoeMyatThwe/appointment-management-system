package com.pm.authservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "tenant_feature_flags")
@IdClass(TenantFeatureFlag.Key.class)
public class TenantFeatureFlag {
  @Id private String tenantId;
  @Id private String flagKey;
  private boolean enabled;
  private String updatedBy;
  private Instant updatedAt;

  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getFlagKey() { return flagKey; }
  public void setFlagKey(String flagKey) { this.flagKey = flagKey; }
  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean enabled) { this.enabled = enabled; }
  public String getUpdatedBy() { return updatedBy; }
  public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

  public static class Key implements Serializable {
    private String tenantId;
    private String flagKey;
    public Key() {}
    public Key(String tenantId, String flagKey) { this.tenantId = tenantId; this.flagKey = flagKey; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getFlagKey() { return flagKey; }
    public void setFlagKey(String flagKey) { this.flagKey = flagKey; }
    @Override public boolean equals(Object object) {
      if (!(object instanceof Key other)) return false;
      return java.util.Objects.equals(tenantId, other.tenantId)
          && java.util.Objects.equals(flagKey, other.flagKey);
    }
    @Override public int hashCode() { return java.util.Objects.hash(tenantId, flagKey); }
  }
}
