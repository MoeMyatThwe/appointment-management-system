package com.pm.appointmentservice.controller;

import com.pm.appointmentservice.dto.BookingPaymentPolicyDTO;
import com.pm.appointmentservice.model.BookingPaymentPolicy;
import com.pm.appointmentservice.security.AccessPolicy;
import com.pm.appointmentservice.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/appointments/payment-policy")
public class BookingPaymentPolicyController {
  private final PaymentService payments;

  public BookingPaymentPolicyController(PaymentService payments) {
    this.payments = payments;
  }

  @GetMapping
  public ResponseEntity<BookingPaymentPolicyDTO> get(
      @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireBusinessUser(role);
    return ResponseEntity.ok(toDTO(payments.policy(tenant)));
  }

  @PutMapping
  public ResponseEntity<BookingPaymentPolicyDTO> update(
      @Valid @RequestBody BookingPaymentPolicyDTO input,
      @RequestHeader("X-Tenant-ID") String tenant,
      @RequestHeader("X-User-Role") String role) {
    AccessPolicy.requireManager(role);
    return ResponseEntity.ok(toDTO(payments.updatePolicy(tenant, input)));
  }

  private BookingPaymentPolicyDTO toDTO(BookingPaymentPolicy policy) {
    return new BookingPaymentPolicyDTO(policy.getPaymentMode(), policy.getDepositPercent(),
        policy.getCancellationWindowMinutes(), policy.getRefundablePercent(), policy.getCurrency());
  }
}
