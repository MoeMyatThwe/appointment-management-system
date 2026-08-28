package com.pm.authservice.repository;

import com.pm.authservice.model.AccountRecoveryToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRecoveryTokenRepository extends JpaRepository<AccountRecoveryToken, UUID> {
  Optional<AccountRecoveryToken> findByTokenHashAndUsedAtIsNull(String tokenHash);
}
