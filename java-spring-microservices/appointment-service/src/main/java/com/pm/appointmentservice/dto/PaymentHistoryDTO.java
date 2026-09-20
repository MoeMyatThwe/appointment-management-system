package com.pm.appointmentservice.dto;

import java.math.BigDecimal;

public record PaymentHistoryDTO(
    String id,
    String appointmentId,
    BigDecimal amount,
    String type,
    String paymentMethod,
    String status,
    String createdAt) {}
