package com.pm.authservice.service;

import com.pm.authservice.dto.PlatformTenantDTO;
import com.pm.authservice.dto.TenantExportDTO;
import com.pm.authservice.model.User;
import com.pm.authservice.repository.UserRepository;
import java.util.*;
import java.util.stream.Collectors;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.pm.authservice.repository.PlatformTenantProjection;
import com.pm.authservice.repository.RefreshTokenRepository;

@Service
public class PlatformAdminService {
  private final UserRepository users;
  private final SubscriptionPlanService plans;
  private final RefreshTokenRepository refreshTokens;
  public PlatformAdminService(UserRepository users, SubscriptionPlanService plans,
      RefreshTokenRepository refreshTokens) {
    this.users = users;
    this.plans = plans;
    this.refreshTokens = refreshTokens;
  }

  public List<PlatformTenantDTO> tenants() {
    return users.findAllByRoleNot("PLATFORM_ADMIN").stream()
        .collect(Collectors.groupingBy(User::getTenantId, LinkedHashMap::new, Collectors.toList()))
        .values().stream().map(this::toTenant).toList();
  }

  public Page<PlatformTenantDTO> tenants(Pageable pageable, String search, String status, String plan) {
    return users.searchPlatformTenants(
        search == null ? "" : search.trim(),
        status == null || status.isBlank() ? "ALL" : status,
        plan == null || plan.isBlank() ? "ALL" : plan,
        pageable).map(this::toTenant);
  }

  public PlatformTenantDTO setStatus(String tenantId, boolean active) {
    List<User> tenantUsers = users.findAllByTenantId(tenantId);
    if (tenantUsers.isEmpty()) throw new IllegalArgumentException("Tenant not found");
    tenantUsers.forEach(user -> { user.setActive(active); user.setAccountStatus(active ? "ACTIVE" : "SUSPENDED"); });
    users.saveAll(tenantUsers);
    if (!active) tenantUsers.forEach(user -> refreshTokens.deleteByUserId(user.getId()));
    return toTenant(tenantUsers);
  }

  public PlatformTenantDTO requestDeletion(String tenantId) {
    List<User> tenantUsers = users.findAllByTenantId(tenantId);
    if (tenantUsers.isEmpty()) throw new IllegalArgumentException("Tenant not found");
    Instant due = Instant.now().plusSeconds(30L * 24 * 60 * 60);
    tenantUsers.forEach(user -> {
      user.setActive(false); user.setAccountStatus("DELETION_REQUESTED");
      user.setDeletionRequestedAt(Instant.now()); user.setDeletionDueAt(due);
    });
    users.saveAll(tenantUsers);
    tenantUsers.forEach(user -> refreshTokens.deleteByUserId(user.getId()));
    return toTenant(tenantUsers);
  }

  public TenantExportDTO exportTenant(String tenantId) {
    List<User> tenantUsers = users.findAllByTenantId(tenantId);
    if (tenantUsers.isEmpty()) throw new IllegalArgumentException("Tenant not found");
    User owner = tenantUsers.stream().filter(user -> "TENANT_ADMIN".equalsIgnoreCase(user.getRole())
        || "ADMIN".equalsIgnoreCase(user.getRole())).findFirst().orElse(tenantUsers.get(0));
    return new TenantExportDTO(owner.getTenantId(), owner.getTenantName(), owner.getEmail(),
        owner.getBusinessType(), owner.getTimezone(), owner.getCurrency(), owner.getAccountStatus(),
        owner.getSubscriptionPlan(), owner.getSubscriptionStatus(), Instant.now());
  }

  public void permanentlyDelete(String tenantId, String confirmation) {
    if (!("DELETE " + tenantId).equals(confirmation)) {
      throw new IllegalArgumentException("Deletion confirmation does not match");
    }
    List<User> tenantUsers = users.findAllByTenantId(tenantId);
    if (tenantUsers.isEmpty()) throw new IllegalArgumentException("Tenant not found");
    User owner = tenantUsers.get(0);
    if (!"DELETION_REQUESTED".equals(owner.getAccountStatus())
        || owner.getDeletionDueAt() == null || owner.getDeletionDueAt().isAfter(Instant.now())) {
      throw new IllegalArgumentException("Retention period has not completed");
    }
    users.deleteAll(tenantUsers);
  }

  public PlatformTenantDTO setPlan(String tenantId, String planCode) {
    plans.find(planCode);
    List<User> tenantUsers = users.findAllByTenantId(tenantId);
    if (tenantUsers.isEmpty()) throw new IllegalArgumentException("Tenant not found");
    tenantUsers.forEach(user -> {
      user.setSubscriptionPlan(planCode.toUpperCase());
      user.setSubscriptionStatus("ACTIVE");
    });
    users.saveAll(tenantUsers);
    return toTenant(tenantUsers);
  }

  private PlatformTenantDTO toTenant(List<User> users) {
    User owner = users.stream().filter(user -> "TENANT_ADMIN".equalsIgnoreCase(user.getRole())
        || "ADMIN".equalsIgnoreCase(user.getRole())).findFirst().orElse(users.get(0));
    return new PlatformTenantDTO(owner.getTenantId(), owner.getTenantName(), owner.getEmail(),
        owner.getBusinessType(), owner.getTimezone(), owner.getCurrency(),
        owner.getAccountStatus(), owner.getSubscriptionPlan(), owner.getSubscriptionStatus(),
        owner.getDeletionDueAt(),
        users.stream().allMatch(User::isActive), owner.isOnboardingCompleted());
  }

  private PlatformTenantDTO toTenant(PlatformTenantProjection tenant) {
    return new PlatformTenantDTO(tenant.getTenantId(), tenant.getTenantName(), tenant.getOwnerEmail(),
        tenant.getBusinessType(), tenant.getTimezone(), tenant.getCurrency(), tenant.getAccountStatus(),
        tenant.getSubscriptionPlan(), tenant.getSubscriptionStatus(), tenant.getDeletionDueAt(),
        tenant.isActive(), tenant.isOnboardingCompleted());
  }
}
