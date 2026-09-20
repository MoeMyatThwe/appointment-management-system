package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.StripeWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface StripeWebhookEventRepository extends JpaRepository<StripeWebhookEvent, UUID> {
  boolean existsByEventId(String eventId);
}
