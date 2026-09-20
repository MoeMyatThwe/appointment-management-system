package com.pm.authservice.repository;

import com.pm.authservice.model.PlatformAuditEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

public interface PlatformAuditEventRepository extends JpaRepository<PlatformAuditEvent, UUID> {
  List<PlatformAuditEvent> findTop100ByOrderByCreatedAtDesc();
  @Query("""
      select e from PlatformAuditEvent e
      where (:tenantId = '' or e.tenantId = :tenantId)
        and (:actor = '' or lower(e.actorEmail) like lower(concat('%', :actor, '%')))
        and (:action = '' or e.action = :action)
      order by e.createdAt desc
      """)
  Page<PlatformAuditEvent> search(String tenantId, String actor, String action, Pageable pageable);
}
