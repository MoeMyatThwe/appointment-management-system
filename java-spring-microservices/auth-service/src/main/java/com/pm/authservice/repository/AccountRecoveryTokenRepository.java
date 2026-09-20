package com.pm.authservice.repository;

import com.pm.authservice.model.AccountRecoveryToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface AccountRecoveryTokenRepository extends JpaRepository<AccountRecoveryToken, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select t from AccountRecoveryToken t where t.tokenHash = :tokenHash and t.usedAt is null")
  Optional<AccountRecoveryToken> findByTokenHashAndUsedAtIsNull(@Param("tokenHash") String tokenHash);
}
