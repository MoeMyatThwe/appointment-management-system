package com.pm.authservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "customer_accounts")
public class CustomerAccount {
  @Id
  private UUID id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String password;

  @Column(nullable = false)
  private String role = "CUSTOMER";

  @Column(nullable = false)
  private boolean active = true;

  @Column(nullable = false)
  private String accountStatus = "ACTIVE";

  @Column(nullable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;

  public UUID getId() { return id; }
  public void setId(UUID value) { id = value; }
  public String getEmail() { return email; }
  public void setEmail(String value) { email = value; }
  public String getPassword() { return password; }
  public void setPassword(String value) { password = value; }
  public String getRole() { return role; }
  public void setRole(String value) { role = value; }
  public boolean isActive() { return active; }
  public void setActive(boolean value) { active = value; }
  public String getAccountStatus() { return accountStatus; }
  public void setAccountStatus(String value) { accountStatus = value; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant value) { createdAt = value; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant value) { updatedAt = value; }
}
