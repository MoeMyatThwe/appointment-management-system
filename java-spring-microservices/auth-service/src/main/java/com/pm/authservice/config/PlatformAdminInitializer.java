package com.pm.authservice.config;

import com.pm.authservice.model.User;
import com.pm.authservice.repository.UserRepository;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PlatformAdminInitializer {
  @Bean
  CommandLineRunner provisionPlatformAdmin(UserRepository users, PasswordEncoder encoder,
      @Value("${platform.admin.email:}") String email,
      @Value("${platform.admin.password:}") String password) {
    return args -> {
      if (email.isBlank() || password.isBlank() || users.findByEmail(email).isPresent()) return;
      User admin = new User();
      admin.setEmail(email); admin.setPassword(encoder.encode(password));
      admin.setRole("PLATFORM_ADMIN"); admin.setTenantId("PLATFORM");
      admin.setTenantName("SaaS Platform"); admin.setBusinessType("PLATFORM");
      admin.setTimezone("UTC"); admin.setCurrency("USD");
      admin.setOnboardingCompleted(true); admin.setActive(true);
      admin.setAccountStatus("ACTIVE");
      users.save(admin);
    };
  }
}
