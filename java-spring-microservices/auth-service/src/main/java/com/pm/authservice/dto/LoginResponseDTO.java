package com.pm.authservice.dto;

public class LoginResponseDTO {
  private final String token;
  private final String accessToken;
  private final String refreshToken;
  private final String tenantId;

  public LoginResponseDTO(String accessToken, String refreshToken, String tenantId) {
    this.token = accessToken;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tenantId = tenantId;
  }

  public String getToken() {
    return token;
  }

  public String getAccessToken() {
    return accessToken;
  }

  public String getTenantId() {
    return tenantId;
  }

  public String getRefreshToken() {
    return refreshToken;
  }
}
