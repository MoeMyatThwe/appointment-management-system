package com.pm.appointmentservice.kafka;
import com.pm.appointmentservice.model.Appointment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import appointment.events.AppointmentEvent;
import java.util.concurrent.TimeUnit;
import java.util.UUID;
import com.pm.appointmentservice.model.Customer;
import com.pm.appointmentservice.repository.CustomerRepository;

@Service
public class KafkaProducer {

  private static final Logger log = LoggerFactory.getLogger(
      KafkaProducer.class);
  private final KafkaTemplate<String, byte[]> kafkaTemplate;
  private final CustomerRepository customers;

  public KafkaProducer(KafkaTemplate<String, byte[]> kafkaTemplate, CustomerRepository customers) {
    this.kafkaTemplate = kafkaTemplate;
    this.customers = customers;
  }

  public void sendEvent(Appointment appointment) {
    sendEvent(appointment, "APPOINTMENT_CREATED");
  }

  public void sendEvent(Appointment appointment, String eventType) {
    Customer customer = findCustomer(appointment);
    AppointmentEvent event = AppointmentEvent.newBuilder()
        .setAppointmentId(appointment.getId().toString())
        .setName(customer == null ? "" : customer.getName())
        .setEmail(customer == null ? "" : customer.getEmail())
        .setEventType(eventType)
        .setTenantId(appointment.getTenantId())
        .setCustomerId(appointment.getCustomerId())
        .setBusinessId(appointment.getBusinessId())
        .setStaffId(appointment.getStaffId())
        .setServiceId(appointment.getServiceId())
        .setCalendarId(appointment.getCalendarId())
        .setStartTime(appointment.getStartTime())
        .setEndTime(appointment.getEndTime())
        .setStatus(appointment.getStatus())
        .setNotes(appointment.getNotes() == null ? "" : appointment.getNotes())
        .build();

    Exception lastFailure = null;
    for (int attempt = 1; attempt <= 3; attempt++) {
      try {
        kafkaTemplate.send("appointment", event.toByteArray()).get(3, TimeUnit.SECONDS);
        log.info("Published appointment event for appointmentId={} attempt={}",
            appointment.getId(), attempt);
        return;
      } catch (Exception exception) {
        lastFailure = exception;
        log.warn("Appointment event publish attempt {} failed for appointmentId={}",
            attempt, appointment.getId(), exception);
        if (exception instanceof InterruptedException) {
          Thread.currentThread().interrupt();
          break;
        }
      }
    }
    throw new IllegalStateException(
        "Unable to publish appointment event after retries", lastFailure);
  }

  private Customer findCustomer(Appointment appointment) {
    try {
      return customers.findByIdAndTenantId(UUID.fromString(appointment.getCustomerId()),
          appointment.getTenantId()).orElse(null);
    } catch (IllegalArgumentException exception) {
      return null;
    }
  }
}
