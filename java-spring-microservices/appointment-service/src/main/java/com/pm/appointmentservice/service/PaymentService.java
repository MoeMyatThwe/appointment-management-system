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
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
  private final AppointmentPaymentRepository payments;
  private final AppointmentRepository appointments;
  private final ServiceOfferingRepository services;
  private final PaymentHistoryRepository history;

  public PaymentService(AppointmentPaymentRepository payments, AppointmentRepository appointments,
  ServiceOfferingRepository services, PaymentHistoryRepository history) {
    this.payments = payments; this.appointments = appointments; this.services = services;
    this.history = history;
  }

  public AppointmentPaymentDTO get(UUID appointmentId, String tenant) {
    return payments.findByAppointmentIdAndTenantId(appointmentId, tenant)
        .map(this::toDTO)
        .orElseGet(() -> toDTO(newPayment(appointmentId, tenant,
            appointments.findByIdAndTenantId(appointmentId, tenant)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found")))));
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
    AppointmentPayment payment = payments.findByAppointmentIdAndTenantIdForUpdate(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
    if (payment.getAmountPaid().signum() <= 0 || "REFUNDED".equals(payment.getStatus())) {
      throw new IllegalArgumentException("This appointment has no refundable payment");
    }
    BigDecimal refundedAmount = payment.getAmountPaid();
    payment.setAmountPaid(BigDecimal.ZERO); payment.setStatus("REFUNDED");
    payment.setUpdatedAt(OffsetDateTime.now().toString());
    AppointmentPayment saved = payments.save(payment);
    saveHistory(appointmentId, tenant, refundedAmount, "REFUND",
        payment.getPaymentMethod(), payment.getStatus());
    return toDTO(saved);
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
        payment.getReceiptNumber(), payment.getUpdatedAt());
  }
}
