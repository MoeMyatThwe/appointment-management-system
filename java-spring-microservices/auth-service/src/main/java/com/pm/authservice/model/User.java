package com.pm.authservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import java.time.Instant;

@Entity
@Table(name="users")
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private UUID id;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(nullable = false)
  private String password;

  @Column(nullable = false)
  private String role;

  @Column(nullable = false)
  private String tenantId;

  @Column(nullable = false)
  private String tenantName;

  private String businessType;
  private String businessPhone;
  private String timezone;
  private String currency;

  @Column(nullable = false)
  private boolean onboardingCompleted = false;
  @Column(nullable = false)
  private boolean active = true;
  @Column(nullable = false)
  private String accountStatus = "ACTIVE";
  @Column(nullable = false)
  private String subscriptionPlan = "FREE";
  @Column(nullable = false)
  private String subscriptionStatus = "TRIALING";
  private String stripeCustomerId;
  private String stripeSubscriptionId;
  private Long subscriptionCurrentPeriodEnd;
  private Instant deletionRequestedAt;
  private Instant deletionDueAt;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getRole() {
    return role;
  }

  public void setRole(String role) {
    this.role = role;
  }

  public String getTenantId() {
    return tenantId;
  }

  public void setTenantId(String tenantId) {
    this.tenantId = tenantId;
  }

  public String getTenantName() {
    return tenantName;
  }

  public void setTenantName(String tenantName) {
    this.tenantName = tenantName;
  }

  public String getBusinessType() {
    return businessType;
  }

  public void setBusinessType(String businessType) {
    this.businessType = businessType;
  }

  public String getBusinessPhone() {
    return businessPhone;
  }

  public void setBusinessPhone(String businessPhone) {
    this.businessPhone = businessPhone;
  }

  public String getTimezone() {
    return timezone;
  }

  public void setTimezone(String timezone) {
    this.timezone = timezone;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public boolean isOnboardingCompleted() {
    return onboardingCompleted;
  }

  public void setOnboardingCompleted(boolean onboardingCompleted) {
    this.onboardingCompleted = onboardingCompleted;
  }
  public boolean isActive() { return active; }
  public void setActive(boolean active) { this.active = active; }
  public String getAccountStatus() { return accountStatus; }
  public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }
  public String getSubscriptionPlan() { return subscriptionPlan; }
  public void setSubscriptionPlan(String subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; }
  public String getSubscriptionStatus() { return subscriptionStatus; }
  public void setSubscriptionStatus(String subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }
  public String getStripeCustomerId() { return stripeCustomerId; }
  public void setStripeCustomerId(String stripeCustomerId) { this.stripeCustomerId = stripeCustomerId; }
  public String getStripeSubscriptionId() { return stripeSubscriptionId; }
  public void setStripeSubscriptionId(String stripeSubscriptionId) { this.stripeSubscriptionId = stripeSubscriptionId; }
  public Long getSubscriptionCurrentPeriodEnd() { return subscriptionCurrentPeriodEnd; }
  public void setSubscriptionCurrentPeriodEnd(Long subscriptionCurrentPeriodEnd) { this.subscriptionCurrentPeriodEnd = subscriptionCurrentPeriodEnd; }
  public Instant getDeletionRequestedAt() { return deletionRequestedAt; }
  public void setDeletionRequestedAt(Instant deletionRequestedAt) { this.deletionRequestedAt = deletionRequestedAt; }
  public Instant getDeletionDueAt() { return deletionDueAt; }
  public void setDeletionDueAt(Instant deletionDueAt) { this.deletionDueAt = deletionDueAt; }
}
