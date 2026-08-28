package com.pm.authservice.dto;

public record CurrentUserResponseDTO(
    String id,
    String tenantId,
    String name,
    String email,
    String role,
    String tenantName,
    boolean onboardingCompleted) {
}
