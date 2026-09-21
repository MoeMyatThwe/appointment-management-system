package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.StaffTimeOff;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffTimeOffRepository extends JpaRepository<StaffTimeOff, UUID> {
  Page<StaffTimeOff> findAllByTenantIdAndStaffIdOrderByStartTimeDesc(
      String tenantId, String staffId, Pageable pageable);
  boolean existsByTenantIdAndStaffIdAndStartTimeLessThanAndEndTimeGreaterThan(
      String tenantId, String staffId, String endTime, String startTime);
  List<StaffTimeOff> findAllByTenantIdAndStaffIdAndStartTimeLessThanAndEndTimeGreaterThan(
      String tenantId, String staffId, String endTime, String startTime);
}
