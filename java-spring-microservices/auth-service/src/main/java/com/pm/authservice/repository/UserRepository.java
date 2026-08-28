package com.pm.authservice.repository;

import com.pm.authservice.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);
  java.util.List<User> findAllByRoleNot(String role);
  java.util.List<User> findAllByTenantId(String tenantId);
  java.util.Optional<User> findFirstByStripeSubscriptionId(String stripeSubscriptionId);
  java.util.Optional<User> findFirstByStripeCustomerId(String stripeCustomerId);
  java.util.Optional<User> findFirstByTenantId(String tenantId);
}
