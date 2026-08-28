package com.pm.authservice.repository;

import com.pm.authservice.model.TenantFeatureFlag;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantFeatureFlagRepository extends JpaRepository<TenantFeatureFlag, TenantFeatureFlag.Key> {
  List<TenantFeatureFlag> findAllByTenantId(String tenantId);
  Optional<TenantFeatureFlag> findByTenantIdAndFlagKey(String tenantId, String flagKey);
}
