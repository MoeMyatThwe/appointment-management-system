package com.pm.notificationservice.repository;

import com.pm.notificationservice.model.NotificationDelivery;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface NotificationDeliveryRepository extends JpaRepository<NotificationDelivery, UUID> {
  @Modifying
  @Transactional
  @Query("""
      update NotificationDelivery d
      set d.status = 'PROCESSING', d.claimedUntil = :lease, d.attempts = d.attempts + 1
      where d.eventId = :eventId and d.eventType = :eventType and d.adapterName = :adapterName
        and d.status <> 'DELIVERED'
        and (d.claimedUntil is null or d.claimedUntil <= :now)
      """)
  int reclaim(@Param("eventId") String eventId, @Param("eventType") String eventType,
      @Param("adapterName") String adapterName, @Param("now") java.time.Instant now,
      @Param("lease") java.time.Instant lease);

  @Modifying
  @Transactional
  @Query("""
      update NotificationDelivery d
      set d.status = 'DELIVERED', d.deliveredAt = :deliveredAt, d.claimedUntil = null
      where d.eventId = :eventId and d.eventType = :eventType and d.adapterName = :adapterName
      """)
  int complete(@Param("eventId") String eventId, @Param("eventType") String eventType,
      @Param("adapterName") String adapterName, @Param("deliveredAt") java.time.Instant deliveredAt);

  @Modifying
  @Transactional
  @Query("""
      delete from NotificationDelivery d
      where d.eventId = :eventId and d.eventType = :eventType and d.adapterName = :adapterName
        and d.status <> 'DELIVERED'
      """)
  int release(@Param("eventId") String eventId, @Param("eventType") String eventType,
      @Param("adapterName") String adapterName);
}
