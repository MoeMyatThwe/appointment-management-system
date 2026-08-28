package com.pm.appointmentservice.dto;

import java.time.LocalTime;

public record BusinessHoursDTO(
    Integer dayOfWeek,
    String dayName,
    boolean enabled,
    LocalTime openTime,
    LocalTime closeTime,
    LocalTime breakStart,
    LocalTime breakEnd) {
}
