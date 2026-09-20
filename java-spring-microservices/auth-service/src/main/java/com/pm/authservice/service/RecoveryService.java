package com.pm.authservice.service;

import com.pm.authservice.dto.RecoveryResponseDTO;
import com.pm.authservice.model.AccountRecoveryToken;
import com.pm.authservice.repository.AccountRecoveryTokenRepository;
import com.pm.authservice.repository.UserRepository;
import com.pm.authservice.repository.RefreshTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecoveryService {
  private static final Logger log = LoggerFactory.getLogger(RecoveryService.class);
  private final UserRepository users;
  private final AccountRecoveryTokenRepository tokens;
  private final PasswordEncoder passwords;
  private final ObjectProvider<JavaMailSender> mailSenders;
  private final RefreshTokenRepository refreshTokens;
  private final boolean exposeDevelopmentToken;
  private final String frontendUrl;
  private final String mailFrom;
  private final String mailFromName;
  private final SecureRandom random = new SecureRandom();

  public RecoveryService(UserRepository users, AccountRecoveryTokenRepository tokens,
      PasswordEncoder passwords,
      ObjectProvider<JavaMailSender> mailSenders,
      RefreshTokenRepository refreshTokens,
      @Value("${recovery.expose-development-token:false}") boolean exposeDevelopmentToken,
      @Value("${recovery.frontend-url:http://localhost:5174/recovery}") String frontendUrl,
      @Value("${recovery.mail-from:}") String mailFrom,
      @Value("${recovery.mail-from-name:Schedora}") String mailFromName) {
    this.users = users; this.tokens = tokens; this.passwords = passwords;
    this.mailSenders = mailSenders;
    this.refreshTokens = refreshTokens;
    this.exposeDevelopmentToken = exposeDevelopmentToken;
    this.frontendUrl = frontendUrl;
    this.mailFrom = mailFrom;
    this.mailFromName = mailFromName;
  }

  public RecoveryResponseDTO request(String email) {
    var user = users.findByEmail(email);
    if (user.isEmpty()) {
      log.info("Recovery requested for an unknown account: {}", maskEmail(email));
      return new RecoveryResponseDTO("If the account exists, recovery instructions will be sent.", null);
    }
    byte[] bytes = new byte[32]; random.nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    AccountRecoveryToken record = new AccountRecoveryToken();
    record.setId(UUID.randomUUID()); record.setUserId(user.get().getId());
    record.setTokenHash(hash(token)); record.setExpiresAt(Instant.now().plusSeconds(900));
    tokens.save(record);
    try {
      sendRecoveryEmail(user.get().getEmail(), token);
      log.info("Recovery email sent to {}", maskEmail(user.get().getEmail()));
    } catch (RuntimeException error) {
      tokens.delete(record);
      log.error("Recovery email delivery failed for {}", maskEmail(user.get().getEmail()), error);
      throw new IllegalStateException("Recovery email could not be sent. Check the mail settings and try again.", error);
    }
    return new RecoveryResponseDTO("If the account exists, recovery instructions will be sent.",
        exposeDevelopmentToken ? token : null);
  }

  private void sendRecoveryEmail(String recipient, String token) {
    JavaMailSender mailSender = mailSenders.getIfAvailable();
    if (mailSender == null || mailFrom.isBlank()) {
      log.error("Recovery email sender is not configured (mailSender={}, fromConfigured={})",
          mailSender != null, !mailFrom.isBlank());
      throw new IllegalStateException("Recovery email sender is not configured");
    }

    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(mailFromName.isBlank() ? mailFrom : "%s <%s>".formatted(mailFromName, mailFrom));
    message.setTo(recipient);
    message.setSubject("Reset your Schedora password");
    message.setText("""
        We received a request to reset your Schedora password.

        Use this recovery token within 15 minutes:
        %s

        Open %s and enter the token with your new password.
        If you did not request this, you can ignore this email.
        """.formatted(token, frontendUrl));
    mailSender.send(message);
  }

  private String maskEmail(String email) {
    if (email == null || email.isBlank()) {
      return "<empty>";
    }
    int at = email.indexOf('@');
    if (at <= 1) {
      return "***";
    }
    return email.charAt(0) + "***" + email.substring(at);
  }

  @Transactional
  public void reset(String token, String newPassword) {
    if (newPassword == null || newPassword.length() < 8) throw new IllegalArgumentException("Password must be at least 8 characters");
    AccountRecoveryToken record = tokens.findByTokenHashAndUsedAtIsNull(hash(token))
        .filter(item -> item.getExpiresAt().isAfter(Instant.now()))
        .orElseThrow(() -> new IllegalArgumentException("Recovery token is invalid or expired"));
    var user = users.findById(record.getUserId()).orElseThrow(() -> new IllegalArgumentException("Account not found"));
    user.setPassword(passwords.encode(newPassword)); users.save(user);
    refreshTokens.deleteByUserId(user.getId());
    record.setUsedAt(Instant.now()); tokens.save(record);
  }

  private String hash(String value) {
    try { return Base64.getUrlEncoder().withoutPadding().encodeToString(
        MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
    catch (Exception error) { throw new IllegalStateException("Recovery hashing failed", error); }
  }
}
