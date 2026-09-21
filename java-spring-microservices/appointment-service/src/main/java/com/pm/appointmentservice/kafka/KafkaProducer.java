package com.pm.appointmentservice.kafka;
import com.pm.appointmentservice.model.Appointment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import appointment.events.AppointmentEvent;
import java.util.concurrent.TimeUnit;
import java.util.UUID;
import java.time.Instant;
import com.pm.appointmentservice.model.Customer;
import com.pm.appointmentservice.repository.CustomerRepository;
import com.pm.appointmentservice.repository.AppointmentEventOutboxRepository;
import com.pm.appointmentservice.model.AppointmentEventOutbox;
import java.time.OffsetDateTime;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;

@Service
public class KafkaProducer {

  private static final Logger log = LoggerFactory.getLogger(
      KafkaProducer.class);
  private final KafkaTemplate<String, byte[]> kafkaTemplate;
  private final CustomerRepository customers;
  private final AppointmentEventOutboxRepository outbox;
  private final MeterRegistry meterRegistry;
  private final int maxPublishAttempts;
  private final int retentionDays;

  public KafkaProducer(KafkaTemplate<String, byte[]> kafkaTemplate, CustomerRepository customers,
      AppointmentEventOutboxRepository outbox, MeterRegistry meterRegistry,
      @org.springframework.beans.factory.annotation.Value("${appointment.event-outbox-max-attempts:10}")
      int maxPublishAttempts,
      @org.springframework.beans.factory.annotation.Value("${appointment.event-outbox-retention-days:7}")
      int retentionDays) {
    this.kafkaTemplate = kafkaTemplate;
    this.customers = customers;
    this.outbox = outbox;
    this.meterRegistry = meterRegistry;
    this.maxPublishAttempts = maxPublishAttempts;
    this.retentionDays = retentionDays;
  }

  public void sendEvent(Appointment appointment) {
    sendEvent(appointment, "APPOINTMENT_CREATED");
  }

  @Transactional
  public void sendEvent(Appointment appointment, String eventType) {
    Customer customer = findCustomer(appointment);
    String eventId = UUID.randomUUID().toString();
    AppointmentEvent event = AppointmentEvent.newBuilder()
        .setAppointmentId(appointment.getId().toString())
        .setName(customer == null ? "" : customer.getName())
        .setEmail(customer == null ? "" : customer.getEmail())
        .setPhone(customer == null || customer.getPhone() == null ? "" : customer.getPhone())
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
        .setEventId(eventId)
        .setEventTimestamp(Instant.now().toString())
        .setEventVersion(1)
        .setCorrelationId(appointment.getId().toString())
        .build();

    AppointmentEventOutbox message = new AppointmentEventOutbox();
    message.setAggregateId(appointment.getId().toString());
    message.setEventType(eventType);
    message.setPayload(event.toByteArray());
    message.setCreatedAt(OffsetDateTime.now().toString());
    outbox.save(message);
    log.info("Queued appointment event eventId={} appointmentId={}", eventId, appointment.getId());
  }

  @Scheduled(fixedDelayString = "${appointment.event-outbox-poll-ms:1000}")
  @Transactional
  public void publishPendingEvents() {
    for (AppointmentEventOutbox message : outbox.findTop50ByStatusOrderByCreatedAtAsc("PENDING")) {
      try {
        kafkaTemplate.send("appointment", message.getAggregateId(), message.getPayload())
            .get(3, TimeUnit.SECONDS);
        message.setStatus("PUBLISHED");
        message.setPublishedAt(OffsetDateTime.now().toString());
        outbox.save(message);
        meterRegistry.counter("appointment.outbox.published").increment();
      } catch (Exception exception) {
        message.setAttempts(message.getAttempts() + 1);
        message.setLastError(exception.getMessage());
        if (message.getAttempts() >= maxPublishAttempts) {
          message.setStatus("FAILED");
          meterRegistry.counter("appointment.outbox.failed").increment();
        } else {
          meterRegistry.counter("appointment.outbox.retried").increment();
        }
        outbox.save(message);
        log.warn("Appointment event publish failed outboxId={} attempt={}",
            message.getId(), message.getAttempts(), exception);
        if (exception instanceof InterruptedException) Thread.currentThread().interrupt();
      }
    }
  }

  @Scheduled(cron = "${appointment.event-outbox-cleanup-cron:0 0 * * * *}")
  @Transactional
  public void removePublishedEvents() {
    String cutoff = OffsetDateTime.now().minus(Duration.ofDays(retentionDays)).toString();
    int deleted = outbox.deleteByStatusAndPublishedAtBefore("PUBLISHED", cutoff);
    if (deleted > 0) {
      log.info("Removed published appointment outbox records count={}", deleted);
    }
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
