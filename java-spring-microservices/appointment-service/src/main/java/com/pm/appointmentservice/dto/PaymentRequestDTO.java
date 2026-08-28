package com.pm.appointmentservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PaymentRequestDTO(
    @DecimalMin(value = "0.00") BigDecimal amountPaid,
    @Size(max = 30) String paymentMethod,
    @Size(min = 3, max = 3) String currency) {}
