package com.pm.appointmentservice.controller;

import com.pm.appointmentservice.dto.*;
import com.pm.appointmentservice.service.PublicBookingService;
import com.pm.appointmentservice.feature.FeatureFlagClient;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/booking")
public class PublicBookingController {
  private final PublicBookingService booking;
  private final FeatureFlagClient flags;
  public PublicBookingController(PublicBookingService booking, FeatureFlagClient flags) {
    this.booking = booking; this.flags = flags;
  }

  @GetMapping("/{tenant}/catalog")
  public PublicBookingCatalogDTO catalog(@PathVariable String tenant) {
    requireBooking(tenant); return booking.catalog(tenant);
  }

  @GetMapping("/{tenant}/slots")
  public List<PublicSlotDTO> slots(@PathVariable String tenant, @RequestParam LocalDate date,
      @RequestParam UUID serviceId, @RequestParam UUID staffId) {
    requireBooking(tenant);
    return booking.slots(tenant, date, serviceId, staffId);
  }

  @PostMapping("/{tenant}/appointments")
  public AppointmentResponseDTO book(@PathVariable String tenant,
      @Valid @RequestBody PublicBookingRequestDTO input) {
    requireBooking(tenant);
    return booking.book(tenant, input);
  }

  private void requireBooking(String tenant) {
    if (!flags.enabled(tenant, "ONLINE_BOOKING")) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.NOT_FOUND, "Online booking is unavailable");
    }
  }
}
