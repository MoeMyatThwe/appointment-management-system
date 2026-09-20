package com.pm.appointmentservice.dto;

import java.util.List;

public record ReportSummaryDTO(
    long totalAppointments,
    long upcomingAppointments,
    long completedAppointments,
    long cancelledAppointments,
    long customerCount,
    List<ServiceDemandDTO> serviceDemand) {}
