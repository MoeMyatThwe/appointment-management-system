package com.pm.authservice.controller;

import com.pm.authservice.dto.LoginRequestDTO;
import com.pm.authservice.dto.LoginResponseDTO;
import com.pm.authservice.dto.AuthSessionDTO;
import com.pm.authservice.dto.CurrentUserResponseDTO;
import com.pm.authservice.dto.RegisterRequestDTO;
import com.pm.authservice.dto.CustomerRegisterRequestDTO;
import com.pm.authservice.dto.WorkspaceProfileDTO;
import com.pm.authservice.model.User;
import com.pm.authservice.model.CustomerAccount;
import com.pm.authservice.service.AuthService;
import com.pm.authservice.service.UserService;
import com.pm.authservice.repository.CustomerAccountRepository;
import com.pm.authservice.service.PlatformAdminService;
import com.pm.authservice.service.SubscriptionPlanService;
import com.pm.authservice.service.StripeSubscriptionService;
import com.pm.authservice.service.SupportAccessService;
import com.pm.authservice.service.PlatformSettingsService;
import com.pm.authservice.service.RecoveryService;
import com.pm.authservice.dto.PlatformTenantDTO;
import com.pm.authservice.dto.SubscriptionDTO;
import com.pm.authservice.dto.SubscriptionPlanDTO;
import com.pm.authservice.dto.SubscriptionCheckoutRequestDTO;
import com.pm.authservice.dto.SubscriptionCheckoutResponseDTO;
import com.pm.authservice.dto.SupportAccessRequestDTO;
import com.pm.authservice.dto.SupportAccessConsentDTO;
import com.pm.authservice.dto.SupportAccessDTO;
import com.pm.authservice.dto.PlatformSettingDTO;
import com.pm.authservice.dto.FeatureFlagDTO;
import com.pm.authservice.dto.PlatformAuditEventDTO;
import com.pm.authservice.dto.RecoveryRequestDTO;
import com.pm.authservice.dto.RecoveryResetDTO;
import com.pm.authservice.dto.RecoveryResponseDTO;
import com.pm.authservice.dto.TenantExportDTO;
import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.Operation;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.UUID;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class AuthController {

  private static final Logger auditLog = LoggerFactory.getLogger("AUDIT");
  private final AuthService authService;
  private final UserService userService;
  private final PlatformAdminService platformAdminService;
  private final SubscriptionPlanService subscriptionPlanService;
  private final StripeSubscriptionService stripeSubscriptionService;
  private final SupportAccessService supportAccessService;
  private final PlatformSettingsService platformSettingsService;
  private final RecoveryService recoveryService;
  private final CustomerAccountRepository customerAccounts;
  @Value("${internal.service-key:}")
  private String internalServiceKey;

  public AuthController(AuthService authService, UserService userService,
      PlatformAdminService platformAdminService, SubscriptionPlanService subscriptionPlanService,
      StripeSubscriptionService stripeSubscriptionService, SupportAccessService supportAccessService,
      PlatformSettingsService platformSettingsService,
      RecoveryService recoveryService, CustomerAccountRepository customerAccounts) {
    this.authService = authService;
    this.userService = userService;
    this.platformAdminService = platformAdminService;
    this.subscriptionPlanService = subscriptionPlanService;
    this.stripeSubscriptionService = stripeSubscriptionService;
    this.supportAccessService = supportAccessService;
    this.platformSettingsService = platformSettingsService;
    this.recoveryService = recoveryService;
    this.customerAccounts = customerAccounts;
  }

  @PostMapping("/recovery/request")
  public ResponseEntity<?> recoveryRequest(
      @RequestBody RecoveryRequestDTO request) {
    try {
      return ResponseEntity.ok(recoveryService.request(request.email()));
    } catch (IllegalStateException error) {
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .body(Map.of("message", error.getMessage()));
    }
  }

  @PostMapping("/recovery/reset")
  public ResponseEntity<Void> recoveryReset(@RequestBody RecoveryResetDTO request) {
    recoveryService.reset(request.token(), request.newPassword());
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/refresh")
  public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
    try {
      AuthSessionDTO session = authService.refresh(request.get("refreshToken"));
      return ResponseEntity.ok(new LoginResponseDTO(session.accessToken(), session.refreshToken(), session.tenantId()));
    } catch (IllegalArgumentException error) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", error.getMessage()));
    }
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@RequestBody(required = false) Map<String, String> request) {
    authService.logout(request == null ? null : request.get("refreshToken"));
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "Get the authenticated user")
  @GetMapping("/me")
  public ResponseEntity<CurrentUserResponseDTO> currentUser(
      @RequestHeader(value = "Authorization", required = false) String authHeader) {
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    String token = authHeader.substring(7);
    if (!authService.validateToken(token)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    String email = authService.getClaims(token).getSubject();
    Optional<User> userOptional = userService.findByEmail(email);
    if (userOptional.isEmpty()) {
      return customerAccounts.findByEmail(email)
          .filter(account -> account.isActive() && "ACTIVE".equalsIgnoreCase(account.getAccountStatus()))
          .map(account -> ResponseEntity.ok(new CurrentUserResponseDTO(
              account.getId().toString(), "", account.getEmail(), account.getEmail(),
              account.getRole(), "", "UTC", true)))
          .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    User user = userOptional.get();
    if (!user.isActive() || !"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    return ResponseEntity.ok(new CurrentUserResponseDTO(
        user.getId().toString(),
        user.getTenantId(),
        user.getEmail(),
        user.getEmail(),
        user.getRole(),
        user.getTenantName(),
        user.getTimezone() == null ? "UTC" : user.getTimezone(),
        user.isOnboardingCompleted()));
  }

  @GetMapping("/internal/tenants/{tenantId}/timezone")
  public ResponseEntity<String> tenantTimezone(@PathVariable String tenantId,
      @RequestHeader(value = "X-Internal-Service-Key", required = false) String serviceKey) {
    if (internalServiceKey.isBlank() || !internalServiceKey.equals(serviceKey)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    return ResponseEntity.ok(userService.getTenantTimezone(tenantId));
  }

  @GetMapping("/internal/tenants/{tenantId}/name")
  public ResponseEntity<String> tenantName(@PathVariable String tenantId,
      @RequestHeader(value = "X-Internal-Service-Key", required = false) String serviceKey) {
    if (internalServiceKey.isBlank() || !internalServiceKey.equals(serviceKey)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    return ResponseEntity.ok(userService.getTenantName(tenantId));
  }

  @Operation(summary = "Get the current workspace profile")
  @GetMapping("/workspace")
  public ResponseEntity<WorkspaceProfileDTO> workspace(
      @RequestHeader(value = "Authorization", required = false) String authHeader) {
    String email = authenticatedEmail(authHeader);
    return ResponseEntity.ok(userService.getWorkspace(email));
  }

  @Operation(summary = "Update the current workspace profile")
  @org.springframework.web.bind.annotation.PutMapping("/workspace")
  public ResponseEntity<WorkspaceProfileDTO> updateWorkspace(
      @RequestHeader(value = "Authorization", required = false) String authHeader,
      @jakarta.validation.Valid @RequestBody WorkspaceProfileDTO profile) {
    String email = authenticatedEmail(authHeader);
    return ResponseEntity.ok(userService.updateWorkspace(email, profile));
  }

  @Operation(summary = "Generate token on user login")
  @PostMapping("/login")
  public ResponseEntity<LoginResponseDTO> login(
      @RequestBody LoginRequestDTO loginRequestDTO) {

    Optional<AuthSessionDTO> sessionOptional = authService.authenticate(loginRequestDTO);

    if (sessionOptional.isEmpty()) {
      auditLog.warn("event=LOGIN_FAILURE email={}", loginRequestDTO.getEmail());
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    AuthSessionDTO session = sessionOptional.get();
    auditLog.info("event=LOGIN_SUCCESS email={}", loginRequestDTO.getEmail());
    return ResponseEntity.ok(new LoginResponseDTO(session.accessToken(), session.refreshToken(), session.tenantId()));
  }

  @Operation(summary = "Create a workspace and owner account")
  @PostMapping("/register")
  public ResponseEntity<?> register(
      @jakarta.validation.Valid @RequestBody RegisterRequestDTO request) {
    try {
        AuthSessionDTO session = authService.register(request);
        return ResponseEntity.ok(new LoginResponseDTO(session.accessToken(), session.refreshToken(), session.tenantId()));
    } catch (IllegalArgumentException error) {
      return ResponseEntity.status(HttpStatus.CONFLICT)
          .body(Map.of("message", error.getMessage()));
    }

  }

  @Operation(summary = "Generate token on customer login")
  @PostMapping("/customer/login")
  public ResponseEntity<LoginResponseDTO> customerLogin(
      @RequestBody LoginRequestDTO loginRequestDTO) {
    Optional<AuthSessionDTO> sessionOptional = authService.authenticateCustomer(loginRequestDTO);
    if (sessionOptional.isEmpty()) {
      auditLog.warn("event=CUSTOMER_LOGIN_FAILURE email={}", loginRequestDTO.getEmail());
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    AuthSessionDTO session = sessionOptional.get();
    auditLog.info("event=CUSTOMER_LOGIN_SUCCESS email={}", loginRequestDTO.getEmail());
    return ResponseEntity.ok(new LoginResponseDTO(session.accessToken(), session.refreshToken(), session.tenantId()));
  }

  @Operation(summary = "Create a customer account")
  @PostMapping("/customer/register")
  public ResponseEntity<?> customerRegister(
      @jakarta.validation.Valid @RequestBody CustomerRegisterRequestDTO request) {
    try {
      AuthSessionDTO session = authService.registerCustomer(request);
      return ResponseEntity.ok(new LoginResponseDTO(session.accessToken(), session.refreshToken(), session.tenantId()));
    } catch (IllegalArgumentException error) {
      return ResponseEntity.status(HttpStatus.CONFLICT)
          .body(Map.of("message", error.getMessage()));
    }
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException error) {
    String message = error.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(fieldError -> switch (fieldError.getField()) {
          case "workspaceName" -> "Enter a business name.";
          case "email" -> "Enter a valid email address.";
          case "password" -> "Use a password between 8 and 100 characters.";
          default -> "Check the highlighted fields and try again.";
        })
        .orElse("Check the highlighted fields and try again.");
    return ResponseEntity.badRequest().body(Map.of("message", message));
  }

  @Operation(summary = "Validate Token")
  @GetMapping("/validate")
  public ResponseEntity<Void> validateToken(
      @RequestHeader("Authorization") String authHeader) {

    // Authorization: Bearer <token>
    if(authHeader == null || !authHeader.startsWith("Bearer ")) {
      auditLog.warn("event=TOKEN_VALIDATION_FAILURE reason=missing_bearer");
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    if (!authService.validateToken(authHeader.substring(7))) {
      auditLog.warn("event=TOKEN_VALIDATION_FAILURE reason=invalid_token");
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    var claims = authService.getClaims(authHeader.substring(7));
    Optional<User> user = userService.findByEmail(claims.getSubject());
    Optional<CustomerAccount> customer = customerAccounts.findByEmail(claims.getSubject());
    if (user.isEmpty() && customer.isEmpty()) {
      auditLog.warn("event=TOKEN_VALIDATION_FAILURE reason=inactive_or_missing_user subject={}",
          claims.getSubject());
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    if (user.isPresent() && (!user.get().isActive()
        || !"ACTIVE".equalsIgnoreCase(user.get().getAccountStatus()))) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    if (customer.isPresent() && (!customer.get().isActive()
        || !"ACTIVE".equalsIgnoreCase(customer.get().getAccountStatus()))) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    HttpHeaders headers = new HttpHeaders();
    if (user.isPresent()) {
      headers.set("X-User-ID", user.get().getId().toString());
      headers.set("X-Tenant-ID", user.get().getTenantId());
      headers.set("X-User-Role", user.get().getRole());
      headers.set("X-User-Email", user.get().getEmail());
      headers.set("X-Timezone", user.get().getTimezone() == null ? "UTC" : user.get().getTimezone());
    } else {
      headers.set("X-User-ID", customer.get().getId().toString());
      headers.set("X-Tenant-ID", "");
      headers.set("X-User-Role", customer.get().getRole());
      headers.set("X-User-Email", customer.get().getEmail());
      headers.set("X-Timezone", "UTC");
    }
    auditLog.info("event=TOKEN_VALIDATION_SUCCESS subject={}", claims.getSubject());
    return ResponseEntity.ok().headers(headers).build();
  }

  @GetMapping("/platform/tenants")
  public ResponseEntity<?> platformTenants(
      @RequestHeader("X-User-Role") String role,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "ALL") String status,
      @RequestParam(defaultValue = "ALL") String plan) {
    requirePlatformAdmin(role);
    if (page != null || size != null || !search.isBlank() || !"ALL".equals(status) || !"ALL".equals(plan)) {
      int safePage = Math.max(page == null ? 0 : page, 0);
      int safeSize = Math.min(Math.max(size == null ? 25 : size, 1), 100);
      return ResponseEntity.ok(platformAdminService.tenants(
          PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "tenantName")),
          search, status, plan));
    }
    return ResponseEntity.ok(platformAdminService.tenants());
  }

  @org.springframework.web.bind.annotation.PatchMapping("/platform/tenants/{tenantId}/status")
  public ResponseEntity<PlatformTenantDTO> updateTenantStatus(
      @org.springframework.web.bind.annotation.PathVariable String tenantId,
      @RequestParam boolean active, @RequestHeader("X-User-Role") String role) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(platformAdminService.setStatus(tenantId, active));
  }

  @org.springframework.web.bind.annotation.PostMapping("/platform/tenants/{tenantId}/deletion-request")
  public ResponseEntity<PlatformTenantDTO> requestTenantDeletion(
      @org.springframework.web.bind.annotation.PathVariable String tenantId,
      @RequestHeader("X-User-Role") String role) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(platformAdminService.requestDeletion(tenantId));
  }

  @GetMapping("/platform/tenants/{tenantId}/export")
  public ResponseEntity<TenantExportDTO> exportTenant(
      @PathVariable String tenantId, @RequestHeader("X-User-Role") String role) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(platformAdminService.exportTenant(tenantId));
  }

  @org.springframework.web.bind.annotation.DeleteMapping("/platform/tenants/{tenantId}")
  public ResponseEntity<Void> permanentlyDeleteTenant(
      @PathVariable String tenantId, @RequestParam String confirmation,
      @RequestHeader("X-User-Role") String role) {
    requirePlatformAdmin(role);
    platformAdminService.permanentlyDelete(tenantId, confirmation);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/platform/plans")
  public ResponseEntity<List<SubscriptionPlanDTO>> platformPlans(
      @RequestHeader("X-User-Role") String role) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(subscriptionPlanService.plans());
  }

  @GetMapping("/plans")
  public ResponseEntity<List<SubscriptionPlanDTO>> plans() {
    return ResponseEntity.ok(subscriptionPlanService.plans());
  }

  @org.springframework.web.bind.annotation.PatchMapping("/platform/tenants/{tenantId}/plan")
  public ResponseEntity<PlatformTenantDTO> updateTenantPlan(
      @org.springframework.web.bind.annotation.PathVariable String tenantId,
      @RequestParam String plan, @RequestHeader("X-User-Role") String role) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(platformAdminService.setPlan(tenantId, plan));
  }

  @GetMapping("/subscription")
  public ResponseEntity<SubscriptionDTO> subscription(
      @RequestHeader(value = "Authorization", required = false) String authHeader) {
    String email = authenticatedEmail(authHeader);
    User user = userService.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    SubscriptionPlanDTO plan = subscriptionPlanService.find(user.getSubscriptionPlan());
    return ResponseEntity.ok(new SubscriptionDTO(
        plan.code(), user.getSubscriptionStatus(), plan.monthlyPriceCents(), "USD"));
  }

  @PostMapping("/subscription/checkout")
  public ResponseEntity<SubscriptionCheckoutResponseDTO> subscriptionCheckout(
      @RequestHeader(value = "Authorization", required = false) String authHeader,
      @RequestBody SubscriptionCheckoutRequestDTO request) {
    String email = authenticatedEmail(authHeader);
    User user = userService.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    requireTenantBillingAdmin(user);
    return ResponseEntity.ok(stripeSubscriptionService.createCheckout(user, request.plan()));
  }

  @PostMapping("/subscription/cancel")
  public ResponseEntity<SubscriptionDTO> cancelSubscription(
      @RequestHeader(value = "Authorization", required = false) String authHeader) {
    String email = authenticatedEmail(authHeader);
    User user = userService.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    requireTenantBillingAdmin(user);
    stripeSubscriptionService.cancel(user);
    var plan = subscriptionPlanService.find(user.getSubscriptionPlan());
    return ResponseEntity.ok(new SubscriptionDTO(
        plan.code(), user.getSubscriptionStatus(), plan.monthlyPriceCents(), "USD"));
  }

  @PostMapping("/stripe/webhook")
  public ResponseEntity<Void> stripeWebhook(
      @RequestBody String payload,
      @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
    if (signature == null || signature.isBlank()) return ResponseEntity.badRequest().build();
    stripeSubscriptionService.handleWebhook(payload, signature);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/platform/tenants/{tenantId}/support-access")
  public ResponseEntity<SupportAccessDTO> requestSupportAccess(
      @PathVariable String tenantId, @RequestBody SupportAccessRequestDTO request,
      @RequestHeader("X-User-Role") String role, @RequestHeader("X-User-Email") String actor) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(supportAccessService.request(tenantId, actor, request.reason(), request.durationMinutes()));
  }

  @GetMapping("/platform/support-access")
  public ResponseEntity<List<SupportAccessDTO>> supportAccess(
      @RequestHeader("X-User-Role") String role) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(supportAccessService.all());
  }

  @GetMapping("/support-access")
  public ResponseEntity<List<SupportAccessDTO>> tenantSupportAccess(
      @RequestHeader("X-Tenant-ID") String tenantId,
      @RequestHeader("X-User-Role") String role) {
    requireTenantAdmin(role);
    return ResponseEntity.ok(supportAccessService.forTenant(tenantId));
  }

  @GetMapping("/platform/audit-events")
  public ResponseEntity<?> platformAuditEvents(
      @RequestParam(required = false) String tenantId,
      @RequestParam(required = false) String actor,
      @RequestParam(required = false) String action,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestHeader("X-User-Role") String role) {
    requirePlatformAdmin(role);
    if (page != null || size != null) {
      return ResponseEntity.ok(supportAccessService.auditEvents(
          PageRequest.of(Math.max(page == null ? 0 : page, 0), Math.min(Math.max(size == null ? 25 : size, 1), 100)),
          tenantId, actor, action));
    }
    return ResponseEntity.ok(supportAccessService.auditEvents(tenantId, actor, action));
  }

  @PostMapping("/platform/support-access/{id}/revoke")
  public ResponseEntity<SupportAccessDTO> revokeSupportAccess(
      @PathVariable UUID id, @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-Email") String actor) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(supportAccessService.revoke(id, actor));
  }

  @PostMapping("/support-access/{id}/consent")
  public ResponseEntity<SupportAccessDTO> consentSupportAccess(
      @PathVariable UUID id, @RequestBody SupportAccessConsentDTO request,
      @RequestHeader(value = "Authorization", required = false) String authHeader) {
    String email = authenticatedEmail(authHeader);
    User user = userService.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    requireTenantBillingAdmin(user);
    return ResponseEntity.ok(supportAccessService.consent(id, user.getTenantId(), email, request.approved()));
  }

  @GetMapping("/platform/settings")
  public ResponseEntity<List<PlatformSettingDTO>> platformSettings(
      @RequestHeader("X-User-Role") String role) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(platformSettingsService.settings());
  }

  @org.springframework.web.bind.annotation.PatchMapping("/platform/settings/{key}")
  public ResponseEntity<PlatformSettingDTO> updatePlatformSetting(
      @PathVariable String key, @RequestParam String value,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-Email") String actor) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(platformSettingsService.updateSetting(key, value, actor));
  }

  @GetMapping("/platform/tenants/{tenantId}/flags")
  public ResponseEntity<List<FeatureFlagDTO>> tenantFeatureFlags(
      @PathVariable String tenantId, @RequestHeader("X-User-Role") String role) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(platformSettingsService.flags(tenantId));
  }

  @GetMapping("/internal/tenants/{tenantId}/flags")
  public ResponseEntity<List<FeatureFlagDTO>> internalTenantFeatureFlags(
      @PathVariable String tenantId,
      @RequestHeader(value = "X-Internal-Service-Key", required = false) String key) {
    if (internalServiceKey.isBlank() || !internalServiceKey.equals(key)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    return ResponseEntity.ok(platformSettingsService.flags(tenantId));
  }

  @GetMapping("/tenant-flags")
  public ResponseEntity<List<FeatureFlagDTO>> currentTenantFeatureFlags(
      @RequestHeader(value = "Authorization", required = false) String authHeader) {
    String email = authenticatedEmail(authHeader);
    User user = userService.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return ResponseEntity.ok(platformSettingsService.flags(user.getTenantId()));
  }

  @org.springframework.web.bind.annotation.PatchMapping("/platform/tenants/{tenantId}/flags/{key}")
  public ResponseEntity<FeatureFlagDTO> updateTenantFeatureFlag(
      @PathVariable String tenantId, @PathVariable String key, @RequestParam boolean enabled,
      @RequestHeader("X-User-Role") String role,
      @RequestHeader("X-User-Email") String actor) {
    requirePlatformAdmin(role);
    return ResponseEntity.ok(platformSettingsService.updateFlag(tenantId, key, enabled, actor));
  }

  private String authenticatedEmail(String authHeader) {
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      throw new org.springframework.security.access.AccessDeniedException("Authentication required");
    }
    String token = authHeader.substring(7);
    if (!authService.validateToken(token)) {
      throw new org.springframework.security.access.AccessDeniedException("Invalid token");
    }
    String email = authService.getClaims(token).getSubject();
    User user = userService.findByEmail(email)
        .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Account not found"));
    if (!user.isActive() || !"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
      throw new org.springframework.security.access.AccessDeniedException("Account is inactive");
    }
    return user.getEmail();
  }

  private void requirePlatformAdmin(String role) {
    if (!"PLATFORM_ADMIN".equalsIgnoreCase(role)) {
      throw new org.springframework.web.server.ResponseStatusException(
          HttpStatus.FORBIDDEN, "Platform administrator role required");
    }
  }

  private void requireTenantBillingAdmin(User user) {
    if (!"TENANT_ADMIN".equalsIgnoreCase(user.getRole())
        && !"ADMIN".equalsIgnoreCase(user.getRole())) {
      throw new org.springframework.web.server.ResponseStatusException(
          HttpStatus.FORBIDDEN, "Tenant administrator role required");
    }
  }

  private void requireTenantAdmin(String role) {
    if (!"TENANT_ADMIN".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
      throw new org.springframework.web.server.ResponseStatusException(
          HttpStatus.FORBIDDEN, "Tenant administrator role required");
    }
  }

  private User authenticatedUser(String authHeader) {
    String email = authenticatedEmail(authHeader);
    return userService.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
  }
}
