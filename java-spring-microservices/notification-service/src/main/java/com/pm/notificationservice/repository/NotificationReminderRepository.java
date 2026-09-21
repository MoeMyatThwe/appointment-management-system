package com.pm.notificationservice.repository;

import com.pm.notificationservice.model.NotificationReminder;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface NotificationReminderRepository extends JpaRepository<NotificationReminder, UUID> {
  Optional<NotificationReminder> findByAppointmentId(String appointmentId);

  @Query("""
      select r from NotificationReminder r
      where (r.status = 'PENDING' and r.scheduledAt <= :now)
         or (r.status = 'CLAIMED' and r.claimedUntil <= :now)
      order by r.scheduledAt asc
      """)
  List<NotificationReminder> findDue(@Param("now") Instant now, Pageable pageable);

  @Modifying
  @Transactional
  @Query("""
      update NotificationReminder r
      set r.status = 'CLAIMED', r.claimedUntil = :lease
      where r.id = :id
        and (r.status = 'PENDING' or (r.status = 'CLAIMED' and r.claimedUntil <= :now))
      """)
  int claim(@Param("id") UUID id, @Param("now") Instant now, @Param("lease") Instant lease);
}
