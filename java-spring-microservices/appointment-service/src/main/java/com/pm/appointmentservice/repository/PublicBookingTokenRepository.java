package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.PublicBookingToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublicBookingTokenRepository extends JpaRepository<PublicBookingToken, UUID> {
  Optional<PublicBookingToken> findByTokenHashAndTenantIdAndRevokedAtIsNull(
      String tokenHash, String tenantId);
  Optional<PublicBookingToken> findByAppointmentIdAndTenantIdAndRevokedAtIsNull(
      UUID appointmentId, String tenantId);
}
