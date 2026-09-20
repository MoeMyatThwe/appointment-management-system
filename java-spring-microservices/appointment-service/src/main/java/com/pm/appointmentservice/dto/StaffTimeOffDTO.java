package com.pm.appointmentservice.dto;

public record StaffTimeOffDTO(
    String id, String staffId, String startTime, String endTime, String reason) {
}
