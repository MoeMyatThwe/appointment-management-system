package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.PaymentHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, UUID> {
  List<PaymentHistory> findAllByAppointmentIdAndTenantIdOrderByCreatedAtDesc(
      UUID appointmentId, String tenantId);
}
