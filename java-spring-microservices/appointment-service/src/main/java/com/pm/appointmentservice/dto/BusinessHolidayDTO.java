package com.pm.appointmentservice.dto;

import java.time.LocalDate;

public record BusinessHolidayDTO(String id, LocalDate holidayDate, String name) {
}
