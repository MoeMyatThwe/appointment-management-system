package com.pm.analyticsservice.kafka;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ProcessedEventStoreTest {

  private final ProcessedEventStore store = new ProcessedEventStore();

  @Test
  void claimsAnEventOnlyOnce() {
    assertTrue(store.claim("event-123"));
    assertFalse(store.claim("event-123"));
  }

  @Test
  void rejectsBlankEventIds() {
    assertFalse(store.claim(null));
    assertFalse(store.claim(""));
    assertFalse(store.claim("   "));
  }
}
