package com.pm.appointmentservice.repository;

import com.pm.appointmentservice.model.Appointment;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
      select a from Appointment a
      where a.tenantId = :tenantId
        and (:search = '' or
          lower(coalesce(a.notes, '')) like lower(concat('%', :search, '%'))
          or str(a.id) like concat('%', :search, '%')
          or exists (select c.id from Customer c
            where c.tenantId = a.tenantId and str(c.id) = a.customerId
              and (lower(c.name) like lower(concat('%', :search, '%'))
                or lower(c.email) like lower(concat('%', :search, '%'))))
          or exists (select s.id from Staff s
            where s.tenantId = a.tenantId and str(s.id) = a.staffId
              and (lower(s.name) like lower(concat('%', :search, '%'))
                or lower(coalesce(s.email, '')) like lower(concat('%', :search, '%'))))
          or exists (select service.id from ServiceOffering service
            where service.tenantId = a.tenantId and str(service.id) = a.serviceId
              and lower(service.name) like lower(concat('%', :search, '%'))))
        and (:fromTime = '' or a.endTime >= :fromTime)
        and (:toTime = '' or a.startTime <= :toTime)
        and (:status = '' or a.status = :status)
        and (:staffId = '' or a.staffId = :staffId)
        and (:customerId = '' or a.customerId = :customerId)
        and (:serviceId = '' or a.serviceId = :serviceId)
        and (:resourceId = '' or a.resourceId = :resourceId)
      """)
  Page<Appointment> search(
      @Param("tenantId") String tenantId,
      @Param("search") String search,
      @Param("fromTime") String fromTime,
      @Param("toTime") String toTime,
      @Param("status") String status,
      @Param("staffId") String staffId,
      @Param("customerId") String customerId,
      @Param("serviceId") String serviceId,
      @Param("resourceId") String resourceId,
      Pageable pageable);

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
