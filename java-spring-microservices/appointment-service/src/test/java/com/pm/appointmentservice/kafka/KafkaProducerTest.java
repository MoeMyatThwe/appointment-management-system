package com.pm.appointmentservice.kafka;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import appointment.events.AppointmentEvent;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.model.AppointmentEventOutbox;
import com.pm.appointmentservice.model.Customer;
import com.pm.appointmentservice.repository.AppointmentEventOutboxRepository;
import com.pm.appointmentservice.repository.CustomerRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

@ExtendWith(MockitoExtension.class)
class KafkaProducerTest {

  @Mock
  private KafkaTemplate<String, byte[]> kafkaTemplate;
  @Mock
  private CustomerRepository customers;
  @Mock
  private AppointmentEventOutboxRepository outbox;

  private KafkaProducer producer;
  private Appointment appointment;

  @BeforeEach
  void setUp() {
    producer = new KafkaProducer(kafkaTemplate, customers, outbox, new SimpleMeterRegistry(), 2, 7);
    appointment = new Appointment();
    appointment.setId(UUID.randomUUID());
    appointment.setTenantId("tenant-1");
    appointment.setBusinessId("business-1");
    appointment.setCustomerId(UUID.randomUUID().toString());
    appointment.setStaffId("staff-1");
    appointment.setServiceId("service-1");
    appointment.setCalendarId("calendar-1");
    appointment.setStartTime("2026-08-29T10:00:00Z");
    appointment.setEndTime("2026-08-29T10:30:00Z");
    appointment.setStatus("PENDING");
  }

  @Test
  void sendEventStoresSerializedEventInOutbox() throws Exception {
    Customer customer = new Customer();
    customer.setName("Ada");
    customer.setEmail("ada@example.com");
    when(customers.findByIdAndTenantId(any(UUID.class), eq("tenant-1")))
        .thenReturn(Optional.of(customer));

    producer.sendEvent(appointment, "APPOINTMENT_CREATED");

    ArgumentCaptor<AppointmentEventOutbox> captor =
        ArgumentCaptor.forClass(AppointmentEventOutbox.class);
    verify(outbox).save(captor.capture());
    AppointmentEvent event = AppointmentEvent.parseFrom(captor.getValue().getPayload());
    assertEquals("APPOINTMENT_CREATED", captor.getValue().getEventType());
    assertEquals("Ada", event.getName());
    assertEquals(appointment.getId().toString(), event.getAppointmentId());
    assertTrue(!event.getEventId().isBlank());
  }

  @Test
  void publishPendingEventsMarksAcknowledgedMessagePublished() throws Exception {
    AppointmentEventOutbox message = pendingMessage();
    when(outbox.findTop50ByStatusOrderByCreatedAtAsc("PENDING")).thenReturn(List.of(message));
    when(kafkaTemplate.send(eq("appointment"), eq(message.getAggregateId()), any(byte[].class)))
        .thenReturn(CompletableFuture.completedFuture((SendResult<String, byte[]>) null));

    producer.publishPendingEvents();

    assertEquals("PUBLISHED", message.getStatus());
    assertTrue(message.getPublishedAt() != null);
    verify(outbox).save(message);
  }

  @Test
  void publishPendingEventsRetainsPendingMessageAfterFailure() {
    AppointmentEventOutbox message = pendingMessage();
    when(outbox.findTop50ByStatusOrderByCreatedAtAsc("PENDING")).thenReturn(List.of(message));
    CompletableFuture<SendResult<String, byte[]>> failed = new CompletableFuture<>();
    failed.completeExceptionally(new IllegalStateException("broker unavailable"));
    when(kafkaTemplate.send(anyString(), eq(message.getAggregateId()), any(byte[].class)))
        .thenReturn(failed);

    producer.publishPendingEvents();

    assertEquals("PENDING", message.getStatus());
    assertEquals(1, message.getAttempts());
    assertTrue(message.getLastError().contains("broker unavailable"));
    verify(outbox).save(message);
  }

  @Test
  void publishPendingEventsStopsRetryingAfterMaximumAttempts() {
    AppointmentEventOutbox message = pendingMessage();
    message.setAttempts(1);
    when(outbox.findTop50ByStatusOrderByCreatedAtAsc("PENDING")).thenReturn(List.of(message));
    CompletableFuture<SendResult<String, byte[]>> failed = new CompletableFuture<>();
    failed.completeExceptionally(new IllegalStateException("broker unavailable"));
    when(kafkaTemplate.send(anyString(), eq(message.getAggregateId()), any(byte[].class)))
        .thenReturn(failed);

    producer.publishPendingEvents();

    assertEquals("FAILED", message.getStatus());
    assertEquals(2, message.getAttempts());
  }

  private AppointmentEventOutbox pendingMessage() {
    AppointmentEventOutbox message = new AppointmentEventOutbox();
    message.setAggregateId(appointment.getId().toString());
    message.setEventType("APPOINTMENT_CREATED");
    message.setPayload(new byte[] {1, 2, 3});
    message.setCreatedAt("2026-08-29T00:00:00Z");
    return message;
  }
}
