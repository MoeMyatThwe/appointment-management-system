package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.AppointmentPayment;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface AppointmentPaymentRepository extends JpaRepository<AppointmentPayment, UUID> {
  Optional<AppointmentPayment> findByAppointmentIdAndTenantId(UUID appointmentId, String tenantId);
  Optional<AppointmentPayment> findByAppointmentId(UUID appointmentId);
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select p from AppointmentPayment p where p.appointmentId = :appointmentId and p.tenantId = :tenantId")
  Optional<AppointmentPayment> findByAppointmentIdAndTenantIdForUpdate(
      @Param("appointmentId") UUID appointmentId, @Param("tenantId") String tenantId);
}
