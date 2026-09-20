package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.AppointmentIdempotencyKey;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentIdempotencyKeyRepository
    extends JpaRepository<AppointmentIdempotencyKey, UUID> {
  Optional<AppointmentIdempotencyKey> findByTenantIdAndIdempotencyKey(
      String tenantId, String idempotencyKey);
}
