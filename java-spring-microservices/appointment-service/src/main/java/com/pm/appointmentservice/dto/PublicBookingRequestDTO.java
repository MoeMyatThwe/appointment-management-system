package com.pm.appointmentservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PublicBookingRequestDTO(
    @NotBlank String serviceId,
    @NotBlank String staffId,
    @NotBlank String startTime,
    @NotBlank String endTime,
    @NotBlank String customerName,
    @NotBlank @Email String customerEmail,
    String customerPhone,
    String notes) {}
