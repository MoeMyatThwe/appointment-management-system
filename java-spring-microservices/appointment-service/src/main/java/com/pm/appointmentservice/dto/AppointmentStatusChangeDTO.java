package com.pm.appointmentservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AppointmentStatusChangeDTO(@NotBlank String status, @Size(max = 500) String reason) {
}
