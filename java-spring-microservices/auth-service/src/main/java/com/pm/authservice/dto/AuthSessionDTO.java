package com.pm.authservice.dto;

public record AuthSessionDTO(String accessToken, String refreshToken, String tenantId) {}
