package com.pm.authservice.dto;

public record SubscriptionPlanDTO(
    String code, String name, long monthlyPriceCents, int staffLimit, int appointmentLimit) {}
