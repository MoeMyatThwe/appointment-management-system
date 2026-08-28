package com.pm.authservice.service;

import com.pm.authservice.dto.LoginRequestDTO;
import com.pm.authservice.dto.RegisterRequestDTO;
import com.pm.authservice.util.JwtUtil;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Claims;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserService userService;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;

  public AuthService(UserService userService, PasswordEncoder passwordEncoder,
  JwtUtil jwtUtil) {
    this.userService = userService;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
  }

  public Optional<String> authenticate(LoginRequestDTO loginRequestDTO) {
    Optional<String> token = userService.findByEmail(loginRequestDTO.getEmail())
        .filter(u -> passwordEncoder.matches(loginRequestDTO.getPassword(),
            u.getPassword()) && u.isActive() && "ACTIVE".equalsIgnoreCase(u.getAccountStatus())
            )
        .map(u -> jwtUtil.generateToken(u.getEmail(), u.getRole(), u.getTenantId()));

    return token;
  }

  public String register(RegisterRequestDTO request) {
    var user = userService.register(request.workspaceName(), request.email(),
        request.password(), passwordEncoder);
    return jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getTenantId());
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
}
