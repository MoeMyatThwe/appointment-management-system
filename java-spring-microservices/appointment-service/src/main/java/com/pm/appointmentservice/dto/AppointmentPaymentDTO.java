package com.pm.appointmentservice.dto;

import java.math.BigDecimal;

public record AppointmentPaymentDTO(
    String id, String appointmentId, BigDecimal amountDue, BigDecimal amountPaid,
    BigDecimal balance, String currency, String paymentMethod, String status,
    String receiptNumber, String updatedAt, BigDecimal amountRequired,
    BigDecimal amountRefunded, String refundStatus, String paymentMode) {}
