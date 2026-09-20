package com.pm.appointmentservice.dto;

import java.util.List;

public record DashboardSummaryDTO(
    long appointmentsToday,
    long upcomingAppointments,
    long completedAppointments,
    long cancelledAppointments,
    long customerCount,
    long staffCount,
    long serviceCount,
    List<AppointmentResponseDTO> nextAppointments) {}
