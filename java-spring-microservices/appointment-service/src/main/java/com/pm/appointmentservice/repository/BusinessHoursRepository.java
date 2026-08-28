package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.BusinessHours;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessHoursRepository extends JpaRepository<BusinessHours, UUID> {
  List<BusinessHours> findAllByTenantIdOrderByDayOfWeek(String tenantId);
  Optional<BusinessHours> findByTenantIdAndDayOfWeek(String tenantId, Integer dayOfWeek);
}
