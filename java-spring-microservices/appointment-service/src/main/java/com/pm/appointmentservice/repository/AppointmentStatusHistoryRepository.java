package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.AppointmentStatusHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentStatusHistoryRepository extends JpaRepository<AppointmentStatusHistory, UUID> {
  List<AppointmentStatusHistory> findAllByTenantIdAndAppointmentIdOrderByChangedAtDesc(
      String tenantId, UUID appointmentId);
}
