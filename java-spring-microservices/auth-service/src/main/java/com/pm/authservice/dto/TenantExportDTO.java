package com.pm.authservice.dto;

import java.time.Instant;

public record TenantExportDTO(
    String tenantId, String tenantName, String ownerEmail, String businessType,
    String timezone, String currency, String accountStatus, String subscriptionPlan,
    String subscriptionStatus, Instant exportedAt) {}
