package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.BusinessHoliday;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessHolidayRepository extends JpaRepository<BusinessHoliday, UUID> {
  List<BusinessHoliday> findAllByTenantIdOrderByHolidayDate(String tenantId);
  boolean existsByTenantIdAndHolidayDate(String tenantId, LocalDate holidayDate);
  boolean existsByTenantIdAndHolidayDateBetween(String tenantId, LocalDate startDate, LocalDate endDate);
}
