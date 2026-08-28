package com.pm.authservice.service;

import com.pm.authservice.dto.RecoveryResponseDTO;
import com.pm.authservice.model.AccountRecoveryToken;
import com.pm.authservice.repository.AccountRecoveryTokenRepository;
import com.pm.authservice.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class RecoveryService {
  private final UserRepository users;
  private final AccountRecoveryTokenRepository tokens;
  private final PasswordEncoder passwords;
  private final boolean exposeDevelopmentToken;
  private final SecureRandom random = new SecureRandom();

  public RecoveryService(UserRepository users, AccountRecoveryTokenRepository tokens,
      PasswordEncoder passwords,
      @Value("${recovery.expose-development-token:false}") boolean exposeDevelopmentToken) {
    this.users = users; this.tokens = tokens; this.passwords = passwords;
    this.exposeDevelopmentToken = exposeDevelopmentToken;
  }

  public RecoveryResponseDTO request(String email) {
    var user = users.findByEmail(email);
    if (user.isEmpty()) return new RecoveryResponseDTO("If the account exists, recovery instructions will be sent.", null);
    byte[] bytes = new byte[32]; random.nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    AccountRecoveryToken record = new AccountRecoveryToken();
    record.setId(UUID.randomUUID()); record.setUserId(user.get().getId());
    record.setTokenHash(hash(token)); record.setExpiresAt(Instant.now().plusSeconds(900));
    tokens.save(record);
    return new RecoveryResponseDTO("If the account exists, recovery instructions will be sent.",
        exposeDevelopmentToken ? token : null);
  }

  public void reset(String token, String newPassword) {
    if (newPassword == null || newPassword.length() < 8) throw new IllegalArgumentException("Password must be at least 8 characters");
    AccountRecoveryToken record = tokens.findByTokenHashAndUsedAtIsNull(hash(token))
        .filter(item -> item.getExpiresAt().isAfter(Instant.now()))
        .orElseThrow(() -> new IllegalArgumentException("Recovery token is invalid or expired"));
    var user = users.findById(record.getUserId()).orElseThrow(() -> new IllegalArgumentException("Account not found"));
    user.setPassword(passwords.encode(newPassword)); users.save(user);
    record.setUsedAt(Instant.now()); tokens.save(record);
  }

  private String hash(String value) {
    try { return Base64.getUrlEncoder().withoutPadding().encodeToString(
        MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
    catch (Exception error) { throw new IllegalStateException("Recovery hashing failed", error); }
  }
}
