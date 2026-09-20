package com.pm.analyticsservice.kafka;

import com.google.protobuf.InvalidProtocolBufferException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Service;
import java.util.Arrays;
import appointment.events.AppointmentEvent;

@Service
public class KafkaConsumer {

  private static final Logger log = LoggerFactory.getLogger(
      KafkaConsumer.class);
  private final ProcessedEventStore processedEvents;
  private final FailedEventStore failedEvents;

  public KafkaConsumer(ProcessedEventStore processedEvents, FailedEventStore failedEvents) {
    this.processedEvents = processedEvents;
    this.failedEvents = failedEvents;
  }

  @KafkaListener(topics="appointment", groupId = "analytics-service")
  @RetryableTopic(attempts = "4", backoff = @Backoff(delay = 1000, multiplier = 2.0),
      dltTopicSuffix = ".DLT")
  public void consumeEvent(byte[] event) {
    try {
      AppointmentEvent appointmentEvent = AppointmentEvent.parseFrom(event);
      String eventKey = appointmentEvent.getEventId().isBlank()
          ? "legacy-" + Integer.toHexString(Arrays.hashCode(event)) : appointmentEvent.getEventId();
      if (!processedEvents.claim(eventKey)) {
        log.info("Skipping duplicate appointment event eventId={}", eventKey);
        return;
      }
      // ... perform any business related to analytics here

      log.info("Received appointment Event: [appointmentId={},appointmentName={},appointmentEmail={}]",
            appointmentEvent.getAppointmentId(),
            appointmentEvent.getName(),
            appointmentEvent.getEmail());
    } catch (InvalidProtocolBufferException e) {
      failedEvents.record("payload-" + Integer.toHexString(Arrays.hashCode(event)),
          "UNKNOWN", e);
      log.error("Error deserializing event {}", e.getMessage());
      throw new IllegalStateException("Error deserializing appointment event", e);
    } catch (Exception e) {
      failedEvents.record("unknown", "APPOINTMENT", e);
      throw new IllegalStateException("Appointment event processing failed", e);
    }
  }
}
