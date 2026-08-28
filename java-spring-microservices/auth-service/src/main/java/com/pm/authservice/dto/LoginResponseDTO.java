package com.pm.authservice.dto;

public class LoginResponseDTO {
  private final String token;
  private final String accessToken;

  public LoginResponseDTO(String token) {
    this.token = token;
    this.accessToken = token;
  }

  public String getToken() {
    return token;
  }

  public String getAccessToken() {
    return accessToken;
  }
}
