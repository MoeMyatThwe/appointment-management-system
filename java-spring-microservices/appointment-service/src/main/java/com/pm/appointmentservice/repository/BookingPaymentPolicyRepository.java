package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.BookingPaymentPolicy;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingPaymentPolicyRepository extends JpaRepository<BookingPaymentPolicy, UUID> {
  Optional<BookingPaymentPolicy> findByTenantId(String tenantId);
}
