package com.pm.appointmentservice.dto;

import jakarta.validation.constraints.NotBlank;

public record AppointmentTimeChangeDTO(
    @NotBlank String startTime,
    @NotBlank String endTime) {
}
