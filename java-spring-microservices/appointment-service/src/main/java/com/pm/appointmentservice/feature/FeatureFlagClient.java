package com.pm.appointmentservice.feature;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class FeatureFlagClient {
  private final RestClient client;
  private final String key;

  public FeatureFlagClient(
      @Value("${auth.service.url:http://localhost:4005}") String authUrl,
      @Value("${internal.service-key:}") String key) {
    this.client = RestClient.builder().baseUrl(authUrl).build();
    this.key = key;
  }

  public boolean enabled(String tenantId, String flag) {
    FeatureFlagDTO[] flags = client.get()
        .uri("/internal/tenants/{tenantId}/flags", tenantId)
        .header("X-Internal-Service-Key", key)
        .retrieve().body(FeatureFlagDTO[].class);
    return flags != null && Arrays.stream(flags)
        .anyMatch(item -> flag.equals(item.key()) && item.enabled());
  }
}
