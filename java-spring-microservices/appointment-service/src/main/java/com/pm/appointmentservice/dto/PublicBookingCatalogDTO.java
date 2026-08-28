package com.pm.appointmentservice.dto;

import java.util.List;

public record PublicBookingCatalogDTO(
    String businessName, List<ServiceDTO> services, List<StaffDTO> staff) {}
