package com.pm.notificationservice.repository;

import com.pm.notificationservice.model.ProcessedNotificationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ProcessedNotificationEventRepository
    extends JpaRepository<ProcessedNotificationEvent, String> {
  @Modifying
  @Transactional
  @Query("""
      update ProcessedNotificationEvent e
      set e.status = 'PROCESSING', e.claimedUntil = :lease
      where e.eventId = :eventId
        and e.status <> 'PROCESSED'
        and (e.claimedUntil is null or e.claimedUntil <= :now)
      """)
  int reclaim(@Param("eventId") String eventId, @Param("now") java.time.Instant now,
      @Param("lease") java.time.Instant lease);

  @Modifying
  @Transactional
  @Query("""
      update ProcessedNotificationEvent e
      set e.status = 'PROCESSED', e.processedAt = :processedAt, e.claimedUntil = null
      where e.eventId = :eventId
      """)
  int complete(@Param("eventId") String eventId, @Param("processedAt") java.time.Instant processedAt);

  @Modifying
  @Transactional
  @Query("delete from ProcessedNotificationEvent e where e.eventId = :eventId and e.status <> 'PROCESSED'")
  int release(@Param("eventId") String eventId);
}
