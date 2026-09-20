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

@RestController
@RequestMapping("/appointments/{appointmentId}/payment")
public class PaymentController {
  private final PaymentService payments;
  private final StripeCheckoutService stripe;
  private final FeatureFlagClient flags;
  public PaymentController(PaymentService payments, StripeCheckoutService stripe, FeatureFlagClient flags) {
    this.payments = payments; this.stripe = stripe; this.flags = flags;
  }

  @GetMapping
  public ResponseEntity<AppointmentPaymentDTO> get(@PathVariable UUID appointmentId,
      @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    requirePayments(tenant);
    AccessPolicy.requireBusinessUser(role);
    return ResponseEntity.ok(payments.get(appointmentId, tenant));
  }

  @GetMapping("/history")
  public ResponseEntity<java.util.List<com.pm.appointmentservice.dto.PaymentHistoryDTO>> history(
      @PathVariable UUID appointmentId, @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    requirePayments(tenant);
    AccessPolicy.requireBusinessUser(role);
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
      @RequestHeader("X-User-Role") String role) {
    requirePayments(tenant);
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(stripe.create(appointmentId, tenant));
  }

  private void requirePayments(String tenant) {
    if (!flags.enabled(tenant, "STRIPE_APPOINTMENT_PAYMENTS")) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.FORBIDDEN, "Appointment payments are disabled");
    }
  }
}
