package com.pm.appointmentservice.dto;

import jakarta.validation.constraints.NotBlank;

public record AppointmentStatusChangeDTO(@NotBlank String status) {
}
