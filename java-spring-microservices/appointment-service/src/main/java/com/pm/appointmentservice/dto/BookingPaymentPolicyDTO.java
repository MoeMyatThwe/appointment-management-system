package com.pm.appointmentservice.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record BookingPaymentPolicyDTO(
    @NotBlank String paymentMode,
    @DecimalMin("0") @DecimalMax("100") BigDecimal depositPercent,
    @Min(0) int cancellationWindowMinutes,
    @DecimalMin("0") @DecimalMax("100") BigDecimal refundablePercent,
    @NotBlank String currency) {}
