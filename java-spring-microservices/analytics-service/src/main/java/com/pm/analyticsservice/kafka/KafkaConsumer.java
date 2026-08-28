package com.pm.analyticsservice.kafka;

import com.google.protobuf.InvalidProtocolBufferException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import appointment.events.AppointmentEvent;

@Service
public class KafkaConsumer {

  private static final Logger log = LoggerFactory.getLogger(
      KafkaConsumer.class);

  @KafkaListener(topics="appointment", groupId = "analytics-service")
  public void consumeEvent(byte[] event) {
    try {
      AppointmentEvent appointmentEvent = AppointmentEvent.parseFrom(event);
      // ... perform any business related to analytics here

      log.info("Received appointment Event: [appointmentId={},appointmentName={},appointmentEmail={}]",
            appointmentEvent.getAppointmentId(),
            appointmentEvent.getName(),
            appointmentEvent.getEmail());
    } catch (InvalidProtocolBufferException e) {
      log.error("Error deserializing event {}", e.getMessage());
    }
  }
}
