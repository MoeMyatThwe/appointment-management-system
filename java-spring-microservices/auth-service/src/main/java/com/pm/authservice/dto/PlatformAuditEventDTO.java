package com.pm.authservice.dto;

import java.time.Instant;
import java.util.UUID;

public record PlatformAuditEventDTO(
    UUID id, String actorEmail, String actorRole, String tenantId,
    String action, String details, Instant createdAt) {}
