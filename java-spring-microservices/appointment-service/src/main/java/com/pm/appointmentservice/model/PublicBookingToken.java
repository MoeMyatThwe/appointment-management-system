package com.pm.appointmentservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "public_booking_tokens")
public class PublicBookingToken {
  @Id private UUID id;
  @Column(nullable = false) private String tenantId;
  @Column(nullable = false) private UUID appointmentId;
  @Column(nullable = false, unique = true, length = 128) private String tokenHash;
  @Column(nullable = false) private Instant createdAt;
  @Column(nullable = false) private Instant expiresAt;
  private Instant revokedAt;

  public UUID getId() { return id; }
  public void setId(UUID value) { id = value; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String value) { tenantId = value; }
  public UUID getAppointmentId() { return appointmentId; }
  public void setAppointmentId(UUID value) { appointmentId = value; }
  public String getTokenHash() { return tokenHash; }
  public void setTokenHash(String value) { tokenHash = value; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant value) { createdAt = value; }
  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant value) { expiresAt = value; }
  public Instant getRevokedAt() { return revokedAt; }
  public void setRevokedAt(Instant value) { revokedAt = value; }
}
