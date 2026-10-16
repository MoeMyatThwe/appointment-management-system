package com.pm.analyticsservice.kafka;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import appointment.events.AppointmentEvent;
import com.google.protobuf.InvalidProtocolBufferException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class KafkaConsumerTest {

  @Mock
  private ProcessedEventStore processedEvents;

  @Mock
  private FailedEventStore failedEvents;

  private KafkaConsumer consumer;

  @BeforeEach
  void setUp() {
    consumer = new KafkaConsumer(processedEvents, failedEvents);
  }

  @Test
  void consumesAValidAppointmentEvent() {
    AppointmentEvent event = AppointmentEvent.newBuilder()
        .setEventId("event-123")
        .setAppointmentId("appointment-456")
        .setName("Jane Doe")
        .setEmail("jane@example.com")
        .build();
    when(processedEvents.claim("event-123")).thenReturn(true);

    assertDoesNotThrow(() -> consumer.consumeEvent(event.toByteArray()));

    verify(processedEvents).claim("event-123");
    verifyNoInteractions(failedEvents);
  }

  @Test
  void skipsAnEventThatWasAlreadyProcessed() {
    AppointmentEvent event = AppointmentEvent.newBuilder()
        .setEventId("event-123")
        .build();
    when(processedEvents.claim("event-123")).thenReturn(false);

    assertDoesNotThrow(() -> consumer.consumeEvent(event.toByteArray()));

    verify(processedEvents).claim("event-123");
    verifyNoInteractions(failedEvents);
  }

  @Test
  void recordsMalformedPayloadAndRaisesProcessingError() {
    byte[] malformedPayload = new byte[] {0x0A, (byte) 0x80};

    assertThrows(IllegalStateException.class,
        () -> consumer.consumeEvent(malformedPayload));

    verify(failedEvents).record(anyString(), eq("UNKNOWN"),
        any(InvalidProtocolBufferException.class));
  }
}
