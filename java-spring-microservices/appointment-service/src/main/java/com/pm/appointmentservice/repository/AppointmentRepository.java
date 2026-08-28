package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.Appointment;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
  List<Appointment> findAllByTenantId(String tenantId);
  List<Appointment> findAllByTenantIdAndCustomerIdOrderByStartTimeDesc(String tenantId, String customerId);
  Optional<Appointment> findByIdAndTenantId(UUID id, String tenantId);
  @Query("""
      select case when count(a) > 0 then true else false end
      from Appointment a
      where a.tenantId = :tenantId and a.staffId = :staffId
        and a.status <> 'CANCELLED'
        and a.startTime < :endTime and a.endTime > :startTime
      """)
  boolean existsStaffOverlap(@Param("tenantId") String tenantId, @Param("staffId") String staffId,
      @Param("startTime") String startTime, @Param("endTime") String endTime);

  @Query("""
      select case when count(a) > 0 then true else false end
      from Appointment a
      where a.tenantId = :tenantId and a.customerId = :customerId
        and a.status <> 'CANCELLED'
        and a.startTime < :endTime and a.endTime > :startTime
        and (:appointmentId is null or a.id <> :appointmentId)
      """)
  boolean existsCustomerOverlap(@Param("tenantId") String tenantId, @Param("customerId") String customerId,
      @Param("startTime") String startTime, @Param("endTime") String endTime,
      @Param("appointmentId") UUID appointmentId);

  @Query("""
      select case when count(a) > 0 then true else false end
      from Appointment a
      where a.tenantId = :tenantId and a.resourceId = :resourceId
        and a.status <> 'CANCELLED'
        and a.startTime < :endTime and a.endTime > :startTime
        and (:appointmentId is null or a.id <> :appointmentId)
      """)
  boolean existsResourceOverlap(@Param("tenantId") String tenantId, @Param("resourceId") String resourceId,
      @Param("startTime") String startTime, @Param("endTime") String endTime,
      @Param("appointmentId") UUID appointmentId);
  void deleteByIdAndTenantId(UUID id, String tenantId);
}
