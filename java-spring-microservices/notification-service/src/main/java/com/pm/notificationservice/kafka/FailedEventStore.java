package com.pm.notificationservice.kafka;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class FailedEventStore {
  private final Map<String, FailedEvent> events = new ConcurrentHashMap<>();

  public void record(String eventId, String eventType, Exception error) {
    events.compute(eventId, (key, previous) -> new FailedEvent(eventType,
        error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage(),
        previous == null ? 1 : previous.attempts() + 1, Instant.now().toString()));
  }

  public record FailedEvent(String eventType, String error, int attempts, String failedAt) {}
}
