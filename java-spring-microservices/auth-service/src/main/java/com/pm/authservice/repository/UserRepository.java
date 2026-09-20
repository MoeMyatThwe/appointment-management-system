package com.pm.authservice.repository;

import com.pm.authservice.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);
  java.util.List<User> findAllByRoleNot(String role);
  java.util.List<User> findAllByTenantId(String tenantId);
  java.util.Optional<User> findFirstByStripeSubscriptionId(String stripeSubscriptionId);
  java.util.Optional<User> findFirstByStripeCustomerId(String stripeCustomerId);
  java.util.Optional<User> findFirstByTenantId(String tenantId);
  @Query(value = """
      select
        u.tenant_id as tenantId,
        min(u.tenant_name) as tenantName,
        coalesce(min(case when u.role in ('TENANT_ADMIN', 'ADMIN') then u.email end), min(u.email)) as ownerEmail,
        min(u.business_type) as businessType,
        min(u.timezone) as timezone,
        min(u.currency) as currency,
        coalesce(min(case when u.role in ('TENANT_ADMIN', 'ADMIN') then u.account_status end), min(u.account_status)) as accountStatus,
        coalesce(min(case when u.role in ('TENANT_ADMIN', 'ADMIN') then u.subscription_plan end), min(u.subscription_plan)) as subscriptionPlan,
        coalesce(min(case when u.role in ('TENANT_ADMIN', 'ADMIN') then u.subscription_status end), min(u.subscription_status)) as subscriptionStatus,
        max(u.deletion_due_at) as deletionDueAt,
        bool_and(u.active) as active,
        bool_and(u.onboarding_completed) as onboardingCompleted
      from users u
      where u.role <> 'PLATFORM_ADMIN'
        and (:search = '' or lower(u.tenant_name) like lower(concat('%', :search, '%'))
          or lower(u.email) like lower(concat('%', :search, '%'))
          or lower(u.tenant_id) like lower(concat('%', :search, '%')))
        and (:status = 'ALL' or u.account_status = :status)
        and (:plan = 'ALL' or u.subscription_plan = :plan)
      group by u.tenant_id
      order by min(u.tenant_name)
      """,
      countQuery = """
      select count(distinct u.tenant_id) from users u
      where u.role <> 'PLATFORM_ADMIN'
        and (:search = '' or lower(u.tenant_name) like lower(concat('%', :search, '%'))
          or lower(u.email) like lower(concat('%', :search, '%'))
          or lower(u.tenant_id) like lower(concat('%', :search, '%')))
        and (:status = 'ALL' or u.account_status = :status)
        and (:plan = 'ALL' or u.subscription_plan = :plan)
      """,
      nativeQuery = true)
  Page<PlatformTenantProjection> searchPlatformTenants(String search, String status, String plan, Pageable pageable);
}
