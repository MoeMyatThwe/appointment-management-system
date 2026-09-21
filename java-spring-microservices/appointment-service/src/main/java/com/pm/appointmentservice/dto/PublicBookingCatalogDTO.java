package com.pm.appointmentservice.dto;

import java.util.List;

public record PublicBookingCatalogDTO(
    String businessName, String timezone, List<ServiceDTO> services, List<StaffDTO> staff) {}
