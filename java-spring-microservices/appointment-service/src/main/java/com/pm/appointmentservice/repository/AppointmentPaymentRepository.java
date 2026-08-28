package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.AppointmentPayment;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentPaymentRepository extends JpaRepository<AppointmentPayment, UUID> {
  Optional<AppointmentPayment> findByAppointmentIdAndTenantId(UUID appointmentId, String tenantId);
}
