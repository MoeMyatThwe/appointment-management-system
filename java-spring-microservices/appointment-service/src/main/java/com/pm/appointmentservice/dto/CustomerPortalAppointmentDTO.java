package com.pm.appointmentservice.dto;

import java.math.BigDecimal;

public record CustomerPortalAppointmentDTO(
    String id,
    String tenantId,
    String serviceId,
    String serviceName,
    String staffId,
    String staffName,
    String startTime,
    String endTime,
    String status,
    String notes,
    String paymentStatus,
    BigDecimal amountDue,
    BigDecimal amountPaid,
    BigDecimal balance,
    String refundStatus) {}
