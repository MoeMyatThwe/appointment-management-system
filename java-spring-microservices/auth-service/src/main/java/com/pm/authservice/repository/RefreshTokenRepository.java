package com.pm.authservice.repository;

import com.pm.authservice.model.RefreshToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
  Optional<RefreshToken> findByTokenHashAndRevokedAtIsNull(String tokenHash);
  long deleteByUserId(UUID userId);
}
