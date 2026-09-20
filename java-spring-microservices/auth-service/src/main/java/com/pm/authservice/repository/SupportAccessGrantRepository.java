package com.pm.authservice.repository;

import com.pm.authservice.model.SupportAccessGrant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportAccessGrantRepository extends JpaRepository<SupportAccessGrant, UUID> {
  List<SupportAccessGrant> findAllByOrderByCreatedAtDesc();
  List<SupportAccessGrant> findAllByTenantIdOrderByCreatedAtDesc(String tenantId);
}
