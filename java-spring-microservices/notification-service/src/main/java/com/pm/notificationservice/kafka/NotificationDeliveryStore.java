package com.pm.notificationservice.kafka;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class NotificationDeliveryStore {
  private final Set<String> deliveries = ConcurrentHashMap.newKeySet();

  public boolean claim(String eventId, String eventType, String adapterName) {
    return deliveries.add(eventId + "|" + eventType + "|" + adapterName);
  }
}
