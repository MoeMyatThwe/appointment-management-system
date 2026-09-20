package com.pm.authservice.repository;

import java.time.Instant;

public interface PlatformTenantProjection {
  String getTenantId();
  String getTenantName();
  String getOwnerEmail();
  String getBusinessType();
  String getTimezone();
  String getCurrency();
  String getAccountStatus();
  String getSubscriptionPlan();
  String getSubscriptionStatus();
  Instant getDeletionDueAt();
  boolean isActive();
  boolean isOnboardingCompleted();
}
