package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.AppointmentPaymentDTO;
import com.pm.appointmentservice.dto.PaymentRequestDTO;
import com.pm.appointmentservice.dto.PaymentHistoryDTO;
import com.pm.appointmentservice.model.AppointmentPayment;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.model.PaymentHistory;
import com.pm.appointmentservice.repository.AppointmentPaymentRepository;
import com.pm.appointmentservice.repository.AppointmentRepository;
import com.pm.appointmentservice.repository.PaymentHistoryRepository;
import com.pm.appointmentservice.repository.ServiceOfferingRepository;
import com.pm.appointmentservice.repository.BookingPaymentPolicyRepository;
import com.pm.appointmentservice.model.BookingPaymentPolicy;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
  private final AppointmentPaymentRepository payments;
  private final AppointmentRepository appointments;
  private final ServiceOfferingRepository services;
  private final PaymentHistoryRepository history;
  private final BookingPaymentPolicyRepository policies;
  private final StripeCheckoutService stripe;

  public PaymentService(AppointmentPaymentRepository payments, AppointmentRepository appointments,
  ServiceOfferingRepository services, PaymentHistoryRepository history,
  BookingPaymentPolicyRepository policies, StripeCheckoutService stripe) {
    this.payments = payments; this.appointments = appointments; this.services = services;
    this.history = history; this.policies = policies; this.stripe = stripe;
  }

  @Transactional
  public AppointmentPaymentDTO get(UUID appointmentId, String tenant) {
    return payments.findByAppointmentIdAndTenantId(appointmentId, tenant)
        .map(this::toDTO)
        .orElseGet(() -> {
          Appointment appointment = appointments.findByIdAndTenantId(appointmentId, tenant)
              .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
          return toDTO(payments.save(newPayment(appointmentId, tenant, appointment)));
        });
  }

  public AppointmentPayment findEntity(UUID appointmentId, String tenant) {
    return payments.findByAppointmentIdAndTenantId(appointmentId, tenant).orElse(null);
  }

  @Transactional
  public AppointmentPaymentDTO record(UUID appointmentId, PaymentRequestDTO input, String tenant) {
    Appointment appointment = appointments.findByIdAndTenantIdForUpdate(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
    AppointmentPayment payment = payments.findByAppointmentIdAndTenantIdForUpdate(appointmentId, tenant)
        .orElseGet(() -> newPayment(appointmentId, tenant, appointment));
    BigDecimal amount = input.amountPaid() == null ? BigDecimal.ZERO : input.amountPaid();
    if (amount.signum() <= 0) {
      throw new IllegalArgumentException("Payment amount must be greater than zero");
    }
    if (input.currency() != null && !input.currency().isBlank()
        && !payment.getCurrency().equalsIgnoreCase(input.currency())) {
      throw new IllegalArgumentException("Payment currency cannot be changed");
    }
    BigDecimal newAmountPaid = payment.getAmountPaid().add(amount);
    if (newAmountPaid.compareTo(payment.getAmountDue()) > 0) {
      throw new IllegalArgumentException("Payment cannot exceed the remaining appointment balance");
    }
    payment.setAmountPaid(newAmountPaid);
    payment.setPaymentMethod(input.paymentMethod().trim().toUpperCase());
    payment.setStatus(newAmountPaid.compareTo(payment.getAmountDue()) >= 0 ? "PAID" : "PARTIALLY_PAID");
    payment.setUpdatedAt(OffsetDateTime.now().toString());
    AppointmentPayment saved = payments.save(payment);
    if (amount.signum() > 0) saveHistory(appointmentId, tenant, amount, "PAYMENT",
        payment.getPaymentMethod(), payment.getStatus());
    return toDTO(saved);
  }

  @Transactional
  public AppointmentPaymentDTO refund(UUID appointmentId, String tenant) {
    return refundAmount(appointmentId, tenant, null, "MANUAL_REFUND");
  }

  @Transactional
  public AppointmentPaymentDTO refundForCancellation(UUID appointmentId, String tenant) {
    Appointment appointment = appointments.findByIdAndTenantId(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
    AppointmentPayment payment = payments.findByAppointmentIdAndTenantId(appointmentId, tenant)
        .orElse(null);
    if (payment == null || payment.getAmountPaid().compareTo(payment.getAmountRefunded()) <= 0) {
      return payment == null ? null : toDTO(payment);
    }
    BookingPaymentPolicy policy = policy(tenant);
    BigDecimal refundable = payment.getAmountPaid().subtract(payment.getAmountRefunded());
    Instant start = Instant.parse(appointment.getStartTime());
    if (start.isBefore(Instant.now().plusSeconds(policy.getCancellationWindowMinutes() * 60L))) {
      refundable = refundable.multiply(policy.getRefundablePercent())
          .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.DOWN);
    }
    return refundable.signum() <= 0 ? toDTO(payment) : refundAmount(
        appointmentId, tenant, refundable, "CANCELLATION_REFUND");
  }

  @Transactional
  public AppointmentPaymentDTO refundAmount(UUID appointmentId, String tenant,
      BigDecimal requestedAmount, String reason) {
    AppointmentPayment payment = payments.findByAppointmentIdAndTenantIdForUpdate(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
    BigDecimal refundable = payment.getAmountPaid().subtract(payment.getAmountRefunded());
    if (refundable.signum() <= 0) {
      throw new IllegalArgumentException("This appointment has no refundable payment");
    }
    BigDecimal refundedAmount = requestedAmount == null ? refundable
        : requestedAmount.min(refundable);
    if (refundedAmount.signum() <= 0) {
      throw new IllegalArgumentException("Refund amount must be greater than zero");
    }
    if (payment.getStripePaymentIntentId() != null && !payment.getStripePaymentIntentId().isBlank()) {
      stripe.refundPayment(payment.getStripePaymentIntentId(), refundedAmount, payment.getCurrency());
    }
    BigDecimal totalRefunded = payment.getAmountRefunded().add(refundedAmount);
    payment.setAmountRefunded(totalRefunded);
    payment.setRefundStatus(totalRefunded.compareTo(payment.getAmountPaid()) >= 0
        ? "REFUNDED" : "PARTIALLY_REFUNDED");
    payment.setStatus(totalRefunded.compareTo(payment.getAmountPaid()) >= 0
        ? "REFUNDED" : "PARTIALLY_PAID");
    payment.setUpdatedAt(OffsetDateTime.now().toString());
    AppointmentPayment saved = payments.save(payment);
    saveHistory(appointmentId, tenant, refundedAmount, reason,
        payment.getPaymentMethod(), payment.getStatus());
    return toDTO(saved);
  }

  @Transactional
  public AppointmentPayment initializeForBooking(UUID appointmentId, String tenant) {
    Appointment appointment = appointments.findByIdAndTenantIdForUpdate(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
    AppointmentPayment payment = payments.findByAppointmentIdAndTenantIdForUpdate(appointmentId, tenant)
        .orElseGet(() -> newPayment(appointmentId, tenant, appointment));
    BookingPaymentPolicy policy = policy(tenant);
    BigDecimal due = payment.getAmountDue();
    BigDecimal required = switch (policy.getPaymentMode()) {
      case "FULL" -> due;
      case "DEPOSIT" -> due.multiply(policy.getDepositPercent())
          .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
      default -> BigDecimal.ZERO;
    };
    payment.setCurrency(policy.getCurrency().toUpperCase());
    payment.setPaymentMode(policy.getPaymentMode());
    payment.setAmountRequired(required);
    boolean paymentRequired = !"PAY_LATER".equals(policy.getPaymentMode());
    appointment.setPaymentRequired(paymentRequired);
    if (paymentRequired) {
      java.time.OffsetDateTime deadline = java.time.OffsetDateTime.now().plusMinutes(30);
      appointment.setPaymentDeadline(deadline);
      appointment.setBookingHoldExpiresAt(deadline);
    }
    appointments.save(appointment);
    return payments.save(payment);
  }

  public BookingPaymentPolicy policy(String tenant) {
    return policies.findByTenantId(tenant).orElseGet(() -> {
      BookingPaymentPolicy policy = new BookingPaymentPolicy();
      policy.setTenantId(tenant);
      return policies.save(policy);
    });
  }

  @Transactional
  public BookingPaymentPolicy updatePolicy(String tenant, com.pm.appointmentservice.dto.BookingPaymentPolicyDTO input) {
    String mode = input.paymentMode().trim().toUpperCase();
    BigDecimal depositPercent = input.depositPercent() == null
        ? BigDecimal.ZERO : input.depositPercent();
    BigDecimal refundablePercent = input.refundablePercent() == null
        ? BigDecimal.valueOf(100) : input.refundablePercent();
    if (!java.util.Set.of("PAY_LATER", "DEPOSIT", "FULL").contains(mode)) {
      throw new IllegalArgumentException("Payment mode must be PAY_LATER, DEPOSIT, or FULL");
    }
    if ("DEPOSIT".equals(mode) && depositPercent.signum() <= 0) {
      throw new IllegalArgumentException("Deposit mode requires a positive deposit percentage");
    }
    BookingPaymentPolicy policy = policy(tenant);
    policy.setPaymentMode(mode);
    policy.setDepositPercent(depositPercent);
    policy.setCancellationWindowMinutes(input.cancellationWindowMinutes());
    policy.setRefundablePercent(refundablePercent);
    policy.setCurrency(input.currency().trim().toUpperCase());
    return policies.save(policy);
  }

  public java.util.List<PaymentHistoryDTO> history(UUID appointmentId, String tenant) {
    return history.findAllByAppointmentIdAndTenantIdOrderByCreatedAtDesc(appointmentId, tenant)
        .stream().map(item -> new PaymentHistoryDTO(item.getId().toString(),
            item.getAppointmentId().toString(), item.getAmount(), item.getType(),
            item.getPaymentMethod(), item.getStatus(), item.getCreatedAt())).toList();
  }

  private void saveHistory(UUID appointmentId, String tenant, BigDecimal amount, String type,
      String method, String status) {
    PaymentHistory item = new PaymentHistory();
    item.setTenantId(tenant);
    item.setAppointmentId(appointmentId);
    item.setAmount(amount);
    item.setType(type);
    item.setPaymentMethod(method);
    item.setStatus(status);
    item.setCreatedAt(OffsetDateTime.now().toString());
    history.save(item);
  }

  private AppointmentPayment newPayment(UUID appointmentId, String tenant, Appointment appointment) {
    AppointmentPayment payment = new AppointmentPayment();
    payment.setTenantId(tenant); payment.setAppointmentId(appointmentId);
    BigDecimal due = BigDecimal.ZERO;
    if (appointment != null) {
      try {
        due = services.findById(UUID.fromString(appointment.getServiceId()))
            .map(service -> parsePrice(service.getPrice())).orElse(BigDecimal.ZERO);
      } catch (IllegalArgumentException ignored) {
        due = BigDecimal.ZERO;
      }
    }
    payment.setAmountDue(due); payment.setReceiptNumber("RCT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    payment.setAmountRequired(BigDecimal.ZERO);
    String now = OffsetDateTime.now().toString(); payment.setCreatedAt(now); payment.setUpdatedAt(now);
    return payment;
  }

  private BigDecimal parsePrice(String value) {
    try { return value == null || value.isBlank() ? BigDecimal.ZERO : new BigDecimal(value); }
    catch (NumberFormatException exception) { return BigDecimal.ZERO; }
  }

  private AppointmentPaymentDTO toDTO(AppointmentPayment payment) {
    return new AppointmentPaymentDTO(payment.getId() == null ? null : payment.getId().toString(),
        payment.getAppointmentId().toString(), payment.getAmountDue(), payment.getAmountPaid(),
        payment.getAmountDue().subtract(payment.getAmountPaid()).max(BigDecimal.ZERO),
        payment.getCurrency(), payment.getPaymentMethod(), payment.getStatus(),
        payment.getReceiptNumber(), payment.getUpdatedAt(), payment.getAmountRequired(),
        payment.getAmountRefunded(), payment.getRefundStatus(), payment.getPaymentMode());
  }
}
