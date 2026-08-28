package com.pm.authservice.service;

import com.pm.authservice.dto.FeatureFlagDTO;
import com.pm.authservice.dto.PlatformSettingDTO;
import com.pm.authservice.model.PlatformSetting;
import com.pm.authservice.model.TenantFeatureFlag;
import com.pm.authservice.repository.PlatformSettingRepository;
import com.pm.authservice.repository.TenantFeatureFlagRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PlatformSettingsService {
  private static final Map<String, String> DEFAULT_SETTINGS = Map.of(
      "maintenance_mode", "false",
      "new_registration_enabled", "true",
      "public_booking_enabled", "true",
      "stripe_billing_enabled", "true");
  private static final Map<String, Boolean> DEFAULT_FLAGS = Map.of(
      "ONLINE_BOOKING", true,
      "REPORTS", true,
      "STRIPE_APPOINTMENT_PAYMENTS", true,
      "NOTIFICATIONS", true);

  private final PlatformSettingRepository settings;
  private final TenantFeatureFlagRepository flags;

  public PlatformSettingsService(PlatformSettingRepository settings, TenantFeatureFlagRepository flags) {
    this.settings = settings;
    this.flags = flags;
  }

  public List<PlatformSettingDTO> settings() {
    Map<String, String> values = new LinkedHashMap<>(DEFAULT_SETTINGS);
    settings.findAll().forEach(setting -> values.put(setting.getSettingKey(), setting.getSettingValue()));
    return values.entrySet().stream().map(entry -> new PlatformSettingDTO(entry.getKey(), entry.getValue())).toList();
  }

  public PlatformSettingDTO updateSetting(String key, String value, String actor) {
    if (!DEFAULT_SETTINGS.containsKey(key)) throw new IllegalArgumentException("Unknown platform setting");
    if ("true".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value)) {
      value = value.toLowerCase();
    } else if ("maintenance_mode".equals(key) || "new_registration_enabled".equals(key)
        || "public_booking_enabled".equals(key) || "stripe_billing_enabled".equals(key)) {
      throw new IllegalArgumentException("Boolean setting required");
    }
    PlatformSetting setting = settings.findById(key).orElseGet(PlatformSetting::new);
    setting.setSettingKey(key);
    setting.setSettingValue(value);
    setting.setUpdatedBy(actor);
    setting.setUpdatedAt(Instant.now());
    settings.save(setting);
    return new PlatformSettingDTO(key, value);
  }

  public List<FeatureFlagDTO> flags(String tenantId) {
    Map<String, Boolean> values = new LinkedHashMap<>(DEFAULT_FLAGS);
    flags.findAllByTenantId(tenantId).forEach(flag -> values.put(flag.getFlagKey(), flag.isEnabled()));
    return values.entrySet().stream().map(entry -> new FeatureFlagDTO(entry.getKey(), entry.getValue())).toList();
  }

  public FeatureFlagDTO updateFlag(String tenantId, String key, boolean enabled, String actor) {
    if (!DEFAULT_FLAGS.containsKey(key)) throw new IllegalArgumentException("Unknown feature flag");
    TenantFeatureFlag flag = flags.findByTenantIdAndFlagKey(tenantId, key)
        .orElseGet(TenantFeatureFlag::new);
    flag.setTenantId(tenantId);
    flag.setFlagKey(key);
    flag.setEnabled(enabled);
    flag.setUpdatedBy(actor);
    flag.setUpdatedAt(Instant.now());
    flags.save(flag);
    return new FeatureFlagDTO(key, enabled);
  }
}
