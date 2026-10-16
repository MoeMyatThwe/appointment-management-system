package com.pm.appointmentservice.controller;

import com.pm.appointmentservice.dto.*;
import com.pm.appointmentservice.service.PublicBookingService;
import com.pm.appointmentservice.feature.FeatureFlagClient;
import com.pm.appointmentservice.security.AccessPolicy;
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

  @GetMapping("/businesses")
  public List<PublicBusinessDTO> businesses() {
    return booking.businesses();
  }

  @GetMapping("/{tenant}/catalog")
  public PublicBookingCatalogDTO catalog(@PathVariable String tenant) {
    requireBooking(tenant); return booking.catalog(tenant);
  }

  @GetMapping("/{tenant}/slots")
  public List<PublicSlotDTO> slots(@PathVariable String tenant, @RequestParam LocalDate date,
      @RequestParam UUID serviceId, @RequestParam UUID staffId,
      @RequestParam(defaultValue = "UTC") String timezone) {
    requireBooking(tenant);
    return booking.slots(tenant, date, serviceId, staffId, timezone);
  }

  @GetMapping("/{tenant}/available-dates")
  public List<LocalDate> availableDates(@PathVariable String tenant,
      @RequestParam LocalDate from, @RequestParam LocalDate to,
      @RequestParam UUID serviceId, @RequestParam UUID staffId,
      @RequestParam(defaultValue = "UTC") String timezone) {
    requireBooking(tenant);
    return booking.availableDates(tenant, from, to, serviceId, staffId, timezone);
  }

  @PostMapping("/{tenant}/appointments")
  public AppointmentResponseDTO book(@PathVariable String tenant,
      @Valid @RequestBody PublicBookingRequestDTO input,
      @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-ID") UUID customerAccountId,
      @RequestHeader("X-User-Email") String customerEmail) {
    requireBooking(tenant);
    AccessPolicy.requireCustomer(role);
    return booking.book(tenant, input, idempotencyKey, customerAccountId, customerEmail);
  }

  @GetMapping("/{tenant}/appointments/manage/{token}")
  public AppointmentResponseDTO manage(@PathVariable String tenant, @PathVariable String token,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-ID") UUID customerAccountId) {
    requireBooking(tenant);
    AccessPolicy.requireCustomer(role);
    return booking.getByManagementToken(tenant, token, customerAccountId);
  }

  @PostMapping("/{tenant}/appointments/manage/{token}/cancel")
  public AppointmentResponseDTO cancel(@PathVariable String tenant, @PathVariable String token,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-ID") UUID customerAccountId) {
    requireBooking(tenant);
    AccessPolicy.requireCustomer(role);
    return booking.cancelByManagementToken(tenant, token, customerAccountId);
  }

  @PostMapping("/{tenant}/appointments/manage/{token}/reschedule")
  public AppointmentResponseDTO reschedule(@PathVariable String tenant, @PathVariable String token,
      @Valid @RequestBody AppointmentTimeChangeDTO input,
      @RequestHeader(value = "X-Timezone", defaultValue = "UTC") String timezone,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-ID") UUID customerAccountId) {
    requireBooking(tenant);
    AccessPolicy.requireCustomer(role);
    return booking.rescheduleByManagementToken(tenant, token, input, timezone, customerAccountId);
  }

  private void requireBooking(String tenant) {
    if (!flags.enabled(tenant, "ONLINE_BOOKING")) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.NOT_FOUND, "Online booking is unavailable");
    }
  }
}
