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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class AppointmentEventConsumer {
  private static final Logger log = LoggerFactory.getLogger(AppointmentEventConsumer.class);
  private final List<NotificationAdapter> adapters;
  private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
  private final Map<String, ScheduledFuture<?>> reminders = new ConcurrentHashMap<>();
  private final long reminderMinutesBefore;
  private final FeatureFlagClient flags;

  public AppointmentEventConsumer(List<NotificationAdapter> adapters,
      @Value("${notification.reminder-minutes-before:1440}") long reminderMinutesBefore,
      FeatureFlagClient flags) {
    this.adapters = adapters;
    this.reminderMinutesBefore = reminderMinutesBefore;
    this.flags = flags;
  }

  @KafkaListener(topics = "appointment", groupId = "notification-service")
  public void consume(byte[] payload) {
    try {
      AppointmentEvent event = AppointmentEvent.parseFrom(payload);
      if (!flags.enabled(event.getTenantId(), "NOTIFICATIONS")) {
        log.info("Notifications disabled for tenantId={}", event.getTenantId());
        return;
      }
      if ("APPOINTMENT_CANCELLED".equals(event.getEventType())) {
        cancelReminder(event.getAppointmentId());
      } else {
        scheduleReminder(event);
      }
      adapters.forEach(adapter -> adapter.send(event));
    } catch (InvalidProtocolBufferException exception) {
      log.error("Unable to deserialize appointment event", exception);
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
        adapters.forEach(adapter -> adapter.send(reminder));
      }, delay, TimeUnit.MILLISECONDS);
      reminders.put(event.getAppointmentId(), future);
    } catch (DateTimeParseException exception) {
      log.warn("Unable to schedule reminder for appointmentId={} with startTime={}",
          event.getAppointmentId(), event.getStartTime());
    }
  }

  private void cancelReminder(String appointmentId) {
    ScheduledFuture<?> reminder = reminders.remove(appointmentId);
    if (reminder != null) {
      reminder.cancel(false);
    }
  }
}
