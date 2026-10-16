package com.pm.authservice.service;

import com.pm.authservice.model.User;
import com.pm.authservice.dto.WorkspaceProfileDTO;
import com.pm.authservice.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

  private final UserRepository userRepository;

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }
  
  public Optional<User> findByEmail(String email) {
    return userRepository.findByEmail(email);
  }

  public boolean existsByEmail(String email) {
    return userRepository.existsByEmail(email);
  }

  public Optional<User> findById(UUID id) {
    return userRepository.findById(id);
  }

  public User save(User user) {
    return userRepository.save(user);
  }

  public User register(String workspaceName, String email, String password,
      PasswordEncoder passwordEncoder) {
    String normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
      throw new IllegalArgumentException("A valid email address is required");
    }
    String domain = normalizedEmail.substring(normalizedEmail.indexOf('@') + 1);
    if (domain.equals("example.com") || domain.equals("example.net")
        || domain.equals("example.org") || domain.equals("test.com")
        || domain.equals("gm.com")) {
      throw new IllegalArgumentException("A real email address is required");
    }
    if (userRepository.existsByEmail(normalizedEmail)) {
      throw new IllegalArgumentException("An account with this email already exists");
    }
    User user = new User();
    user.setEmail(normalizedEmail);
    user.setPassword(passwordEncoder.encode(password));
    user.setRole("TENANT_ADMIN");
    user.setTenantId(UUID.randomUUID().toString());
    user.setTenantName(workspaceName);
    user.setBusinessType("OTHER");
    user.setTimezone("UTC");
    user.setCurrency("USD");
    user.setOnboardingCompleted(false);
    user.setAccountStatus("ACTIVE");
    return userRepository.save(user);
  }

  public WorkspaceProfileDTO getWorkspace(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return toWorkspaceProfile(user);
  }

  public String getTenantTimezone(String tenantId) {
    return userRepository.findFirstByTenantId(tenantId)
        .map(User::getTimezone)
        .filter(timezone -> timezone != null && !timezone.isBlank())
        .orElse("UTC");
  }

  public String getTenantName(String tenantId) {
    return userRepository.findFirstByTenantId(tenantId)
        .map(User::getTenantName)
        .filter(name -> name != null && !name.isBlank())
        .orElse("Book an appointment");
  }

  public WorkspaceProfileDTO updateWorkspace(String email, WorkspaceProfileDTO profile) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    user.setTenantName(profile.tenantName().trim());
    user.setBusinessType(profile.businessType().trim());
    user.setBusinessPhone(profile.businessPhone());
    user.setTimezone(profile.timezone());
    user.setCurrency(profile.currency());
    user.setOnboardingCompleted(profile.onboardingCompleted());
    userRepository.save(user);
    return toWorkspaceProfile(user);
  }

  private WorkspaceProfileDTO toWorkspaceProfile(User user) {
    return new WorkspaceProfileDTO(
        user.getTenantName(),
        user.getBusinessType(),
        user.getBusinessPhone(),
        user.getTimezone(),
        user.getCurrency(),
        user.isOnboardingCompleted());
  }
}
