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
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
  List<Appointment> findAllByTenantId(String tenantId);
  long countByTenantIdAndStatus(String tenantId, String status);
  long countByTenantIdAndStartTimeGreaterThanEqualAndStatusNot(String tenantId, String startTime, String status);
  long countByTenantIdAndStartTimeGreaterThanEqualAndStartTimeLessThanAndStatusNot(
      String tenantId, String startTime, String endTime, String status);
  List<Appointment> findTop5ByTenantIdAndStartTimeGreaterThanEqualAndStatusNotOrderByStartTimeAsc(
      String tenantId, String startTime, String status);
  @Query("""
      select a from Appointment a
      where a.tenantId = :tenantId
        and (:fromTime = '' or a.endTime >= :fromTime)
        and (:toTime = '' or a.startTime <= :toTime)
      order by a.startTime asc
      """)
  List<Appointment> findForReport(@Param("tenantId") String tenantId,
      @Param("fromTime") String fromTime, @Param("toTime") String toTime);
  Page<Appointment> findAllByTenantIdAndCustomerIdOrderByStartTimeDesc(
      String tenantId, String customerId, Pageable pageable);

  @Query("""
      select a from Appointment a, Customer c
      where a.customerId = str(c.id)
        and c.customerAccountId = :accountId
      order by a.startTime desc
      """)
  Page<Appointment> findAllByCustomerAccountId(@Param("accountId") UUID accountId, Pageable pageable);

  @Query("""
      select a from Appointment a, Customer c
      where c.customerAccountId = :accountId
        and a.customerId = str(c.id)
        and (:search = '' or lower(coalesce(a.notes, '')) like lower(concat('%', :search, '%'))
          or str(a.id) like concat('%', :search, '%')
          or exists (select s.id from ServiceOffering s
            where s.tenantId = a.tenantId and str(s.id) = a.serviceId
              and lower(s.name) like lower(concat('%', :search, '%'))))
        and (:status = '' or a.status = :status)
        and (:paymentStatus = '' or coalesce(
          (select p.status from AppointmentPayment p
            where p.appointmentId = a.id and p.tenantId = a.tenantId),
          'UNPAID') = :paymentStatus)
        and (:dateFilter = 'ALL'
          or (:dateFilter = 'UPCOMING' and a.startTime >= :now)
          or (:dateFilter = 'PAST' and a.startTime < :now))
      order by a.startTime desc
      """)
  Page<Appointment> searchCustomer(
      @Param("accountId") UUID accountId,
      @Param("search") String search,
      @Param("status") String status,
      @Param("paymentStatus") String paymentStatus,
      @Param("dateFilter") String dateFilter,
      @Param("now") String now,
      Pageable pageable);

  @Query("""
      select a from Appointment a, Customer c
      where a.id = :appointmentId
        and a.tenantId = c.tenantId
        and a.customerId = str(c.id)
        and c.customerAccountId = :accountId
      """)
  Optional<Appointment> findByIdAndCustomerAccountId(
      @Param("appointmentId") UUID appointmentId, @Param("accountId") UUID accountId);
  Page<Appointment> findAllByTenantIdAndStaffIdOrderByStartTimeDesc(
      String tenantId, String staffId, Pageable pageable);
  Optional<Appointment> findByIdAndTenantId(UUID id, String tenantId);
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from Appointment a where a.id = :id and a.tenantId = :tenantId")
  Optional<Appointment> findByIdAndTenantIdForUpdate(@Param("id") UUID id, @Param("tenantId") String tenantId);

  @Query("""
      select a from Appointment a
      join AppointmentPayment p on p.appointmentId = a.id and p.tenantId = a.tenantId
      where a.paymentRequired = true
        and a.paymentDeadline is not null
        and a.paymentDeadline < :now
        and a.status in ('PENDING', 'CONFIRMED')
        and p.amountPaid < p.amountRequired
      """)
  List<Appointment> findExpiredPaymentHolds(@Param("now") java.time.OffsetDateTime now);

  @Query("""
      select a from Appointment a
      left join AppointmentPayment p on p.appointmentId = a.id and p.tenantId = a.tenantId
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
        and (:paymentStatus = '' or coalesce(p.status, 'UNPAID') = :paymentStatus)
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
      @Param("paymentStatus") String paymentStatus,
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
      select a from Appointment a
      where a.tenantId = :tenantId and a.staffId = :staffId
        and a.status <> 'CANCELLED'
        and a.startTime < :endTime and a.endTime > :startTime
      """)
  List<Appointment> findStaffOverlaps(@Param("tenantId") String tenantId,
      @Param("staffId") String staffId, @Param("startTime") String startTime,
      @Param("endTime") String endTime);

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
