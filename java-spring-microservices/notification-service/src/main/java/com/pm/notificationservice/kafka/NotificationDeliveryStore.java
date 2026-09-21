package com.pm.notificationservice.kafka;

import com.pm.notificationservice.model.NotificationDelivery;
import com.pm.notificationservice.repository.NotificationDeliveryRepository;
import java.time.Instant;
import java.time.Duration;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

@Component
public class NotificationDeliveryStore {
  private final NotificationDeliveryRepository repository;

  public NotificationDeliveryStore(NotificationDeliveryRepository repository) {
    this.repository = repository;
  }

  public boolean claim(String eventId, String eventType, String adapterName) {
    try {
      repository.saveAndFlush(new NotificationDelivery(eventId, eventType, adapterName,
          Instant.now()));
      return true;
    } catch (DataIntegrityViolationException duplicate) {
      Instant now = Instant.now();
      return repository.reclaim(eventId, eventType, adapterName, now,
          now.plus(Duration.ofMinutes(5))) == 1;
    }
  }

  public void complete(String eventId, String eventType, String adapterName) {
    repository.complete(eventId, eventType, adapterName, Instant.now());
  }

  public void release(String eventId, String eventType, String adapterName) {
    repository.release(eventId, eventType, adapterName);
  }
}
