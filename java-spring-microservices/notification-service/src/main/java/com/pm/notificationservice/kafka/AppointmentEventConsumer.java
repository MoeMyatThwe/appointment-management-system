package com.pm.notificationservice.kafka;

import appointment.events.AppointmentEvent;
import com.google.protobuf.InvalidProtocolBufferException;
import com.pm.notificationservice.adapter.NotificationAdapter;
import com.pm.notificationservice.feature.FeatureFlagClient;
import java.util.List;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Arrays;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Service;

@Service
public class AppointmentEventConsumer {
  private static final Logger log = LoggerFactory.getLogger(AppointmentEventConsumer.class);
  private final List<NotificationAdapter> adapters;
  private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
  private final Map<String, ScheduledFuture<?>> reminders = new ConcurrentHashMap<>();
  private final long reminderMinutesBefore;
  private final FeatureFlagClient flags;
  private final ProcessedEventStore processedEvents;
  private final FailedEventStore failedEvents;
  private final NotificationDeliveryStore deliveries;

  public AppointmentEventConsumer(List<NotificationAdapter> adapters,
      @Value("${notification.reminder-minutes-before:1440}") long reminderMinutesBefore,
      FeatureFlagClient flags, ProcessedEventStore processedEvents, FailedEventStore failedEvents,
      NotificationDeliveryStore deliveries) {
    this.adapters = adapters;
    this.reminderMinutesBefore = reminderMinutesBefore;
    this.flags = flags;
    this.processedEvents = processedEvents;
    this.failedEvents = failedEvents;
    this.deliveries = deliveries;
  }

  @KafkaListener(topics = "appointment", groupId = "notification-service")
  @RetryableTopic(attempts = "4", backoff = @Backoff(delay = 1000, multiplier = 2.0),
      dltTopicSuffix = ".DLT")
  public void consume(byte[] payload) {
    try {
      AppointmentEvent event = AppointmentEvent.parseFrom(payload);
      String eventKey = event.getEventId().isBlank()
          ? "legacy-" + Integer.toHexString(Arrays.hashCode(payload)) : event.getEventId();
      if (!processedEvents.claim(eventKey)) {
        log.info("Skipping duplicate appointment event eventId={}", eventKey);
        return;
      }
      if (!flags.enabled(event.getTenantId(), "NOTIFICATIONS")) {
        log.info("Notifications disabled for tenantId={}", event.getTenantId());
        return;
      }
      if ("APPOINTMENT_CANCELLED".equals(event.getEventType())) {
        cancelReminder(event.getAppointmentId());
      } else {
        scheduleReminder(event);
      }
      dispatch(event);
    } catch (InvalidProtocolBufferException exception) {
      failedEvents.record("payload-" + Integer.toHexString(Arrays.hashCode(payload)),
          "UNKNOWN", exception);
      log.error("Unable to deserialize appointment event", exception);
      throw new IllegalStateException("Unable to deserialize appointment event", exception);
    } catch (Exception exception) {
      failedEvents.record("unknown", "APPOINTMENT", exception);
      throw new IllegalStateException("Appointment event processing failed", exception);
    }
  }

  private void scheduleReminder(AppointmentEvent event) {
    try {
      LocalDateTime startTime = LocalDateTime.parse(event.getStartTime());
      long delay = Duration.between(LocalDateTime.now(),
          startTime.minusMinutes(reminderMinutesBefore)).toMillis();
      cancelReminder(event.getAppointmentId());
      if (delay <= 0) {
        return;
      }
      ScheduledFuture<?> future = scheduler.schedule(() -> {
        AppointmentEvent reminder = event.toBuilder()
            .setEventType("APPOINTMENT_REMINDER")
            .build();
        dispatch(reminder);
      }, delay, TimeUnit.MILLISECONDS);
      reminders.put(event.getAppointmentId(), future);
    } catch (DateTimeParseException exception) {
      log.warn("Unable to schedule reminder for appointmentId={} with startTime={}",
          event.getAppointmentId(), event.getStartTime());
    }

  }

  private void dispatch(AppointmentEvent event) {
    String eventId = event.getEventId().isBlank()
        ? event.getAppointmentId() : event.getEventId();
    adapters.forEach(adapter -> {
      if (deliveries.claim(eventId, event.getEventType(), adapter.getClass().getName())) {
        adapter.send(event);
      } else {
        log.info("Skipping duplicate notification eventId={} eventType={} adapter={}",
            eventId, event.getEventType(), adapter.getClass().getSimpleName());
      }
    });
  }

  private void cancelReminder(String appointmentId) {
    ScheduledFuture<?> reminder = reminders.remove(appointmentId);
    if (reminder != null) {
      reminder.cancel(false);
    }
  }
}
