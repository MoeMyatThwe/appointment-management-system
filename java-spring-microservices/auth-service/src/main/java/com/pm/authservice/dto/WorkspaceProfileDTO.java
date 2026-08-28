package com.pm.authservice.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkspaceProfileDTO(
    @NotBlank String tenantName,
    @NotBlank String businessType,
    String businessPhone,
    @NotBlank String timezone,
    @NotBlank String currency,
    boolean onboardingCompleted) {
}
