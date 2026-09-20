package com.pm.notificationservice.kafka;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class ProcessedEventStore {
  private final Set<String> eventIds = ConcurrentHashMap.newKeySet();

  public boolean claim(String eventId) {
    return eventId != null && !eventId.isBlank() && eventIds.add(eventId);
  }
}
