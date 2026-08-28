package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.AppointmentPaymentDTO;
import com.pm.appointmentservice.dto.PaymentRequestDTO;
import com.pm.appointmentservice.model.AppointmentPayment;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.repository.AppointmentPaymentRepository;
import com.pm.appointmentservice.repository.AppointmentRepository;
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

  public PaymentService(AppointmentPaymentRepository payments, AppointmentRepository appointments,
      ServiceOfferingRepository services) {
    this.payments = payments; this.appointments = appointments; this.services = services;
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
    Appointment appointment = appointments.findByIdAndTenantId(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
    AppointmentPayment payment = payments.findByAppointmentIdAndTenantId(appointmentId, tenant)
        .orElseGet(() -> newPayment(appointmentId, tenant, appointment));
    BigDecimal amount = input.amountPaid() == null ? BigDecimal.ZERO : input.amountPaid();
    if (amount.compareTo(payment.getAmountDue()) > 0) {
      throw new IllegalArgumentException("Payment cannot exceed the appointment total");
    }
    payment.setAmountPaid(amount);
    payment.setPaymentMethod(input.paymentMethod());
    if (input.currency() != null && !input.currency().isBlank()) payment.setCurrency(input.currency().toUpperCase());
    payment.setStatus(amount.signum() == 0 ? "UNPAID"
        : amount.compareTo(payment.getAmountDue()) >= 0 ? "PAID" : "PARTIALLY_PAID");
    payment.setUpdatedAt(OffsetDateTime.now().toString());
    return toDTO(payments.save(payment));
  }

  @Transactional
  public AppointmentPaymentDTO refund(UUID appointmentId, String tenant) {
    AppointmentPayment payment = payments.findByAppointmentIdAndTenantId(appointmentId, tenant)
        .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
    payment.setAmountPaid(BigDecimal.ZERO); payment.setStatus("REFUNDED");
    payment.setUpdatedAt(OffsetDateTime.now().toString());
    return toDTO(payments.save(payment));
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
