package com.pm.notificationservice.kafka;

import com.pm.notificationservice.model.ProcessedNotificationEvent;
import com.pm.notificationservice.repository.ProcessedNotificationEventRepository;
import java.time.Instant;
import java.time.Duration;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

@Component
public class ProcessedEventStore {
  private final ProcessedNotificationEventRepository repository;

  public ProcessedEventStore(ProcessedNotificationEventRepository repository) {
    this.repository = repository;
  }

  public boolean claim(String eventId) {
    if (eventId == null || eventId.isBlank()) return false;
    try {
      repository.saveAndFlush(new ProcessedNotificationEvent(eventId, "APPOINTMENT",
          Instant.now()));
      return true;
    } catch (DataIntegrityViolationException duplicate) {
      Instant now = Instant.now();
      return repository.reclaim(eventId, now, now.plus(Duration.ofMinutes(5))) == 1;
    }
  }

  public void complete(String eventId) {
    repository.complete(eventId, Instant.now());
  }

  public void release(String eventId) {
    repository.release(eventId);
  }
}
