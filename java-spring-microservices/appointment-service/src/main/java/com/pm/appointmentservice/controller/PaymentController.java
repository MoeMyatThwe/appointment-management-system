package com.pm.appointmentservice.controller;

import com.pm.appointmentservice.dto.AppointmentPaymentDTO;
import com.pm.appointmentservice.dto.PaymentRequestDTO;
import com.pm.appointmentservice.service.PaymentService;
import com.pm.appointmentservice.service.StripeCheckoutService;
import com.pm.appointmentservice.dto.CheckoutSessionDTO;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.pm.appointmentservice.security.AccessPolicy;
import com.pm.appointmentservice.feature.FeatureFlagClient;
import com.pm.appointmentservice.repository.AppointmentRepository;
import com.pm.appointmentservice.repository.CustomerRepository;

@RestController
@RequestMapping("/appointments/{appointmentId}/payment")
public class PaymentController {
  private final PaymentService payments;
  private final StripeCheckoutService stripe;
  private final FeatureFlagClient flags;
  private final AppointmentRepository appointments;
  private final CustomerRepository customers;
  public PaymentController(PaymentService payments, StripeCheckoutService stripe, FeatureFlagClient flags,
      AppointmentRepository appointments, CustomerRepository customers) {
    this.payments = payments; this.stripe = stripe; this.flags = flags;
    this.appointments = appointments; this.customers = customers;
  }

  @GetMapping
  public ResponseEntity<AppointmentPaymentDTO> get(@PathVariable UUID appointmentId,
      @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader(value = "X-User-ID", required = false) UUID userId) {
    requirePayments(tenant);
    requirePaymentViewer(appointmentId, tenant, role, userId);
    return ResponseEntity.ok(payments.get(appointmentId, tenant));
  }

  @GetMapping("/history")
  public ResponseEntity<java.util.List<com.pm.appointmentservice.dto.PaymentHistoryDTO>> history(
      @PathVariable UUID appointmentId, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader(value = "X-User-ID", required = false) UUID userId) {
    requirePayments(tenant);
    requirePaymentViewer(appointmentId, tenant, role, userId);
    return ResponseEntity.ok(payments.history(appointmentId, tenant));
  }

  @PutMapping
  public ResponseEntity<AppointmentPaymentDTO> record(@PathVariable UUID appointmentId,
      @Valid @RequestBody PaymentRequestDTO input, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    requirePayments(tenant);
    AccessPolicy.requireBusinessUser(role);
    return ResponseEntity.ok(payments.record(appointmentId, input, tenant));
  }

  @PatchMapping("/refund")
  public ResponseEntity<AppointmentPaymentDTO> refund(@PathVariable UUID appointmentId,
      @RequestHeader("X-Tenant-ID") String tenant, @RequestHeader("X-User-Role") String role) {
    requirePayments(tenant);
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(payments.refund(appointmentId, tenant));
  }

  @PostMapping("/checkout")
  public ResponseEntity<CheckoutSessionDTO> checkout(@PathVariable UUID appointmentId,
      @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader(value = "X-User-ID", required = false) UUID userId) {
    requirePayments(tenant);
    requirePaymentViewer(appointmentId, tenant, role, userId);
    return ResponseEntity.ok(stripe.create(appointmentId, tenant));
  }

  @PostMapping("/confirm")
  public ResponseEntity<AppointmentPaymentDTO> confirm(@PathVariable UUID appointmentId,
      @RequestParam(required = false) String sessionId, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader(value = "X-User-ID", required = false) UUID userId) {
    requirePayments(tenant);
    requirePaymentViewer(appointmentId, tenant, role, userId);
    stripe.confirm(appointmentId, tenant, sessionId);
    return ResponseEntity.ok(payments.get(appointmentId, tenant));
  }

  private void requirePayments(String tenant) {
    if (!flags.enabled(tenant, "STRIPE_APPOINTMENT_PAYMENTS")) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.FORBIDDEN, "Appointment payments are disabled");
    }
  }

  private void requirePaymentViewer(UUID appointmentId, String tenant, String role, UUID userId) {
    if (!"CUSTOMER".equalsIgnoreCase(role)) {
      AccessPolicy.requireBusinessUser(role);
      return;
  }
    boolean ownsAppointment = userId != null && appointments.findByIdAndTenantId(appointmentId, tenant)
        .flatMap(appointment -> parseCustomerId(appointment.getCustomerId())
            .flatMap(customerId -> customers.findByIdAndTenantId(customerId, tenant)))
        .filter(customer -> userId.equals(customer.getCustomerAccountId()))
        .isPresent();
    if (!ownsAppointment) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.FORBIDDEN, "Customer does not own this appointment");
    }
  }

  private java.util.Optional<UUID> parseCustomerId(String value) {
      try {
        return java.util.Optional.of(UUID.fromString(value));
      } catch (IllegalArgumentException | NullPointerException error) {
        return java.util.Optional.empty();
    }
  }
}
