package com.pm.authservice.dto;

import java.time.Instant;
import java.util.UUID;

public record SupportAccessDTO(
    UUID id, String tenantId, String requestedBy, String reason, int durationMinutes,
    String status, String consentedBy, Instant createdAt, Instant consentedAt,
    Instant expiresAt, Instant revokedAt) {}
