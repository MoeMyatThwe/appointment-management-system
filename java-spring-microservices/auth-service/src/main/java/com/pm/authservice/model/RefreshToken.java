package com.pm.authservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
  @Id private UUID id;
  @Column(nullable = false) private UUID userId;
  @Column(nullable = false, unique = true, length = 128) private String tokenHash;
  @Column(nullable = false) private Instant expiresAt;
  @Column(nullable = false) private Instant createdAt;
  private Instant revokedAt;

  public UUID getId() { return id; }
  public void setId(UUID value) { id = value; }
  public UUID getUserId() { return userId; }
  public void setUserId(UUID value) { userId = value; }
  public String getTokenHash() { return tokenHash; }
  public void setTokenHash(String value) { tokenHash = value; }
  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant value) { expiresAt = value; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant value) { createdAt = value; }
  public Instant getRevokedAt() { return revokedAt; }
  public void setRevokedAt(Instant value) { revokedAt = value; }
}
