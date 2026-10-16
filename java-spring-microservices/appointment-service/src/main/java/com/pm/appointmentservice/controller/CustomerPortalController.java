package com.pm.appointmentservice.controller;

import com.pm.appointmentservice.dto.*;
import com.pm.appointmentservice.mapper.AppointmentMapper;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.model.AppointmentPayment;
import com.pm.appointmentservice.repository.AppointmentRepository;
import com.pm.appointmentservice.repository.ServiceOfferingRepository;
import com.pm.appointmentservice.repository.StaffRepository;
import com.pm.appointmentservice.security.AccessPolicy;
import com.pm.appointmentservice.service.AppointmentService;
import com.pm.appointmentservice.service.PaymentService;
import com.pm.appointmentservice.service.StripeCheckoutService;
import java.util.UUID;
import java.time.Instant;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/customer")
public class CustomerPortalController {
  private final AppointmentRepository appointments;
  private final PaymentService payments;
  private final StripeCheckoutService stripe;
  private final AppointmentService appointmentService;
  private final ServiceOfferingRepository services;
  private final StaffRepository staff;

  public CustomerPortalController(AppointmentRepository appointments, PaymentService payments,
      StripeCheckoutService stripe, AppointmentService appointmentService,
      ServiceOfferingRepository services, StaffRepository staff) {
    this.appointments = appointments;
    this.payments = payments;
    this.stripe = stripe;
    this.appointmentService = appointmentService;
    this.services = services;
    this.staff = staff;
  }

  @GetMapping("/appointments")
  public ResponseEntity<Page<CustomerPortalAppointmentDTO>> appointments(
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-ID") UUID accountId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String status,
      @RequestParam(defaultValue = "") String paymentStatus,
      @RequestParam(defaultValue = "ALL") String dateFilter) {
    AccessPolicy.requireCustomer(role);
    if (page < 0 || size < 1 || size > 100) {
      throw new IllegalArgumentException("page must be >= 0 and size must be between 1 and 100");
    }
    if (!Set.of("", "PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW").contains(status)) {
      throw new IllegalArgumentException("Unsupported appointment status filter");
    }
    if (!Set.of("", "UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED").contains(paymentStatus)) {
      throw new IllegalArgumentException("Unsupported payment status filter");
    }
    if (!Set.of("ALL", "UPCOMING", "PAST").contains(dateFilter)) {
      throw new IllegalArgumentException("Unsupported date filter");
    }
    return ResponseEntity.ok(appointments.searchCustomer(accountId, search.trim(), status, paymentStatus,
        dateFilter, Instant.now().toString(), PageRequest.of(page, size))
        .map(this::toDTO));
  }

  @GetMapping("/appointments/{appointmentId}/payment")
  public ResponseEntity<AppointmentPaymentDTO> payment(@PathVariable UUID appointmentId,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-ID") UUID accountId) {
    AccessPolicy.requireCustomer(role);
    Appointment appointment = ownedAppointment(appointmentId, accountId);
    return ResponseEntity.ok(payments.get(appointmentId, appointment.getTenantId()));
  }

  @PostMapping("/appointments/{appointmentId}/payment/checkout")
  public ResponseEntity<CheckoutSessionDTO> checkout(@PathVariable UUID appointmentId,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-ID") UUID accountId) {
    AccessPolicy.requireCustomer(role);
    Appointment appointment = ownedAppointment(appointmentId, accountId);
    return ResponseEntity.ok(stripe.create(appointmentId, appointment.getTenantId()));
  }

  @PostMapping("/appointments/{appointmentId}/payment/confirm")
  public ResponseEntity<AppointmentPaymentDTO> confirm(@PathVariable UUID appointmentId,
      @RequestParam(required = false) String sessionId,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-ID") UUID accountId) {
    AccessPolicy.requireCustomer(role);
    Appointment appointment = ownedAppointment(appointmentId, accountId);
    stripe.confirm(appointmentId, appointment.getTenantId(), sessionId);
    return ResponseEntity.ok(payments.get(appointmentId, appointment.getTenantId()));
  }

  @PostMapping("/appointments/{appointmentId}/cancel")
  public ResponseEntity<AppointmentResponseDTO> cancel(@PathVariable UUID appointmentId,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-ID") UUID accountId) {
    AccessPolicy.requireCustomer(role);
    Appointment appointment = ownedAppointment(appointmentId, accountId);
    payments.refundForCancellation(appointmentId, appointment.getTenantId());
    return ResponseEntity.ok(appointmentService.changeStatus(appointmentId,
        new AppointmentStatusChangeDTO("CANCELLED", "Cancelled by customer"),
        appointment.getTenantId(), "customer-portal"));
  }

  private Appointment ownedAppointment(UUID appointmentId, UUID accountId) {
    return appointments.findByIdAndCustomerAccountId(appointmentId, accountId)
        .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_FOUND, "Appointment not found"));
  }

  private CustomerPortalAppointmentDTO toDTO(Appointment appointment) {
    AppointmentPayment payment = payments.findEntity(appointment.getId(), appointment.getTenantId());
    return new CustomerPortalAppointmentDTO(
        appointment.getId().toString(), appointment.getTenantId(), appointment.getServiceId(),
        services.findById(UUID.fromString(appointment.getServiceId()))
            .filter(service -> appointment.getTenantId().equals(service.getTenantId()))
            .map(service -> service.getName()).orElse("Service unavailable"),
        appointment.getStaffId(),
        staff.findById(UUID.fromString(appointment.getStaffId()))
            .filter(member -> appointment.getTenantId().equals(member.getTenantId()))
            .map(member -> member.getName()).orElse("Staff member unavailable"),
        appointment.getStartTime(), appointment.getEndTime(),
        appointment.getStatus(), appointment.getNotes(),
        payment == null ? "UNPAID" : payment.getStatus(),
        payment == null ? null : payment.getAmountDue(),
        payment == null ? null : payment.getAmountPaid(),
        payment == null ? null : payment.getAmountDue().subtract(payment.getAmountPaid()).max(java.math.BigDecimal.ZERO),
        payment == null ? "NOT_REFUNDED" : payment.getRefundStatus());
  }
}
