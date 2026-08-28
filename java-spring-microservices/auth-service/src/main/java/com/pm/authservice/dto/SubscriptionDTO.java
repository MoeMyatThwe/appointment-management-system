package com.pm.authservice.dto;

public record SubscriptionDTO(
    String plan, String status, long monthlyPriceCents, String currency) {}
