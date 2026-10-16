package com.pm.appointmentservice.dto;

public record PublicBusinessDTO(
    String tenantId,
    String name,
    String timezone,
    int serviceCount) {}
