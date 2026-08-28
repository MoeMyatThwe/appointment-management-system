package com.pm.appointmentservice.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class AccessPolicy {
  private AccessPolicy() {}

  public static void requireBusinessUser(String role) {
    if (!isAny(role, "TENANT_ADMIN", "ADMIN", "MANAGER", "STAFF")) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Business user role required");
    }
  }

  public static void requireManager(String role) {
    if (!isAny(role, "TENANT_ADMIN", "ADMIN", "MANAGER")) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Manager role required");
    }
  }

  private static boolean isAny(String role, String... allowed) {
    for (String candidate : allowed) {
      if (candidate.equalsIgnoreCase(role)) return true;
    }
    return false;
  }
}
