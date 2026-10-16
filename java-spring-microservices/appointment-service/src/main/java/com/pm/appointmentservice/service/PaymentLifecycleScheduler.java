package com.pm.appointmentservice.service;

import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.repository.AppointmentRepository;
import java.time.OffsetDateTime;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PaymentLifecycleScheduler {
  private final AppointmentRepository appointments;
  private final AppointmentService appointmentService;

  public PaymentLifecycleScheduler(AppointmentRepository appointments,
      AppointmentService appointmentService) {
    this.appointments = appointments;
    this.appointmentService = appointmentService;
  }

  @Scheduled(fixedDelayString = "${appointment.payment-expiration-poll-ms:60000}")
  @Transactional
  public void expireUnpaidBookings() {
    for (Appointment appointment : appointments.findExpiredPaymentHolds(OffsetDateTime.now())) {
      appointmentService.changeStatus(appointment.getId(),
          new com.pm.appointmentservice.dto.AppointmentStatusChangeDTO(
              "CANCELLED", "Payment deadline expired"),
          appointment.getTenantId(), "payment-lifecycle");
    }
  }
}
