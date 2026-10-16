package com.pm.authservice.repository;

import com.pm.authservice.model.CustomerAccount;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerAccountRepository extends JpaRepository<CustomerAccount, UUID> {
  Optional<CustomerAccount> findByEmail(String email);
  boolean existsByEmail(String email);
}
