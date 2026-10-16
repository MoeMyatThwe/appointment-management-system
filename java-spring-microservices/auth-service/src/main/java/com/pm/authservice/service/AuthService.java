package com.pm.authservice.service;

import com.pm.authservice.dto.LoginRequestDTO;
import com.pm.authservice.dto.RegisterRequestDTO;
import com.pm.authservice.dto.AuthSessionDTO;
import com.pm.authservice.model.RefreshToken;
import com.pm.authservice.model.CustomerAccount;
import com.pm.authservice.repository.CustomerAccountRepository;
import com.pm.authservice.dto.CustomerRegisterRequestDTO;
import com.pm.authservice.repository.RefreshTokenRepository;
import com.pm.authservice.util.JwtUtil;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Claims;
import java.util.Optional;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserService userService;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final RefreshTokenRepository refreshTokens;
  private final CustomerAccountRepository customerAccounts;
  private final SecureRandom random = new SecureRandom();

  public AuthService(UserService userService, PasswordEncoder passwordEncoder,
  JwtUtil jwtUtil, RefreshTokenRepository refreshTokens,
  CustomerAccountRepository customerAccounts) {
    this.userService = userService;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
    this.refreshTokens = refreshTokens;
    this.customerAccounts = customerAccounts;
  }

  public Optional<AuthSessionDTO> authenticate(LoginRequestDTO loginRequestDTO) {
    return userService.findByEmail(loginRequestDTO.getEmail().trim().toLowerCase())
        .filter(u -> passwordEncoder.matches(loginRequestDTO.getPassword(),
            u.getPassword()) && u.isActive() && "ACTIVE".equalsIgnoreCase(u.getAccountStatus())
            )
        .map(this::createSession);
  }

  public AuthSessionDTO register(RegisterRequestDTO request) {
    var user = userService.register(request.workspaceName(), request.email(),
        request.password(), passwordEncoder);
    return createSession(user);
  }

  public Optional<AuthSessionDTO> authenticateCustomer(LoginRequestDTO request) {
    return customerAccounts.findByEmail(request.getEmail().trim().toLowerCase())
        .filter(account -> passwordEncoder.matches(request.getPassword(), account.getPassword())
            && account.isActive() && "ACTIVE".equalsIgnoreCase(account.getAccountStatus()))
        .map(account -> createSession(account.getEmail(), "CUSTOMER", "", account.getId()));
  }

  public AuthSessionDTO registerCustomer(CustomerRegisterRequestDTO request) {
    String email = request.email().trim().toLowerCase();
    if (userService.existsByEmail(email) || customerAccounts.existsByEmail(email)) {
      throw new IllegalArgumentException("An account with this email already exists");
    }
    CustomerAccount account = new CustomerAccount();
    account.setId(UUID.randomUUID());
    account.setEmail(email);
    account.setPassword(passwordEncoder.encode(request.password()));
    account.setRole("CUSTOMER");
    account.setAccountStatus("ACTIVE");
    account.setCreatedAt(Instant.now());
    account.setUpdatedAt(Instant.now());
    customerAccounts.save(account);
    return createSession(account.getEmail(), account.getRole(), "", account.getId());
  }

  public boolean validateToken(String token) {
    try {
      jwtUtil.validateToken(token);
      return true;
    } catch (JwtException e){
      return false;
    }
  }

  public Claims getClaims(String token) {
    return jwtUtil.parseClaims(token);
  }

  public AuthSessionDTO refresh(String rawToken) {
    if (rawToken == null || rawToken.isBlank()) {
      throw new IllegalArgumentException("Refresh token is required");
    }
    RefreshToken stored = refreshTokens.findByTokenHashAndRevokedAtIsNull(hash(rawToken))
        .filter(token -> token.getExpiresAt().isAfter(Instant.now()))
        .orElseThrow(() -> new IllegalArgumentException("Refresh token is invalid or expired"));
    var user = userService.findById(stored.getUserId());
    if (user.isPresent()) {
      var businessUser = user.get();
      if (!businessUser.isActive() || !"ACTIVE".equalsIgnoreCase(businessUser.getAccountStatus())) {
        throw new IllegalArgumentException("Account is inactive");
      }
      stored.setRevokedAt(Instant.now());
      refreshTokens.save(stored);
      return createSession(businessUser);
    }
    var customer = customerAccounts.findById(stored.getUserId())
        .filter(item -> item.isActive() && "ACTIVE".equalsIgnoreCase(item.getAccountStatus()))
        .orElseThrow(() -> new IllegalArgumentException("Account is inactive"));
    stored.setRevokedAt(Instant.now());
    refreshTokens.save(stored);
    return createSession(customer.getEmail(), customer.getRole(), "", customer.getId());
  }

  public void logout(String rawToken) {
    if (rawToken == null || rawToken.isBlank()) return;
    refreshTokens.findByTokenHashAndRevokedAtIsNull(hash(rawToken)).ifPresent(token -> {
      token.setRevokedAt(Instant.now());
      refreshTokens.save(token);
    });
  }

  public void revokeSessions(UUID userId) {
    refreshTokens.deleteByUserId(userId);
  }

  private AuthSessionDTO createSession(com.pm.authservice.model.User user) {
    return createSession(user.getEmail(), user.getRole(), user.getTenantId(), user.getId());
  }

  private AuthSessionDTO createSession(String email, String role, String tenantId, UUID subjectId) {
    String accessToken = jwtUtil.generateToken(email, role, tenantId);
    byte[] bytes = new byte[48];
    random.nextBytes(bytes);
    String rawRefreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    RefreshToken refreshToken = new RefreshToken();
    refreshToken.setId(UUID.randomUUID());
    refreshToken.setUserId(subjectId);
    refreshToken.setTokenHash(hash(rawRefreshToken));
    refreshToken.setCreatedAt(Instant.now());
    refreshToken.setExpiresAt(Instant.now().plusSeconds(60L * 60L * 24L * 30L));
    refreshTokens.save(refreshToken);
    return new AuthSessionDTO(accessToken, rawRefreshToken, tenantId);
  }

  private String hash(String value) {
    try {
      return Base64.getUrlEncoder().withoutPadding().encodeToString(
          MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (java.security.NoSuchAlgorithmException error) {
      throw new IllegalStateException("Token hashing is unavailable", error);
    }
  }
}
