package com.pm.appointmentservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record PaymentRequestDTO(
    @DecimalMin(value = "0.01") BigDecimal amountPaid,
    @NotBlank @Size(min = 2, max = 30) @Pattern(regexp = "^[A-Za-z0-9 _-]+$") String paymentMethod,
    @Size(min = 3, max = 3) String currency,
    @Pattern(regexp = "^(UNPAID|PENDING|FAILED|PARTIALLY_PAID|PAID)?$") String status) {}
