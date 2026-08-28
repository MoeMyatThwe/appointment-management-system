package com.pm.authservice.repository;

import com.pm.authservice.model.PlatformAuditEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformAuditEventRepository extends JpaRepository<PlatformAuditEvent, UUID> {
  List<PlatformAuditEvent> findTop100ByOrderByCreatedAtDesc();
}
