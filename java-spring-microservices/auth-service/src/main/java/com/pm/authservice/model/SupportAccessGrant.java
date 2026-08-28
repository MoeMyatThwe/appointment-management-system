package com.pm.authservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "support_access_grants")
public class SupportAccessGrant {
  @Id private UUID id;
  private String tenantId;
  private String requestedBy;
  private String reason;
  private int durationMinutes;
  private String status;
  private String consentedBy;
  private Instant createdAt;
  private Instant consentedAt;
  private Instant expiresAt;
  private Instant revokedAt;

  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getRequestedBy() { return requestedBy; }
  public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public int getDurationMinutes() { return durationMinutes; }
  public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getConsentedBy() { return consentedBy; }
  public void setConsentedBy(String consentedBy) { this.consentedBy = consentedBy; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getConsentedAt() { return consentedAt; }
  public void setConsentedAt(Instant consentedAt) { this.consentedAt = consentedAt; }
  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
  public Instant getRevokedAt() { return revokedAt; }
  public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
}
