package com.pm.notificationservice.kafka;

import appointment.events.AppointmentEvent;
import com.google.protobuf.InvalidProtocolBufferException;
import com.pm.notificationservice.adapter.NotificationAdapter;
import com.pm.notificationservice.feature.FeatureFlagClient;
import com.pm.notificationservice.model.NotificationReminder;
import com.pm.notificationservice.repository.NotificationReminderRepository;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.retry.annotation.Backoff;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class AppointmentEventConsumer {
  private static final Logger log = LoggerFactory.getLogger(AppointmentEventConsumer.class);
  private final List<NotificationAdapter> adapters;
  private final long reminderMinutesBefore;
  private final FeatureFlagClient flags;
  private final ProcessedEventStore processedEvents;
  private final FailedEventStore failedEvents;
  private final NotificationDeliveryStore deliveries;
  private final NotificationReminderRepository reminders;

  public AppointmentEventConsumer(List<NotificationAdapter> adapters,
      @Value("${notification.reminder-minutes-before:1440}") long reminderMinutesBefore,
      FeatureFlagClient flags, ProcessedEventStore processedEvents, FailedEventStore failedEvents,
      NotificationDeliveryStore deliveries, NotificationReminderRepository reminders) {
    this.adapters = adapters;
    this.reminderMinutesBefore = reminderMinutesBefore;
    this.flags = flags;
    this.processedEvents = processedEvents;
    this.failedEvents = failedEvents;
    this.deliveries = deliveries;
    this.reminders = reminders;
  }

  @KafkaListener(topics = "appointment", groupId = "notification-service")
  @RetryableTopic(attempts = "4", backoff = @Backoff(delay = 1000, multiplier = 2.0),
      dltTopicSuffix = ".DLT")
  public void consume(byte[] payload) {
    String eventKey = null;
    try {
      AppointmentEvent event = AppointmentEvent.parseFrom(payload);
      eventKey = event.getEventId().isBlank()
          ? "legacy-" + Integer.toHexString(Arrays.hashCode(payload)) : event.getEventId();
      if (!processedEvents.claim(eventKey)) {
        log.info("Skipping duplicate appointment event eventId={}", eventKey);
        return;
      }
      if (!flags.enabled(event.getTenantId(), "NOTIFICATIONS")) {
        log.info("Notifications disabled for tenantId={}", event.getTenantId());
        processedEvents.complete(eventKey);
        return;
      }
      if ("APPOINTMENT_CANCELLED".equals(event.getEventType())) {
        cancelReminder(event.getAppointmentId());
      } else {
        scheduleReminder(event);
      }
      dispatch(event);
      processedEvents.complete(eventKey);
    } catch (InvalidProtocolBufferException exception) {
      failedEvents.record("payload-" + Integer.toHexString(Arrays.hashCode(payload)),
          "UNKNOWN", exception);
      log.error("Unable to deserialize appointment event", exception);
      throw new IllegalStateException("Unable to deserialize appointment event", exception);
    } catch (Exception exception) {
      if (eventKey != null) processedEvents.release(eventKey);
      failedEvents.record("unknown", "APPOINTMENT", exception);
      throw new IllegalStateException("Appointment event processing failed", exception);
    }
  }

  private void scheduleReminder(AppointmentEvent event) {
    try {
      Instant startTime = Instant.parse(event.getStartTime());
      Instant scheduledAt = startTime.minus(Duration.ofMinutes(reminderMinutesBefore));
      if (!scheduledAt.isAfter(Instant.now())) {
        cancelReminder(event.getAppointmentId());
        return;
      }
      NotificationReminder reminder = reminders.findByAppointmentId(event.getAppointmentId())
          .orElseGet(NotificationReminder::new);
      reminder.setAppointmentId(event.getAppointmentId());
      reminder.setEventId(event.getEventId());
      reminder.setPayload(event.toByteArray());
      reminder.setScheduledAt(scheduledAt);
      reminder.setStatus("PENDING");
      reminder.setClaimedUntil(null);
      reminder.setSentAt(null);
      if (reminder.getCreatedAt() == null) reminder.setCreatedAt(Instant.now());
      reminders.save(reminder);
    } catch (DateTimeParseException exception) {
      log.warn("Unable to schedule reminder for appointmentId={} with startTime={}",
          event.getAppointmentId(), event.getStartTime());
    }
  }

  @Scheduled(fixedDelayString = "${notification.reminder-poll-ms:30000}")
  public void dispatchDueReminders() {
    Instant now = Instant.now();
    reminders.findDue(now, PageRequest.of(0, 50)).forEach(reminder -> {
      Instant lease = now.plus(Duration.ofMinutes(5));
      if (reminder.getId() == null || reminders.claim(reminder.getId(), now, lease) != 1) {
        return;
      }
      try {
        AppointmentEvent event = AppointmentEvent.parseFrom(reminder.getPayload()).toBuilder()
            .setEventType("APPOINTMENT_REMINDER")
            .build();
        dispatch(event);
        reminder.setStatus("SENT");
        reminder.setSentAt(Instant.now());
        reminder.setClaimedUntil(null);
        reminders.save(reminder);
      } catch (InvalidProtocolBufferException | RuntimeException exception) {
        reminder.setStatus("PENDING");
        reminder.setAttempts(reminder.getAttempts() + 1);
        reminder.setClaimedUntil(null);
        reminders.save(reminder);
        log.error("Unable to dispatch reminder for appointmentId={}",
            reminder.getAppointmentId(), exception);
      }
    });
  }

  private void dispatch(AppointmentEvent event) {
    String eventId = event.getEventId().isBlank()
        ? event.getAppointmentId() : event.getEventId();
    adapters.forEach(adapter -> {
      String adapterName = adapter.getClass().getName();
      if (deliveries.claim(eventId, event.getEventType(), adapterName)) {
        try {
          adapter.send(event);
          deliveries.complete(eventId, event.getEventType(), adapterName);
        } catch (RuntimeException exception) {
          deliveries.release(eventId, event.getEventType(), adapterName);
          throw exception;
        }
      } else {
        log.info("Skipping duplicate notification eventId={} eventType={} adapter={}",
            eventId, event.getEventType(), adapter.getClass().getSimpleName());
      }
    });
  }

  private void cancelReminder(String appointmentId) {
    reminders.findByAppointmentId(appointmentId).ifPresent(reminder -> {
      reminder.setStatus("CANCELLED");
      reminder.setClaimedUntil(null);
      reminders.save(reminder);
    });
  }
}
